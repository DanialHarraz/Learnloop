const { PrismaClient } = require('@prisma/client');
const { taskTracking } = require('./prismaClient');
const prisma = new PrismaClient();

module.exports.createProgressTracker = async (data) => {
    try {
        return await prisma.progressTracker.create({
            data: {
                userId: data.userId,
                title: data.title,
                deadline: data.dueDate,
                startDate: data.startDate,
                progressPercentage: 0,
                status: data.status,
                isClosed: data.isClosed,
                notes: data.notes,
              
            },
        });
    } catch (error) {
        console.error('Error creating progress tracker:', error);
        throw error;
    }
};


module.exports.createTasks = async (tasks) => {
    try {
        await prisma.taskTracking.createMany({
            data: tasks.map(task => ({
                progressTrackerId: task.progressTrackerId,
                title: task.title,
                isClosed: task.isClosed,
                status: task.status,
                estimatedDuration: task.estimatedDuration,
                scheduleStatus: task.scheduleStatus,
                dependsOn: task.dependsOn,
                startedAt: task.startedAt
            })),
        });

        const createdTasks = await prisma.taskTracking.findMany({
            where: {
                progressTrackerId: tasks[0].progressTrackerId,
            },
        });

        for (const task of createdTasks) {
            const taskToUpdate = tasks.find(t => t.title === task.title);
            if (taskToUpdate && taskToUpdate.dependsOn !== null) {
                await ProgressTrackerModel.updateTaskDependency(task.id, taskToUpdate.dependsOn);
            }
        }

        console.log("Created tasks:", createdTasks);
        return createdTasks;
    } catch (error) {
        console.error("Error creating tasks:", error);
        throw error;
    }
};








module.exports.updateTaskDependency = async (taskId, dependencyId) => {
    try {
       
        return await prisma.taskTracking.update({
            where: { id: taskId },
            data: { dependsOn: dependencyId, status:'LOCKED', isClosed: true, startedAt: null},
        });
    } catch (error) {
        console.error('Error updating task dependency:', error);
        throw error;
    }
};



module.exports.completeTask = async function (taskId, { completed, completedAt, completionDuration }) {
    try {
        // Ensure completionDuration is a number (not a string)
        completionDuration = parseFloat(completionDuration);
        console.log(completionDuration)

        const updateData = {
            isCompleted: completed,
            completedAt: completedAt || null,
            status: 'COMPLETED',
            completionDuration: completionDuration 
        };

        return await prisma.taskTracking.update({
            where: { id: parseInt(taskId) },
            data: updateData,
        });
    } catch (error) {
        console.error('Error completing task:', error);
        throw error;
    }
};


module.exports.logHistoricalData = async (data) => {
    try {
        // Ensure userId references a valid user
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user) {
            throw new Error(`User with ID ${data.userId} does not exist`);
        }

        return await prisma.historicalData.create({
            data: {
                userId: data.userId, 
                taskTrackingId: data.taskTrackingId,
                progressTrackerId: data.progressTrackerId,
                taskDuration: data.taskDuration,
                completionDate: data.completionDate,
                scheduleStatus: 'Completed',
            },
        });
    } catch (error) {
        console.error('Error logging historical data:', error.message);
        throw error;
    }
};





module.exports.getTaskWithDependencies = async (taskId) => {
    try {
        return await prisma.taskTracking.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                parentTask: true,  
                dependentTasks: true,  
            }
        });
    } catch (error) {
        console.error('Error fetching task with dependencies:', error);
        throw error;
    }
};




module.exports.getProgressTrackerWithTasks = async (id) => {
    try {
      return await prisma.progressTracker.findUnique({
        where: {
          id: id 
        },
        include: {
          Task: true, 
        }
      });
    } catch (error) {
      console.error("Error retrieving progress tracker with tasks:", error);
      throw error;
    }
  };
  

  module.exports.checkProgressTrackers = async () => {
    try {
        const now = new Date();
        console.log("Current Date and Time:", now);

        // Fetch trackers that need to be updated
        const trackersToCheck = await prisma.progressTracker.findMany({
            include: { Task: true },
        });

        console.log("Trackers to Check:", trackersToCheck);

        let completedCount = 0;
        let overdueCount = 0;
        let notBegunCount = 0;

        for (const tracker of trackersToCheck) {
            console.log(`Processing Tracker ID: ${tracker.id}`);

           
            let completedTasks = 0;
            let totalTasks = tracker.Task.length;
            let remainingDuration = 0;  
            let expectedCompletionDate = null;
            let forecastStatus = "On Schedule"; 

           
if (tracker.deadline <= now) {
    try {
        await prisma.progressTracker.update({
            where: { id: tracker.id },
            data: {
                forecastStatus: "Ended",
                updatedAt: now,
            },
        });
        console.log(`Tracker ID ${tracker.id} forecastStatus updated to "Ended".`);

        
        const taskUpdates = tracker.Task.map(async (task) => {
            try {
                await prisma.taskTracking.update({
                    where: { id: task.id },
                    data: {
                        scheduleStatus: "Ended",
                        updatedAt: now,
                    },
                });
                console.log(`Task ID ${task.id} scheduleStatus updated to "Ended".`);
            } catch (error) {
                console.error(`Error updating scheduleStatus to "Ended" for Task ID ${task.id}:`, error);
            }
        });

        await Promise.all(taskUpdates); 
    } catch (error) {
        console.error(`Error updating forecastStatus to "Ended" for Tracker ID ${tracker.id}:`, error);
    }
}


            for (const task of tracker.Task) {
                console.log(`Task ID: ${task.id}, startedAt: ${task.startedAt}, estimatedDuration: ${task.estimatedDuration}`);

                // Handle overdue tasks
                if (tracker.deadline <= now) {
                    if (!task.isCompleted) {
                        console.log(`Marking Task ID ${task.id} as INCOMPLETE and CLOSED due to overdue tracker.`);
                        await prisma.taskTracking.update({
                            where: { id: task.id },
                            data: { status: 'INCOMPLETE', isClosed: true, updatedAt: now },
                        });
                    } else {
                        console.log(`Closing Task ID ${task.id} as COMPLETED since the deadline has passed.`);
                        await prisma.taskTracking.update({
                            where: { id: task.id },
                            data: { isClosed: true, updatedAt: now },
                        });
                    }
                } else if (tracker.startDate <= now) {
                    // Handle tasks that have started
                    if (!task.isCompleted && task.isClosed && task.dependsOn === null) {
                        try {
                            console.log(`Attempting to open Task ID ${task.id}`);
                            await prisma.taskTracking.update({
                                where: { id: task.id },
                                data: {
                                    isClosed: false,
                                    status: 'STARTED',
                                    startedAt: now,
                                    updatedAt: now,
                                },
                            });
                            console.log(`Task ID ${task.id} has been transitioned to STARTED.`);
                        } catch (error) {
                            console.error(`Error updating task ID ${task.id}: ${error.message}`);
                        }
                    }

                    if (task.startedAt && task.estimatedDuration) {
                        const elapsedTimeInMinutes = Math.floor((now - new Date(task.startedAt)) / (1000 * 60)); 
                        const estimatedDurationInMinutes = task.estimatedDuration * 60; 
                        let scheduleStatus = task.scheduleStatus || "On Schedule";  
                    
                        console.log(`Task ID: ${task.id}, Elapsed Time (minutes): ${elapsedTimeInMinutes}, Estimated Duration (minutes): ${estimatedDurationInMinutes}`);
                       
                        if (tracker.forecastStatus === "Ended") {
                            scheduleStatus = "Ended";
                        } else if (task.isCompleted) {
                            if (elapsedTimeInMinutes < estimatedDurationInMinutes) {
                                scheduleStatus = "Ahead of Schedule";  // Any early completion is ahead
                            } else if (elapsedTimeInMinutes > estimatedDurationInMinutes) {
                                scheduleStatus = "Behind Schedule";  // Completed late
                            } else if (elapsedTimeInMinutes <= estimatedDurationInMinutes + 10) {
                                scheduleStatus = "On Schedule";  // Normal completion within margin
                            }
                        } else if (elapsedTimeInMinutes > estimatedDurationInMinutes) {
                            scheduleStatus = "Behind Schedule";  // Not completed & overdue
                        }
                        
                    
                        // Update the task schedule status
                        task.scheduleStatus = scheduleStatus;
                    
                    
                   

                        try {
                            await prisma.taskTracking.update({
                                where: { id: task.id },
                                data: { scheduleStatus, updatedAt: now },
                            });
                            console.log(`Task ID ${task.id} scheduleStatus updated to: ${scheduleStatus}`);
                        } catch (error) {
                            console.error(`Error updating scheduleStatus for Task ID ${task.id}:`, error);
                        }

                        
                        if (!task.isCompleted) {
                            const remainingTimeInMinutes = estimatedDurationInMinutes - elapsedTimeInMinutes;
                            remainingDuration += remainingTimeInMinutes;
                        }

                        
                       if (scheduleStatus === "Behind Schedule") {
                            forecastStatus = "Behind Schedule";
                       } else if (scheduleStatus === "Ahead of Schedule") {
                            forecastStatus = "Ahead of Schedule";
                       } else {
                            forecastStatus = "On Schedule";
                       }

                    }
                }

                // Count completed tasks
                if (task.isCompleted) completedTasks++;
            }

            // Calculate progress percentage
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let newStatus = tracker.status;

            if (tracker.startDate <= now && tracker.status === 'PENDING') {
                console.log(`Updating Tracker ID ${tracker.id} from PENDING to NOT_BEGUN.`);
                await prisma.progressTracker.update({
                    where: { id: tracker.id },
                    data: { status: 'NOT_BEGUN', isClosed: false, updatedAt: now },
                });
                notBegunCount++;
            } else if (tracker.status === 'COMPLETED' && tracker.deadline <= now) {
                console.log(`Closing completed Tracker ID ${tracker.id} as deadline has passed.`);
                await prisma.progressTracker.update({
                    where: { id: tracker.id },
                    data: { isClosed: true, updatedAt: now },
                });
                completedCount++;
            } 
            

            if (tracker.deadline <= now && progressPercentage < 100) {
                newStatus = 'OVERDUE';
                overdueCount++;
            }

            // Forecast the expected completion date if there is remaining duration
            if (remainingDuration > 0) {
                expectedCompletionDate = new Date(now.getTime() + (remainingDuration * 60000));
                console.log(`Forecasted completion date for Tracker ID ${tracker.id}: ${expectedCompletionDate.toLocaleString()}`);
            }

            // Update tracker with new status, forecast status, and forecasted completion date
            if (newStatus !== tracker.status || forecastStatus !== "On Schedule" || expectedCompletionDate) {
                console.log(`Updating Tracker ID ${tracker.id} to status: ${newStatus} with forecast status: ${forecastStatus}`);
                await prisma.progressTracker.update({
                    where: { id: tracker.id },
                    data: {
                        progressPercentage,
                        status: newStatus,
                        forecastStatus,
                        expectedCompletionDate,
                        isClosed: (newStatus === 'COMPLETED' && tracker.deadline <= now) || newStatus === 'OVERDUE',

                        updatedAt: now,
                    },
                });
            }
        }

        console.log(
            `${completedCount} trackers marked as COMPLETED, ` +
            `${overdueCount} trackers marked as OVERDUE, ` +
            `${notBegunCount} trackers changed from PENDING to NOT_BEGUN.`
        );
    } catch (error) {
        console.error('Error checking progress trackers and tasks:', error);
    }
};





module.exports.getTasksByTrackerId = async (trackerId) => {
    try {
        const trackerIdInt = parseInt(trackerId, 10);
        if (isNaN(trackerIdInt)) {
            throw new Error('Invalid progress tracker ID');
        }   

        const progressTracker = await prisma.progressTracker.findUnique({
            where: { id: trackerIdInt },
            select: { startDate: true, deadline: true, status: true, isClosed: true }
        });

        if (!progressTracker) {
            throw new Error('Progress tracker not found');
        }

        const currentDate = new Date();
        
        // Fetch tasks and their dependencies, including parent task data (if any)
        const tasks = await prisma.taskTracking.findMany({
            where: { progressTrackerId: trackerIdInt },
            include: {
                parentTask: true,  
            }
        });

        
        const taskWithStates = tasks.map(task => {
            let status = task.status; 

            
            if (task.dependsOn && !task.parentTask?.isCompleted) {
                status = 'LOCKED'; 
            }
            
           
            if (progressTracker.isClosed & progressTracker.startDate > currentDate) {
                status = 'LOCKED'; 
            }

            return { ...task, status };
        });

        return taskWithStates;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};


module.exports.getDependentTasksForTask = async (taskId) => {
    try {
        return await prisma.taskTracking.findMany({
            where: { dependsOn: parseInt(taskId) },
        });
    } catch (error) {
        console.error('Error fetching dependent tasks:', error);
        throw error;
    }
};


module.exports.updateProgressTracker = function (id, data) {
    return prisma.progressTracker.update({
        where: { id: parseInt(id) },
        data: {
            progressPercentage: data.progressPercentage,
            status: data.status,    
        }
    });
};



module.exports.getProgressTracker = async (id) => {
    try {
        return await prisma.progressTracker.findUnique({
            where: { id: Number(id) },
        });
    } catch (error) {
        console.error('Error retrieving progress tracker:', error);
        throw error;
    }
};

module.exports.getAllProgressTrackers = async (userId) => {
  try {
    return await prisma.progressTracker.findMany({
      where: {
        userId: parseInt(userId, 10)  
      }
    });
  } catch (error) {
    console.error("Error retrieving progress trackers:", error);
    throw error;
  }
};


module.exports.getAggregatedData = async (userId) => {
  try {
      const trackers = await prisma.progressTracker.findMany({
          where: { userId: Number(userId) },
          select: {
              title: true,          
              progressPercentage: true,
          }
      });

      return trackers;
  } catch (error) {
      console.error('Error retrieving aggregated data:', error);
      throw error;
  }
};


module.exports.getTaskCompletionData = async (userId) => {
    try {
        const counts = await prisma.progressTracker.groupBy({
            by: ['status'],
            where: { userId: Number(userId) },
            _count: { status: true }
        });

        const formattedCounts = {
            COMPLETED: 0,
            ONGOING: 0,
            NOT_BEGUN: 0,
            OVERDUE: 0
        };

        counts.forEach(count => {
            formattedCounts[count.status] = count._count.status;
        });

        return formattedCounts;
    } catch (error) {
        console.error('Error retrieving task completion data:', error);
        throw error;
    }
};


module.exports.deleteProgressTracker = async (id) => {
    try {
        // Ensure associated tasks are deleted if cascading isn't enabled
        await prisma.taskTracking.deleteMany({
            where: { progressTrackerId: parseInt(id) },
        });

        return await prisma.progressTracker.delete({
            where: { id: parseInt(id) },
        });
    } catch (error) {
        console.error('Error deleting progress tracker:', error);
        throw error;
    }
};

module.exports.getProgressInsights = async (userId) => {
    try {
        const trackers = await prisma.progressTracker.findMany({
            where: { userId: Number(userId) },
            include: {
                Task: true, 
            },
        });

        const insights = trackers.map(tracker => {
            const totalTasks = tracker.Task.length;
            const completedTasks = tracker.Task.filter(task => task.isCompleted).length;
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                trackerId: tracker.id,
                title: tracker.title,
                status: tracker.status,
                totalTasks,
                completedTasks,
                progressPercentage,
            };
        });

        // trying to break down progress into categories
        const progressBreakdown = {
            almostComplete: 0,
            halfway: 0,
            lowProgress: 0,
        };

        insights.forEach(tracker => {
            const progress = tracker.progressPercentage;
            if (progress >= 90) progressBreakdown.almostComplete++;
            else if (progress >= 50) progressBreakdown.halfway++;
            else if (progress < 50) progressBreakdown.lowProgress++;
        });

       
        const statsByStatus = insights.reduce((acc, tracker) => {
            const { status } = tracker;
            if (!acc[status]) acc[status] = { count: 0, totalProgress: 0 };
            acc[status].count++;
            acc[status].totalProgress += tracker.progressPercentage;
            return acc;
        }, {});

        // time-based trends
        const tasks = trackers.flatMap(tracker => tracker.Task.filter(taskTracking => taskTracking.isCompleted));
        const tasksByDate = tasks.reduce((acc, taskTracking) => {
            const completedAt = taskTracking.completedAt;
        
            
            if (completedAt) {
                const date = new Date(completedAt).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
            } else {
                console.warn(`Task with ID ${taskTracking.id} does not have a valid completedAt date.`);
            }
        
            return acc;
        }, {});
        

        return {
            statsByStatus,
            tasksByDate,
            topTrackers: insights.sort((a, b) => b.progressPercentage - a.progressPercentage).slice(0, 3),
            progressBreakdown,  
        };
    } catch (error) {
        console.error('Error generating progress insights:', error);
        throw error;
    }
};

// module.exports.updateTaskStatus = async (taskId) => {
//     const task = await prisma.taskTracking.findUnique({
//         where: { id: taskId },
//         include: { parentTask: true }
//     });

//     if (!task) throw new Error('Task not found');

//     const now = new Date();
//     let status = task.status;

//     if (task.isCompleted) {
//         status = 'COMPLETED';
//     } else if (task.dueDate && now > new Date(task.dueDate)) {
//         status = 'INCOMPLETE';
//     } else if (task.isClosed) {
//         status = 'LOCKED';
//     } else {
//         status = 'STARTED';
//     }

//     await prisma.taskTracking.update({
//         where: { id: taskId },
//         data: { status }
//     });

//     return status;
// };



module.exports.updateTask = async (taskId, updateData) => {
    try {
        return await prisma.taskTracking.update({
            where: { id: parseInt(taskId) },
            data: updateData,
        });
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

module.exports.getAllProgressTrackersWithTasks = async (userId) => {
    try {
        return await prisma.progressTracker.findMany({
            where: { userId: Number(userId) },
            include: {
                Task: true, 
            },
        });
    } catch (error) {
        console.error('Error retrieving progress trackers with tasks:', error);
        throw error;
    }
};