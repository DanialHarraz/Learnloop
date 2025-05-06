const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


module.exports.createAccountabilityPartner = async (userId, partnerId) => {
    try {
        const userIdInt = parseInt(userId, 10);
        const partnerIdInt = parseInt(partnerId, 10);

        
        const existingPair = await prisma.accountabilityPartner.findFirst({
            where: {
                OR: [
                    { userId: userIdInt, partnerId: partnerIdInt, status: 'ACCEPTED' },
                    { userId: partnerIdInt, partnerId: userIdInt, status: 'ACCEPTED' }
                ]
            }
        });

        if (existingPair) throw new Error("Accountability partner already exists.");

        // Create accountability partner
        return await prisma.accountabilityPartner.create({
            data: {
                userId: userIdInt,
                partnerId: partnerIdInt
            }
        });

    } catch (error) {
        console.error("Error creating accountability partner:", error);
        throw error;
    }
};

module.exports.getTodaysCompletedTasks = async (userId) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const completedTasks = await prisma.taskTracking.findMany({
            where: {
                ProgressTracker: {
                    userId: parseInt(userId, 10), 
                },
                isCompleted: true,
                completedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                id: true,
                title: true,
                completedAt: true,
                progressTrackerId: true,
            },
        });
        

        return completedTasks;
    } catch (error) {
        console.error("Error fetching completed tasks:", error);
        throw new Error("Unable to retrieve completed tasks for today.");
    }
};


module.exports.getPartnerProgress = async (userId) => {
    try {
        const userIdInt = parseInt(userId, 10);
        console.log("User ID (parsed):", userIdInt);

        const accountabilityPartners = await prisma.accountabilityPartner.findMany({
            where: {
                OR: [
                    { userId: userIdInt, status: 'ACCEPTED' },
                    { partnerId: userIdInt, status: 'ACCEPTED' }
                ]
            },
            select: {
                userId: true,
                partnerId: true,
                partnerStreak: true,
                user: { select: { id: true, name: true, avatar: true } },
                partner: { select: { id: true, name: true, avatar: true } }
            }
        });

        console.log("Accountability Partners:", accountabilityPartners);

        if (accountabilityPartners.length === 0) throw new Error("No active accountability partners found.");

        const partnersData = await Promise.all(accountabilityPartners.map(async (entry) => {
            const partnerId = entry.userId === userIdInt ? entry.partnerId : entry.userId;
            console.log("Partner ID for entry:", partnerId);

            // Fetch streak data
            const partnerStreakData = await prisma.streak.findUnique({ where: { userId: partnerId } });
            console.log(`Partner Streak Data for ${partnerId}:`, partnerStreakData);

                
            const partnerStreak = entry.partnerStreak;
            console.log(`Partner Streak from accountability table for ${partnerId}:`, partnerStreak);

            return {
                partnerId,
                partnerDetails: entry.userId === userIdInt ? entry.partner : entry.user,
                partnerStreak,
                partnerStreakData
            };
        }));

        console.log("Partners Data:", partnersData);
        return partnersData;

    } catch (error) {
        console.error("Error fetching partner progress:", error);
        throw new Error("Unable to retrieve accountability partners' progress.");
    }
};








// Remove accountability partner
module.exports.removeAccountabilityPartner = async (userId, partnerId) => {
    try {
        const partner = await prisma.accountabilityPartner.findFirst({
            where: { OR: [{ userId, partnerId }, { userId: partnerId, partnerId: userId }] }
        });

        if (!partner) throw new Error("No active partner found.");

        await prisma.accountabilityPartner.update({ where: { id: partner.id }, data: { isActive: false } });
        return { message: "Partner relationship deactivated" };
    } catch (error) {
        console.error("Error removing accountability partner:", error);
        throw error;
    }
};


module.exports.checkIfPartnerExists = async (userId, partnerId) => {
    try {

        const pairExists = await prisma.accountabilityPartner.findFirst({
            where: {
                OR: [
                    { userId: userId, partnerId: partnerId, status: 'ACCEPTED' },
                    { userId: partnerId, partnerId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        return pairExists !== null;
    } catch (error) {
        console.error("Error checking if partner exists:", error);
        throw new Error("Error checking if partner exists");
    }
};


module.exports.savePartnerRequest = async (userId, partnerId) => {
    try {
        const existingRequest = await prisma.accountabilityPartner.findFirst({
            where: { userId, partnerId, status: 'PENDING' }
        });

        if (existingRequest) throw new Error("Request already sent.");

        return await prisma.accountabilityPartner.create({
            data: {
                userId,
                partnerId,
                status: 'PENDING',
            },
        });
    } catch (error) {
        console.error('Error saving partner request:', error);
        throw new Error('Error saving partner request');
    }
};

// Check if there's a rejected request
module.exports.checkRejectedRequest = async (userId, partnerId) => {
    try {
        const rejectedRequest = await prisma.accountabilityPartner.findFirst({
            where: {
                OR: [
                    { userId: userId, partnerId: partnerId, status: 'REJECTED' },
                    { userId: partnerId, partnerId: userId, status: 'REJECTED' }
                ]
            }
        });

        return rejectedRequest;
    } catch (error) {
        console.error("Error checking rejected request:", error);
        throw new Error("Error checking rejected request");
    }
};

// Update a rejected request to 'PENDING'
module.exports.updateRequestToPending = async (userId, partnerId) => {
    try {
        const updatedRequest = await prisma.accountabilityPartner.updateMany({
            where: {
                OR: [
                    { userId: userId, partnerId: partnerId, status: 'REJECTED' },
                    { userId: partnerId, partnerId: userId, status: 'REJECTED' }
                ]
            },
            data: {
                status: 'PENDING'
            }
        });

        if (updatedRequest.count === 0) {
            throw new Error("No rejected request found to update");
        }

        return updatedRequest;
    } catch (error) {
        console.error("Error updating request to pending:", error);
        throw new Error("Error updating request to pending");
    }
};



module.exports.acceptPartnerRequest = async (requestId) => {
    try {
        await prisma.accountabilityPartner.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        return { message: "Partner request accepted" };
    } catch (error) {
        console.error("Error accepting partner request:", error);
        throw new Error("Error accepting partner request");
    }
};


module.exports.rejectPartnerRequest = async (requestId) => {
    try {
        await prisma.accountabilityPartner.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });

        return { message: "Partner request rejected" };
    } catch (error) {
        console.error("Error rejecting partner request:", error);
        throw new Error("Error rejecting partner request");
    }
};

module.exports.getPartnerRequests = async (userId) => {
    try {
        return await prisma.accountabilityPartner.findMany({
            where: { partnerId: parseInt(userId, 10), status: 'PENDING' },
            include: { 
                user: {
                    select: {
                        id: true,    
                        name: true,   
                        email: true, 
                        avatar: true  
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching partner requests:", error);
        throw new Error("Unable to retrieve partner requests.");
    }
};

module.exports.getSentRequests = async (userId) => {
    try {
        const requests = await prisma.accountabilityPartner.findMany({
            where: {
                userId: userId,
                status: { in: ['PENDING', 'REJECTED'] },
            },
            include: { 
                partner: {  
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });

        return requests;
    } catch (error) {
        console.error("Error fetching sent requests:", error);
        throw new Error("Error fetching sent requests");
    }
};

module.exports.cancelRequest = async (requestId) => {
    try {
        await prisma.accountabilityPartner.delete({ where: { id: requestId } });
        return { message: "Request cancelled successfully" };
    } catch (error) {
        console.error("Error cancelling request:", error);
        throw new Error("Error cancelling request");
    }
}
