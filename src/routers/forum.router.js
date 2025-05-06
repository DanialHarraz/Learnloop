const express = require('express');
const forumController = require('../controllers/forumController'); // Import the controller

const router = express.Router();

router.get('/forumId', forumController.getForumById);

//ForumMain
router.get('/all', forumController.getAllForums);
router.put('/status/:forumId', forumController.updateForumStatus);
router.post('/create', forumController.createForum);
router.post("/check-inactive", forumController.checkInactiveForums);


//Forum
router.post('/:forumId/post/:authorId', forumController.createPost); // Create a new post
router.get('/:forumId/post', forumController.getAllPosts); // Get all posts
router.get('/:forumId/post', forumController.getSortedPosts); // Get all post with fiter
router.get('/:forumId/post/:postId', forumController.getPostById); // Get post by ID
router.put('/:forumId/post/:postId', forumController.updatePost); // Update a post
router.delete('/:forumId/post/:postId', forumController.deletePost); // Delete a post

router.post('/:forumId/post/:postId/vote', forumController.postVote);
router.get('/:forumId/vote', forumController.getVote); 

///Forum Commenting, Replies
router.post('/:forumId/post/:postId/comment', forumController.addComment); // Add a comment
router.post('/:forumId/post/:postId/reply', forumController.addReply);
router.get('/:forumId/post/:postId/comment', forumController.getComment) // Get a comment
router.delete('/:forumId/post/:postId/comment/:commentId', forumController.deleteComment); // Delete a comment

router.get("/:forumId/notifications/unread/user/:userId", forumController.getUnreadNotificationCount);
router.post('/:forumId/notifications', forumController.createNotification);
router.get('/:forumId/notifications/user/:userId', forumController.getNotifications);
router.patch('/:forumId/notifications/:notificationId/read', forumController.markNotificationAsRead);
router.delete('/:forumId/notifications/:notificationId', forumController.deleteNotification);
router.get('/:forumId/notifications/:notificationId', forumController.getNotificationById);

router.get('/:forumId/user/:userId', forumController.getUsername);

module.exports = router;
