const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.useFreezePowerUp = async (userId) => {  
    try {
        return await prisma.$transaction(async (prisma) => {
            // Create a freeze power-up with 1 day duration
            const freezePowerUp = await prisma.freezePowerUp.create({
                data: {
                    userId,
                    freezeUntil: new Date(new Date().setDate(new Date().getDate() + 1))  
                }
            });

        
            await prisma.streak.update({
                where: { userId },
                data: { status: 'FROZEN' },
            });

            return {
                success: true,
                freezePowerUp,
                message: 'Freeze power-up applied for 1 day and streak set to FROZEN.',
            };
        });
    } catch (error) {
        console.error("Error using freeze power-up:", error);
        throw new Error("Could not apply freeze power-up.");
    }
};

module.exports.checkFreezeStatus = async () => {
    try {
        
        const freezePowerUps = await prisma.freezePowerUp.findMany({
            where: {
                freezeUntil: {
                    lte: new Date(),  
                }
            }
        });

    
        for (const freezePowerUp of freezePowerUps) {
            const userId = freezePowerUp.userId;


            await prisma.freezePowerUp.update({
                where: { id: freezePowerUp.id },
                data: { status: 'EXPIRED' },
            });
            
            
            await prisma.streak.update({
                where: { userId },
                data: { status: 'ACTIVE' },
            });


            console.log(`Freeze power-up expired for user ${userId}. Streak status set to ACTIVE.`);
        }
    } catch (error) {
        console.error("Error checking freeze status:", error);
    }
};



module.exports.checkAndAwardFreezePowerUp = async () => {
    try {
        // Start transaction
        return await prisma.$transaction(async (prisma) => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            console.log(`Checking tasks from ${sevenDaysAgo.toISOString()} to now`);

            // Retrieve all users
            const users = await prisma.user.findMany();
            console.log(`Found ${users.length} users to check`);

            const results = [];

            for (const user of users) {
                console.log(`Checking tasks for user ${user.id}: ${user.name}`);

                // Retrieve the streak record for the user
                const streak = await prisma.streak.findUnique({
                    where: { userId: user.id },
                });

                // Check if lastAddedFreeze exists and if it's less than 7 days old
                if (streak && streak.lastAddedFreeze && new Date(streak.lastAddedFreeze) > sevenDaysAgo) {
                    results.push({
                        userId: user.id,
                        success: false,
                        message: `Freeze power-up already awarded in the last 7 days.`,
                    });
                    console.log(`User ${user.id} has already been awarded a freeze power-up in the last 7 days.`);
                    continue;  // Skip to the next user
                }

                // Count completed tasks for this user
                const completedTasks = await prisma.taskTracking.count({
                    where: {
                        ProgressTracker: {
                            userId: parseInt(user.id),
                        },
                        isCompleted: true,
                        completedAt: {
                            gte: sevenDaysAgo,  
                        },
                    },
                });

                console.log(`User ${user.id} has completed ${completedTasks} tasks in the last 7 days`);

                // Check if the user has completed at least 10 tasks
                if (completedTasks >= 10) {
                    await prisma.streak.update({
                        where: { userId: user.id },
                        data: {
                            freezeCount: { increment: 1 },
                            lastAddedFreeze: new Date(), 
                        },
                    });

                    console.log(`Freeze power-up awarded to user ${user.id}: Freeze count updated`);

                    // Create a notification for the user
                    const notification = await prisma.streakNotification.create({
                        data: {
                            userId: user.id,
                            message: `🎉 Congrats! You completed ${completedTasks} tasks and earned a Freeze Power-Up!`,
                            type: "FREEZE_POWERUP_EARNED",
                        },
                    });

                    console.log(`Notification sent to user ${user.id}: ${notification.message}`);

                }
            }

            return results;
        });
    } catch (error) {
        console.error("Error checking and awarding freeze power-up:", error);
        throw new Error("Could not check or award freeze power-up.");
    }
};




