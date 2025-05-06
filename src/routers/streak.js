const express = require('express');
const streakController = require('../controllers/streakController');   
const freezeController = require('../controllers/freezeController'); 
const router = express.Router();

router.post('/create', streakController.createStreak);
router.get('/retrieve/:userId', streakController.getStreak);
router.post('/accountability/set', streakController.setAccountabilityPartner);
router.get('/accountability/progress/:userId', streakController.getPartnerProgress);
router.get('/users/list', streakController.getUsers);
router.post('/accountability/request', streakController.sendPartnerRequest);
router.put('/accountability/accept', streakController.acceptPartnerRequest);
router.put('/accountability/reject', streakController.rejectPartnerRequest);
router.get('/accountability/requests/:userId', streakController.getPartnerRequests);
router.get('/accountability/requests/sent/:userId', streakController.getSentRequests);
router.delete('/accountability/cancel/:requestId', streakController.cancelRequest);

//leaderboards
router.get('/leaderboard/current', streakController.getCurrentStreakLeaderboard);
router.get('/leaderboard/longest', streakController.getLongestStreakLeaderboard);
router.get('/leaderboard/partner', streakController.getPartnerStreakLeaderboard);


//Freeze Power-Up
router.post('/freeze/use', freezeController.useFreezePowerUp);


//Notifications
router.get('/streak-notifications/:userId', streakController.getUserStreakNotifications);
router.post('/streak-notifications/mark-as-read', streakController.markStreakNotificationAsRead);
router.post('/streak-nudge', streakController.nudgePartnerController);

module.exports = router;
