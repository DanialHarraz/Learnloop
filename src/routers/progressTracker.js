const express = require('express');
const ProgressTrackerController = require('../controllers/progressTrackerControllers');

const router = express.Router();

router.post('/create', ProgressTrackerController.createProgressTracker); 
router.put('/task/complete/:taskId', ProgressTrackerController.completeTask);
router.put('/update/:id', ProgressTrackerController.updateProgressTracker); 
router.get('/retrieve/:id', ProgressTrackerController.getProgressTracker); 
router.get('/user/:userId', ProgressTrackerController.getAllProgressTrackers);
router.get('/aggregated/user/:userId', ProgressTrackerController.getAggregatedData); 
router.get('/task-completion/user/:userId', ProgressTrackerController.getTaskCompletionData); 
router.delete('/delete/:id', ProgressTrackerController.deleteProgressTracker); 
router.get('/tasks/:id', ProgressTrackerController.getTasksForTracker);
router.get('/completion-stats/user/:userId', ProgressTrackerController.getCompletionStatistics);
router.get('/insights/user/:userId', ProgressTrackerController.getProgressInsights);
router.get('/progress/dashboard/:userId', ProgressTrackerController.getLearningDashboard);
router.get('/completion-breakdown/:userId', ProgressTrackerController.getCompletionBreakdown);
router.put('/update-status/:id', ProgressTrackerController.updateProgressTrackerStatus);


    
module.exports = router;
