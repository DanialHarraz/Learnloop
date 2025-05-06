const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Get or create streak for a user
module.exports.getOrCreateStreak = async (userId) => {
    try {
        let streak = await prisma.streak.findUnique({ where: { userId } });
        if (!streak) {
            streak = await prisma.streak.create({
                data: { userId, currentStreak: 0, longestStreak: 0, freezeCount: 0 }
            });
        }
        return streak;
    } catch (error) {
        console.error("Error fetching streak:", error);
        throw error;
    }
};


module.exports.addCompletionToStreak = async (userId) => {
  try {
      const streak = await prisma.streak.findUnique({ where: { userId } });
      if (!streak) throw new Error("Streak not found");

      const today = new Date();
      const lastCompletion = streak.lastCompletion ? new Date(streak.lastCompletion) : null;
      const updatedAt = streak.updatedAt ? new Date(streak.updatedAt) : null;
      let message = '';

     
      if (!lastCompletion || lastCompletion.toDateString() !== today.toDateString() || updatedAt.toDateString() !== today.toDateString()) {
          const isContinuation = lastCompletion && lastCompletion.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();
          const newCurrentStreak = isContinuation ? streak.currentStreak + 1 : 1;
          const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

         
          const newStatus = streak.status === 'FROZEN' ? 'FROZEN' : 'ACTIVE';

          const updatedStreak = await prisma.streak.update({
              where: { userId },
              data: { 
                  currentStreak: newCurrentStreak, 
                  longestStreak: newLongestStreak, 
                  lastCompletion: today, 
                  status: newStatus 
              },
          });

          message = `🎉 Your partner ${userId} has continued their streak! (${newCurrentStreak} days)`;
          await notifyPartner(userId, message);

          return updatedStreak;
      }

      return streak;
  } catch (error) {
      console.error("Error updating streak:", error);
      throw error;
  }
};


async function notifyPartner(userId, message) {
    const partner = await prisma.accountabilityPartner.findFirst({
        where: { userId, status: 'ACCEPTED' },
        include: { partner: true },
    });

    if (partner) {
        const preference = await prisma.notificationPreferences.findUnique({
            where: { userId: partner.partnerId },
        });

        if (preference?.receiveNotifications) {
            await notificationService.send(partner.partnerId, message);
        }
    }
}

module.exports.getUsers = async () => {
    try {
        return await prisma.user.findMany({ select: { id: true, name: true } });
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

module.exports.getStreakByUserId = async (userId) => {  
    try {
        const userIdInt = parseInt(userId, 10); 
        return await prisma.streak.findUnique({ where: { userId: userIdInt } });
    } catch (error) {
        console.error('Error fetching streak:', error);
        throw error;
    }
}


module.exports.updatePartnerStreak = async () => {
  const today = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);  
  today.setHours(0, 0, 0, 0);  

  console.log('Checking tasks for today: ', today, ' to ', endOfDay);

  const partners = await prisma.accountabilityPartner.findMany({
    where: { status: 'ACCEPTED' },
    select: { 
      userId: true,
      partnerId: true,
      partnerStreak: true,
      updatedAt: true, // ✅ Ensure this is selected
      user: { select: { id: true, name: true, avatar: true } },
      partner: { select: { id: true, name: true, avatar: true } }
    }
  });

  console.log(`Found ${partners.length} accepted accountability partners.`);

  for (const partner of partners) {
    console.log(`Checking tasks for User ${partner.userId} and Partner ${partner.partnerId}`);

    // Handle updatedAt check
    const lastUpdated = partner.updatedAt ? new Date(partner.updatedAt) : null;

    if (lastUpdated) {
      lastUpdated.setHours(0, 0, 0, 0);
      if (lastUpdated.toISOString() === today.toISOString()) {
        console.log(`Partner streak already updated today... Skipping update.`);
        continue;
      }
    } else {
      console.log(`First time updating streak for User ${partner.userId} and Partner ${partner.partnerId}`);
    }

    // Check task completion
    const [userCompleted, partnerCompleted] = await Promise.all([
      prisma.taskTracking.findFirst({
        where: {
          ProgressTracker: { userId: partner.userId },
          completedAt: { gte: today, lte: endOfDay },
          isCompleted: true
        }
      }),
      prisma.taskTracking.findFirst({
        where: {
          ProgressTracker: { userId: partner.partnerId },
          completedAt: { gte: today, lte: endOfDay },
          isCompleted: true
        }
      })
    ]);

    console.log(`User ${partner.userId} completed task:`, userCompleted ? 'Yes' : 'No');
    console.log(`Partner ${partner.partnerId} completed task:`, partnerCompleted ? 'Yes' : 'No');

    if (userCompleted && partnerCompleted) {
      console.log(`Both partners completed tasks today! Updating streak...`);

      
      const updatedPartner = await prisma.accountabilityPartner.update({
        where: {
          userId_partnerId: {
            userId: partner.userId,
            partnerId: partner.partnerId
          }
        },
        data: {
          partnerStreak: { increment: 1 },
          updatedAt: new Date() 
        },
        select: {
          userId: true,
          partnerId: true,
          partnerStreak: true
        }
      });

      console.log(`Updated Partner Streak for Partner ${partner.partnerId}:`, updatedPartner.partnerStreak);
    } else {
      console.log(`One or both partners have not completed tasks today. No streak update.`);
    }
  }
};

  

  


  
 module.exports.checkDailyTaskCompletion = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

       
        const activeStreaks = await prisma.streak.findMany({
            where: {
                status: 'ACTIVE'
            }
        });

        for (const streak of activeStreaks) {
            const userId = streak.userId;

            
            const completedTasks = await prisma.task.findFirst({
                where: {
                    userId,
                    status: 'COMPLETED',
                    completedAt: {
                        gte: today 
                    }
                }
            });

            
            if (!completedTasks) {
                await prisma.streak.update({
                    where: { userId },
                    data: {
                        count: 0, 
                        status: 'BROKEN' 
                    }
                });

                console.log(`User ${userId} did not complete any tasks today. Streak reset to 0.`);
            }
        }
    } catch (error) {
        console.error("Error checking daily task completion:", error);
    }
};












module.exports.getUserStreakNotifications = async (userId) => {  
  try {
      const notifications = await prisma.streakNotification.findMany({
          where: {
              OR: [
                  { userId: userId },
                  { senderId: userId }
              ]
          },
          orderBy: { createdAt: 'desc' },
      });

      
      const notificationsWithUserNames = await Promise.all(notifications.map(async (notification) => {
          if (notification.senderId === userId) {
             
              if (notification.userId) {
                  const recipient = await prisma.user.findUnique({
                      where: { id: notification.userId },
                      select: { name: true }
                  });
                  if (recipient) {
                      notification.message += `( sent to ${recipient.name} )`;
                  }
              }
          } else if (notification.userId === userId) {
             
              if (notification.senderId) {
                  const sender = await prisma.user.findUnique({
                      where: { id: notification.senderId },
                      select: { name: true }
                  });
                  if (sender) {
                      notification.message += `( from ${sender.name} )`;
                  }
              }
          }
          return notification;
      }));

      return notificationsWithUserNames; 
  } catch (error) {
      console.error("Error fetching streak notifications:", error);
      throw new Error("Could not fetch streak notifications."); 
  }
};





module.exports.markStreakNotificationAsRead = async (notificationId) => {
  try {
      
      await prisma.streakNotification.update({
          where: { id: parseInt(notificationId) },
          data: { isRead: true },
      });

      return { success: true, message: "Notification marked as read." };  
  } catch (error) {
      console.error("Error marking streak notification as read:", error);
      throw new Error("Could not mark notification as read.");  
  }
};



module.exports.sendNudgeToPartner = async (senderId,partnerId) => {
  try {
   
    return await prisma.$transaction(async (prisma) => {
    
    
          const notification = await prisma.streakNotification.create({
            data: {
              userId: partnerId,
              senderId: senderId,
              message: `🚨 Reminder! Your streak is in danger. Don't forget to complete them and keep your streak going!`,
              type: "NUDGE_REMINDER",
              status:'PENDING',
            },
          });

          console.log(`Nudge sent to user ${partnerId}: ${notification.message}`);
      
      
      return { success: true, message: `Nudge sent to partner ${partnerId}` };
    });
  } catch (error) {
    console.error("Error sending nudge:", error);
    throw new Error("Could not send nudge.");
  }
};

module.exports.updateStreakNotification = async (userId) => {
  try {
  
    const result = await prisma.streakNotification.updateMany({
      where: {
        userId: userId,
        type: 'NUDGE_REMINDER',  
      },
      data: {
        status: 'COMPLETED',  
      },
    });

    return { success: true, message: `Nudge completed`, updatedCount: result.count }; 
  } catch (error) {
    console.error("Error completing nudge:", error);
    throw new Error("Could not complete nudge.");
  }
}
