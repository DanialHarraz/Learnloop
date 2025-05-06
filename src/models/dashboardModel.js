const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.getTaskProgression = async () => {
    try {
        // Get lifecycle counts
        const taskLifecycle = await prisma.taskTracking.groupBy({
            by: ['status'],
            _count: { status: true },
            _avg: { completionDuration: true, estimatedDuration: true },
            _sum: { completionDuration: true },
        });

        // Get counts for specific statuses
        const incompleteTasks = taskLifecycle.find(t => t.status === 'INCOMPLETE')?._count.status || 0;
        const startedTasks = taskLifecycle.find(t => t.status === 'STARTED')?._count.status || 0;
        const completedTasks = taskLifecycle.find(t => t.status === 'COMPLETED')?._count.status || 0;

        // Calculate transitions only if the denominator is greater than zero
        const transitionIncompletedToStarted = incompleteTasks > 0 && startedTasks > 0
            ? (startedTasks / incompleteTasks) * 100
            : 0;

        const transitionStartedToCompleted = startedTasks > 0 && completedTasks > 0
            ? (completedTasks / startedTasks) * 100
            : 0;

        // Calculate task completion vs estimated time
        const taskCompletionVsEstimated = taskLifecycle.map(t => {
            if (t._avg.estimatedDuration && t._sum.completionDuration !== null) {
                const totalEstimatedTime = t._avg.estimatedDuration * t._count.status;
                const difference = t._sum.completionDuration - totalEstimatedTime;
                const percentage = totalEstimatedTime > 0 ? (difference / totalEstimatedTime) * 100 : 0;
                return { status: t.status, percentage };
            }
            return null; 
        }).filter(Boolean); 

        // Calculate task dependency completion rate
        const dependentTasks = await prisma.taskTracking.findMany({
            where: {
                dependsOn: { not: null },
                status: 'COMPLETED',
            },
        });

        // Calculate task dependency completion rate considering only valid dependencies
        const validCompletedDependencies = dependentTasks.filter(task => task.dependsOn !== null && task.status === 'COMPLETED');
        const taskDependencyCompletionRate = validCompletedDependencies.length > 0
            ? (validCompletedDependencies.length / completedTasks) * 100
            : 0;

        return { 
            taskLifecycle, 
            transitionIncompletedToStarted, 
            transitionStartedToCompleted, 
            taskCompletionVsEstimated, 
            taskDependencyCompletionRate 
        };
    } catch (error) {
        console.error("Error fetching task progression data:", error);
        throw error;
    }
};




module.exports.predictTaskCompletion = async () => {
    try {
        const ongoingTasks = await prisma.taskTracking.findMany({
            where: { isCompleted: false },
            select: {
                estimatedDuration: true,
                completionDuration: true,
                createdAt: true,
                completedAt: true,
            },
        });

        let totalEstimatedTime = 0;
        let totalCompletionTime = 0;
        let taskCount = ongoingTasks.length;

        ongoingTasks.forEach(task => {
            totalEstimatedTime += task.estimatedDuration;
            totalCompletionTime += task.completionDuration || 0;
        });

        const avgEstimatedTime = totalEstimatedTime / taskCount;
        const avgCompletionTime = totalCompletionTime / taskCount;

        return {
            avgEstimatedTime,
            avgCompletionTime,
            prediction: avgCompletionTime > avgEstimatedTime ? 'Likely to Delay' : 'On Track',
        };
    } catch (error) {
        console.error("Error predicting task completion:", error);
        throw error;
    }
};



module.exports.getTaskCompletionHeatmap = async () => {
    try {
        
        const completedTasks = await prisma.taskTracking.findMany({
            where: { status: 'COMPLETED' },
            select: { completedAt: true, completionDuration: true },
        });

        
        const completionByHour = Array(24).fill(0);  
        const durationByHour = Array(24).fill(0);   

        completedTasks.forEach(task => {
            if (task.completedAt) {
                const hour = new Date(task.completedAt).getHours();
                completionByHour[hour] += 1;
                durationByHour[hour] += task.completionDuration || 0; 
            }
        });

        return { completionByHour, durationByHour };
    } catch (error) {
        console.error("Error fetching task completion heatmap:", error);
        throw error;
    }
};;