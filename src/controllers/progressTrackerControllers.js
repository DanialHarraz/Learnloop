const ProgressTrackerModel = require('../models/progressTrackerModel');
const StreakModel = require('../models/streakModel'); 

const determineStatus = (progressPercentage, deadline, startDate) => {
    const currentDate = new Date();
    const taskDeadline = new Date(deadline);
    const taskStartDate = new Date(startDate);

    if (currentDate < taskStartDate) return 'PENDING'; 
    if (progressPercentage === 100) return 'COMPLETED'; 
    if (currentDate > taskDeadline && progressPercentage < 100) return 'OVERDUE';
    if (progressPercentage > 0 && progressPercentage < 100) return 'ONGOING';
    if (progressPercentage === 0) return 'NOT_BEGUN';

    return 'NOT_BEGUN';
};


module.exports.createProgressTracker = async function (req, res) {
    const {
        title,
        startDate,
        dueDate,
        notes,
        userId,
        tasks,
        taskDurations,
    } = req.body;

    // Check for empty fields
    if (!title || !startDate || !dueDate || !notes || !userId) {
        return res.status(400).json({ error: "All fields (Title, Start Date, Due Date, Notes) are required" });
    }

    if (!tasks || tasks.length === 0) {
        return res.status(400).json({ error: "At least one task is required" });
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);
    const currentDate = new Date();

    // Validate if due date is earlier than the start date
    if (due < start) {
        return res.status(400).json({ error: "Due date cannot be earlier than the start date" });
    }

    let status;
    let isClosed = false;

    if (currentDate < start) {
        status = "PENDING";
        isClosed = true;
    } else {
        status = "NOT_BEGUN";
        isClosed = false;
    }

    try {
        if (tasks.length === 0) {
            return res.status(400).json({ error: "At least one task is required for duration allocation." });
        }
        
        const totalDuration = (due - start) / (1000 * 60 * 60); // Total hours
        if (totalDuration <= 0) {
            return res.status(400).json({ error: "Duration between start and due dates must be greater than 0." });
        }
        
        const preparedTaskDurations = taskDurations?.length
            ? taskDurations.map(td => td.duration)
            : Array(tasks.length).fill(totalDuration / tasks.length);
        

        const progressTracker = await ProgressTrackerModel.createProgressTracker({
            title,
            startDate: start,
            dueDate: due,
            status,
            notes,
            userId,
            isClosed,
        });

        // Prepare task data
        const taskData = tasks.map((task, index) => {
            if (!task.title) {
                throw new Error(`Task ${index + 1} is missing a 'title'`);
            }

            const taskStatus = currentDate < start ? "LOCKED" : "STARTED";

            return {
                progressTrackerId: progressTracker.id,
                title: task.title,
                dependsOn: null,
                isClosed: isClosed || false,
                status: taskStatus,
                estimatedDuration: preparedTaskDurations?.[index] ,
                scheduleStatus: "On Schedule",
                startedAt: taskStatus === "STARTED" ? currentDate : null,
            };
        });

        // Create tasks
        const createdTasks = await ProgressTrackerModel.createTasks(taskData);

        // Map task titles to IDs for dependency handling
        const taskTitleToId = createdTasks.reduce((acc, task) => {
            acc[task.title] = task.id;
            return acc;
        }, {});

        // Update dependencies if any
        for (const task of createdTasks) {
            const taskToUpdate = tasks.find(t => t.title === task.title);
            if (taskToUpdate && taskToUpdate.dependsOn) {
                const dependsOnTaskId = taskTitleToId[taskToUpdate.dependsOn];
                if (dependsOnTaskId) {
                    await ProgressTrackerModel.updateTaskDependency(task.id, dependsOnTaskId);
                }
            }
        }

        progressTracker.tasks = createdTasks; 
        res.status(201).json(progressTracker);
    } catch (error) {
        console.error("Error creating progress tracker:", error);
        res.status(500).json({ error: error.message || "Error creating progress tracker" });
    }
};



module.exports.completeTask = async function (req, res) {
    const { taskId } = req.params;
    const { completed, userId } = req.body;  

    try {
        const task = await ProgressTrackerModel.getTaskWithDependencies(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Ensure task dependencies are met before completing
        if (task.dependsOn && !task.parentTask?.isCompleted) {
            return res.status(400).json({ error: 'Cannot complete this task because a dependent task is not completed yet.' });
        }

        // Check for date constraints
        const now = new Date();
        if (task.startDate && now < new Date(task.startDate)) {
            return res.status(400).json({ error: 'Cannot complete this task before its start date.' });
        }
        if (task.dueDate && now > new Date(task.dueDate)) {
            return res.status(400).json({ error: 'Cannot complete this task after its due date.' });
        }

        const completedAt = completed ? new Date() : null;

        // Calculate completionDuration
        let completionDuration = null;
        if (completed && task.startedAt) {
            completionDuration = Math.floor((completedAt - new Date(task.startedAt)) / 1000);

            // Ensure duration is in hours
            if (completionDuration < 3600) {
                completionDuration = (completionDuration / 60 / 60).toFixed(2);
            }
        }

        // Update task data
        const updatedTask = await ProgressTrackerModel.completeTask(taskId, {
            completed,
            completedAt,
            completionDuration,
        });

        
        const tracker = await ProgressTrackerModel.getProgressTrackerWithTasks(updatedTask.progressTrackerId);
        const completedTasks = tracker.Task.filter((t) => t.isCompleted).length;
        const totalTasks = tracker.Task.length;
        const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
        const status = determineStatus(progressPercentage, tracker.deadline, tracker.startDate);

        await ProgressTrackerModel.updateProgressTracker(tracker.id, { progressPercentage, status });

        if (completed) {
            const dependentTasks = await ProgressTrackerModel.getDependentTasksForTask(taskId);
            for (const dependentTask of dependentTasks) {
                if (dependentTask.isClosed) {
                    await ProgressTrackerModel.updateTask(dependentTask.id, {
                        isClosed: false,
                        status: 'STARTED',
                        startedAt: now,
                    });
                }
            }

            
        }
        await StreakModel.updateStreakNotification(userId);
        await StreakModel.addCompletionToStreak(userId);
        console.log("called the update")

        res.status(200).json({ updatedTask, progressTracker: tracker });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ error: 'Error completing task' });
    }
};


    



module.exports.getCompletionStatistics = async function (req, res) {
    const { userId } = req.params;

    try {
        const tasks = await ProgressTrackerModel.getTasksByUserId(userId);

        // Filter out completed tasks
        const completedTasks = tasks.filter(taskTracking => taskTracking.isCompleted && taskTracking.completionDuration);
        const averageCompletionTime = completedTasks.length
            ? completedTasks.reduce((sum, taskTracking) => sum + taskTracking.completionDuration, 0) / completedTasks.length
            : 0;

        // Group tasks by completion date
        const tasksByDate = completedTasks.reduce((acc, taskTracking) => {
            const date = taskTracking.completedAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        
        console.log('tasks:',tasks)

        res.status(200).json({
            averageCompletionTime,
            tasksByDate, 
        });
    } catch (error) {
        console.error('Error retrieving completion statistics:', error);
        res.status(500).json({ error: 'Error retrieving completion statistics' });
    }
};


module.exports.updateProgressTrackerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    try {
        const updatedTracker = await ProgressTrackerModel.updateProgressTracker(id, { status });

        if (!updatedTracker) {
            return res.status(404).json({ error: 'Progress tracker not found' });
        }

        res.status(200).json(updatedTracker);
    } catch (error) {
        console.error('Error updating progress tracker status:', error);
        res.status(500).json({ error: 'Error updating progress tracker status' });
    }
};






module.exports.getTasksForTracker = async (req, res) => {
    const { id } = req.params;

    const trackerId = parseInt(id, 10); 
    if (isNaN(trackerId)) {
        return res.status(400).json({ error: 'Invalid progress tracker ID' });
    }

    try {
        // Fetch tasks and their statuses
        const tasks = await ProgressTrackerModel.getTasksByTrackerId(trackerId); 
        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ error: 'No tasks found for this progress tracker' });
        }

       
        res.status(200).json(tasks.map(task => ({
            ...task,
            completedAt: task.completedAt ? task.completedAt : null
        })));
    } catch (error) {
        console.error('Error retrieving tasks:', error);    
        res.status(500).json({ error: 'Error retrieving tasks' });
    }
};



module.exports.updateProgressTracker = async function (req, res) {
    const { id } = req.params;
    const { progressPercentage } = req.body;

    try {
        const tracker = await prisma.progressTracker.findUnique({
            where: { id: Number(id) },
        });

        if (!tracker) {
            return res.status(404).json({ message: 'Progress tracker not found' });
        }

        if (tracker.isClosed) {
            return res.status(403).json({ message: 'Cannot edit a closed progress tracker.' });
        }

        const status = determineStatus(progressPercentage, tracker.deadline, tracker.startDate);

        ProgressTrackerModel.updateProgressTracker(id, { progressPercentage, status })
        .then(function (updatedTracker) {
            res.status(200).json(updatedTracker);
        })
        .catch(function (error) {
            console.error('Error updating progress tracker:', error);
            res.status(500).json({ error: 'Error updating progress tracker' });
        });
    } catch (error) {
        console.error('Error updating progress tracker:', error);
        res.status(500).json({ error: 'Error updating progress tracker' });
    }
};





module.exports.getProgressTracker = function (req, res) {
    const { id } = req.params;

    ProgressTrackerModel.getProgressTracker(id)
        .then(function (tracker) {
            if (!tracker) {
                return res.status(404).json({ error: 'Progress tracker not found' });
            }
            res.status(200).json(tracker);
        })
        .catch(function (error) {
            console.error('Error retrieving progress tracker:', error);
            res.status(500).json({ error: 'Error retrieving progress tracker' });
        });
};

module.exports.getAllProgressTrackers = function (req, res) {
    const { userId } = req.params;

    ProgressTrackerModel.getAllProgressTrackers(userId)
        .then(function (trackers) {
            res.status(200).json(trackers);
        })
        .catch(function (error) {
            console.error('Error retrieving progress trackers:', error);
            res.status(500).json({ error: 'Error retrieving progress trackers' });
        });
};

module.exports.getAggregatedData = function (req, res) {
    const { userId } = req.params;

    ProgressTrackerModel.getAggregatedData(userId)
        .then(function (data) {
            res.status(200).json(data);
        })
        .catch(function (error) {
            console.error('Error retrieving aggregated data:', error);
            res.status(500).json({ error: 'Error retrieving aggregated data' });
        });
};

module.exports.getTaskCompletionData = function (req, res) {
    const { userId } = req.params;

    ProgressTrackerModel.getTaskCompletionData(userId)
        .then(function (data) {
            res.status(200).json(data);
        })
        .catch(function (error) {
            console.error('Error retrieving task completion data:', error);
            res.status(500).json({ error: 'Error retrieving task completion data' });
        });
};


module.exports.deleteProgressTracker = async function (req, res) {
    const { id } = req.params;

    try {
        await ProgressTrackerModel.deleteProgressTracker(id);
        res.status(200).send({ message: 'Progress tracker and associated tasks deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to delete progress tracker' });
    }
};
    

module.exports.getProgressInsights = async (req, res) => {
    const { userId } = req.params;

    try {
        const insights = await ProgressTrackerModel.getProgressInsights(userId);
        res.status(200).json(insights);
    } catch (error) {
        console.error('Error generating progress insights:', error);
        res.status(500).json({ error: 'Error generating progress insights' });
    }
};



module.exports.getLearningDashboard = async (req, res) => {
    const { userId } = req.params;

    try {
        const insights = await ProgressTrackerModel.getProgressInsights(userId);
        res.status(200).json(insights);
    } catch (error) {
        console.error('Error retrieving learning dashboard data:', error);
        res.status(500).json({ error: 'Error retrieving dashboard data' });
    }
};

module.exports.getCompletionBreakdown = async (req, res) => {
    const { userId } = req.params;
  
    try {
        
        const trackers = await ProgressTrackerModel.getAllProgressTrackers(userId);

       
        const tasks = trackers.flatMap((tracker) => tracker.Task);

        const breakdown = tasks.reduce((acc, task) => {
            const deadline = new Date(task.progressTracker.deadline);
            const completedAt = task.completedAt ? new Date(task.completedAt) : null;
            const startDate = task.progressTracker.startDate ? new Date(task.progressTracker.startDate) : null;
        
            if (completedAt && completedAt > deadline) {
                acc.overdue.push(task);
            } else if (completedAt) {
                acc.completed.push(task);
            } else {
                acc.upcoming.push(task);
            }
        
            if (completedAt) {
                acc.completedProgress += task.progressPercentage;
            } else if (completedAt === null && task.progressPercentage > 0) {
                acc.ongoingProgress += task.progressPercentage;
            }
        
            return acc;
        }, {
            completed: [],
            overdue: [],
            upcoming: [],
            completedProgress: 0,
            ongoingProgress: 0,
        });
        

        // Include progressPercentage for each tracker in the response
        const progressPercentages = trackers.map((tracker) => ({
            trackerId: tracker.id,
            title: tracker.title,
            progressPercentage: tracker.progressPercentage,  
        }));

        res.status(200).json({
            completedTasks: breakdown.completed.length,
            overdueTasks: breakdown.overdue.length,
            upcomingTasks: breakdown.upcoming.length,
            totalCompletedProgress: breakdown.completedProgress,
            totalOngoingProgress: breakdown.ongoingProgress,
            progressPercentages,  
        });
    } catch (error) {
        console.error('Error retrieving task completion breakdown:', error);
        res.status(500).json({ error: 'Error retrieving task completion breakdown' });
    }
};


  



