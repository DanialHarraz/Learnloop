const StreakModel = require('../models/streakModel');
const AccountabilityModel = require('../models/accountabilityModel');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



// Create or update streak for a user
module.exports.createStreak = async (req, res) => {
    const { userId } = req.body;
    try {
        const streak = await StreakModel.getOrCreateStreak(userId);
        res.status(200).json(streak);
    } catch (error) {
        console.error("Error creating streak:", error);
        res.status(500).json({ error: "Error creating streak" });
    }
};


module.exports.setAccountabilityPartner = async (req, res) => {
    const { userId, partnerId } = req.body;
    try {
        const accountability = await AccountabilityModel.createAccountabilityPartner(userId, partnerId);
        res.status(200).json(accountability);
    } catch (error) {
        console.error("Error setting accountability partner:", error);
        res.status(500).json({ error: "Error setting accountability partner" });
    }
};



module.exports.getStreak = async (req, res) => {
    const { userId } = req.params;
    try {
        const streak = await StreakModel.getStreakByUserId(userId);
        if (!streak) return res.status(404).json({ message: 'Streak not found' });
        res.json(streak);
    } catch (error) {
        console.error('Error fetching streak:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports.getPartnerProgress = async (req, res) => {
    const { userId } = req.params;
    try {
        const progress = await AccountabilityModel.getPartnerProgress(userId);
        if (!progress || progress.length === 0) return res.status(404).json({ error: "No partner data found" });

       
        const partnerProgressData = await Promise.all(progress.map(async (partner) => {
            const completedTasks = await AccountabilityModel.getTodaysCompletedTasks(partner.partnerId);

            return {
                partnerDetails: partner.partnerDetails,
                partnerStreak: partner.partnerStreak,
                partnerStreakData: partner.partnerStreakData,
                completedTasks: completedTasks,
            };
        }));

        res.status(200).json(partnerProgressData); 
    } catch (error) {
        console.error("Error fetching partner progress:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports.getCurrentStreakLeaderboard = async (req, res) => {
    try {
        const leaderboard = await prisma.streak.findMany({
            select: {
                userId: true,
                currentStreak: true,
                user: { select: { name: true, avatar: true } }
            },
            orderBy: { currentStreak: 'desc' },
            take: 10 
        });

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error fetching current streak leaderboard:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getLongestStreakLeaderboard = async (req, res) => {
    try {
        const leaderboard = await prisma.streak.findMany({
            select: {
                userId: true,
                longestStreak: true,
                user: { select: { name: true, avatar: true } }
            },
            orderBy: { longestStreak: 'desc' },
            take: 10
        });

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error fetching longest streak leaderboard:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getPartnerStreakLeaderboard = async (req, res) => {
    try {
        const leaderboard = await prisma.accountabilityPartner.findMany({
            where: { status: "ACCEPTED" },
            select: {
                userId: true,
                partnerId: true,
                partnerStreak: true,
                user: { select: { name: true, avatar: true } },
                partner: { select: { name: true, avatar: true } }
            },
            orderBy: { partnerStreak: 'desc' },
            take: 10
        });

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error fetching partner streak leaderboard:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};




module.exports.getUsers = async (req, res) => {
    try {
        const users = await StreakModel.getUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Error fetching users" });
    }
}


module.exports.checkPartnerStatus = async (req, res) => {
    const { userId } = req.params;
    try {
        const hasPartner = await AccountabilityModel.checkIfPartnerExists(userId, null); 
        return res.status(200).json({ hasPartner });
    } catch (error) {
        console.error("Error checking partner status:", error);
        return res.status(500).json({ message: "Error checking partner status" });
    }
};

module.exports.sendPartnerRequest = async (req, res) => {
    const { userId, partnerId } = req.body;
    const partnerIdInt = parseInt(partnerId, 10);
    const userIdInt = parseInt(userId, 10);

    try {
        console.log("Checking if partner exists:", userIdInt, partnerId);
        const partnerExists = await AccountabilityModel.checkIfPartnerExists(userIdInt, partnerIdInt);
        console.log("Partner exists:", partnerExists);
        if (partnerExists) {
            return res.status(400).json({ message: "You are already partners" });
        }

        // Check if there's a rejected request between the two
        const rejectedRequest = await AccountabilityModel.checkRejectedRequest(userIdInt, partnerIdInt);
        if (rejectedRequest) {
            // If rejected, update the status to pending instead of creating a new row
            const updatedRequest = await AccountabilityModel.updateRequestToPending(userIdInt, partnerIdInt);
            return res.status(200).json({ message: "Request status updated to PENDING" });
        }

        
        const request = await AccountabilityModel.savePartnerRequest(userIdInt, partnerIdInt);
        if (!request) {
            return res.status(500).json({ message: "Failed to send request" });
        }

        return res.status(200).json({ message: "Request sent" });
    } catch (error) {
        console.error('Error handling partner request:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};





module.exports.acceptPartnerRequest = async (req, res) => {
    const { requestId } = req.body;

    try {
       
        const success = await AccountabilityModel.acceptPartnerRequest(requestId);
        if (!success) {
            return res.status(500).json({ message: "Failed to accept request" });
        }

        return res.status(200).json({ message: "Partner accepted successfully" });
    } catch (error) {
        console.error('Error accepting partner request:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports.rejectPartnerRequest = async (req, res) => {
    const {requestId} = req.body;
    try {
        await AccountabilityModel.rejectPartnerRequest(requestId);
        return res.status(200).json({ message: "Partner request rejected" });
    } catch (error) {
        console.error('Error rejecting partner request:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports.getPartnerRequests = async (req, res) => {
    const { userId } = req.params; 
    try {
        const userIdInt = parseInt(userId, 10);
        const requests = await AccountabilityModel.getPartnerRequests(userIdInt);
        if (!requests || requests.length === 0) {
            return res.status(404).json({ message: "No partner requests found" });
        }
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching partner requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports.getSentRequests = async (req, res) => {
    const { userId } = req.params;
    try {
        const userIdInt = parseInt(userId, 10);
        const status = await AccountabilityModel.getSentRequests(userIdInt);
        if (!status) {
            return res.status(404).json({ message: "No request status found" });
        }
        res.status(200).json(status);
    } catch (error) {
        console.error("Error fetching request status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.cancelRequest = async (req, res) => {
    requestId = parseInt(req.params.requestId)
    try {
        await AccountabilityModel.cancelRequest(requestId);
        return res.status(200).json({ message: "Request cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.getUserStreakNotifications = async (req, res) => {
    const userId = parseInt(req.params.userId); 
    try {
        const notifications = await StreakModel.getUserStreakNotifications(userId);
        return res.status(200).json(notifications); 
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.markStreakNotificationAsRead = async (req, res) => {
    const notificationId = parseInt(req.body.notificationId); 
    try {
        await StreakModel.markStreakNotificationAsRead(notificationId); 
        return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}



module.exports.nudgePartnerController = async (req, res) => {
  try {
    const { senderId,partnerId } = req.body; 
    const result = await StreakModel.sendNudgeToPartner(senderId,partnerId)

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Nudge sent to partner ${partnerId} successfully!`,
      });
    } else {
      return res.status(500).json({ success: false, message: result.message || "Failed to send nudge." });
    }
  } catch (error) {
    console.error("Error in nudgePartnerController:", error);
    return res.status(500).json({ success: false, message: "An error occurred while sending the nudge." });
  }
};
