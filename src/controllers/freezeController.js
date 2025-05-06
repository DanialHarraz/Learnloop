const FreezePowerUpModel = require('../models/freezeModel');

module.exports.useFreezePowerUp = async (req, res) => {
    const { userId } = req.body; 
    try {
        const result = await FreezePowerUpModel.useFreezePowerUp(parseInt(userId));
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


