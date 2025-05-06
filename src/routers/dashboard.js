const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Get task progression data
router.get('/task-progression', dashboardController.getTaskProgression);
router.get('/predict-task-completion', dashboardController.predictTaskCompletion);
router.get('/heatMap', dashboardController.getTaskCompletionHeatmap);

module.exports = router;
