const express = require('express');
const groupController = require('../controllers/groupController');


const router = express.Router();

router.post('/create',groupController.createGroup);
router.get('/', groupController.getJoinedGroups);
router.post('/join', groupController.joinGroup);
router.get('/specificGroup/:groupId', groupController.getGroupById);
router.get('/specificGroup/:groupId/members', groupController.getGroupMembers);
router.put('/specificGroup/:groupId', groupController.updateGroup);
router.delete('/specificGroup/:groupId', groupController.deleteGroup);
router.put('/specificGroup/:groupId/makeModerator', groupController.makeModerator);
router.delete('/specificGroup/:groupId/kickMember', groupController.kickMember);
router.get('/specificGroup/:groupId/memberRole/:userId', groupController.getMemberRole);
router.post('/specificGroup/:groupId/createPoll', groupController.createPoll);
router.get('/specificGroup/:groupId/:groupMemberId/polls', groupController.loadPolls);
router.post('/specificGroup/:pollId/castVote', groupController.castVote);
router.put('/specificGroup/:pollId/pausePoll', groupController.pausePoll);
router.put('/specificGroup/:pollId/resumePoll', groupController.resumePoll);
router.get('/specificGroup/:groupId/pollAnalytics', groupController.loadPollAnalytics);
router.get('/specificGroup/chat/:groupId', groupController.getMessagesByGroup);
router.post('/specificGroup/chat/:groupId', groupController.sendMessage);
router.get('/specificGroup/assignment/:groupId/user/:userId', groupController.getAllAssignments);
router.post('/specificGroup/assignment/:groupId', groupController.createAssignment);
router.post('/specificGroup/assignment/:groupId/submit/:assignmentId', groupController.submitAssignment);
router.get('/specificGroup/assignment/:assignmentId/submissions', groupController.getAssignmentSubmissions);
router.get('/specificGroup/assignment/download/:submissionId', groupController.downloadSubmission);
router.get('/specificGroup/assignment/:groupId/statistics', groupController.getAssignmentStatistics);
router.get('/specificGroup/assignment/:assignmentId/analysis', groupController.getAssignmentAnalysis);

module.exports = router;