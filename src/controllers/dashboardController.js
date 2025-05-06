const dashboardModel = require('../models/dashboardModel');

module.exports.getTaskProgression = async (req, res) => {
    try {
        const progressionData = await dashboardModel.getTaskProgression();
        res.status(200).json(progressionData);
    } catch (error) {
        console.error("Error fetching task progression:", error);
        res.status(500).json({ error: "Error fetching task progression" });
    }
};



module.exports.predictTaskCompletion = async (req, res) => {
    try {
        const predictionData = await dashboardModel.predictTaskCompletion();
        res.status(200).json(predictionData);
    } catch (error) {
        console.error("Error predicting task completion:", error);
        res.status(500).json({ error: "Error predicting task completion" });
    }
};


module.exports.getTaskCompletionHeatmap  = async (req, res) => {
    try {
        const predictionData = await dashboardModel.getTaskCompletionHeatmap();
        res.status(200).json(predictionData);
    } catch (error) {
        console.error("Error predicting task completion:", error);
        res.status(500).json({ error: "Error predicting task completion" });
    }
};
