const forumModel = require('../models/forumModel');
const cron = require('node-cron');

exports.getForumById = async (req, res) => {
  const forumId = parseInt(req.params.forumId);
  try {
      const forum = await forumModel.findForumById(forumId);

      if (forum) {
          res.status(200).json(forum);
      } else {
          res.status(404).json({ message: 'Forum not found' });
      }
  } catch (error) {
      console.error('Error fetching forum in controller:', error);
      res.status(500).json({ message: 'Server error' });
  }
};

module.exports.createPost = async (req, res) => {
    const { title, content} = req.body;
    const forumId  = parseInt(req.params.forumId);
    const authorId = parseInt(req.params.authorId);
    console.log(title,content,forumId,authorId);

    if (!title || !content || !forumId || !authorId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newPost = await forumModel.createPost(title, content, forumId, authorId);
        res.status(201).json({ message: 'Posted successfully'});
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const { forumId } = req.params; // Get forumId from URL params
        const posts = await forumModel.getAllPosts(parseInt(forumId)); // Convert to number if needed
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports.getSortedPosts = async (req, res) => {
    const { sortBy } = req.query;

    try {
        const posts = await fetchSortedPosts(sortBy);
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error in getSortedPosts:', error.message);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};


module.exports.getPostById = async (req, res) => {
    const postId = parseInt(req.params.id, 10);

    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
    }

    try {
        const post = await forumModel.getPostById(postId);
        if (post) {
            res.status(200).json(post);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
};

module.exports.updatePost = async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { title, content } = req.body;

    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
    }

    if (!title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const updatedPost = await forumModel.updatePost(postId, title, content);
        res.status(200).json({ message: 'Post updated successfully'});
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
};

module.exports.deletePost = async (req, res) => {
    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
    }

    try {
        await forumModel.deletePost(postId);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};

module.exports.postVote = async (req, res) => {
    const postId = parseInt(req.params.postId, 10); // Ensure postId is parsed as an integer
    const { value } = req.body;
    const userId = req.body.userId;

    // Log the received value for debugging
    console.log(`Received vote value: ${value}`);
    console.log(`Type of Received Vote Value: ${typeof value}`);
    console.log('Request Body:', req.body);

    // Log the postId for debugging
    console.log(`Post ID: ${postId}`);
    console.log(`Type of Post ID: ${typeof postId}`);

    if (isNaN(postId) || (value !== 1 && value !== -1)) {
        console.error(`Invalid vote value: ${value}`);
        return res.status(400).json({ error: 'Invalid vote value. Must be 1 (upvote) or -1 (downvote).' });
    }

    try {
        const vote = await forumModel.createOrUpdateVote(postId, userId, value);
        res.status(200).json({ message: 'Vote registered successfully', voteCount: vote.voteCount });
    } catch (error) {
        console.error('Error processing vote:', error);
        console.error('Error details:', error);
        res.status(500).json({ error: 'Failed to process vote' });
    }
};

module.exports.getVote = async (req, res) => {
    try {
        const postVotes = await forumModel.getVote();
        res.status(200).json(postVotes);
    } catch (error) {
        console.error('Error fetching post votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
};

exports.getForumStatus = async (req, res) => {
    const forumId = req.params.forumId;
    try {
        const status = await getForumStatus(forumId);
        res.json({ status });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve forum status' });
    }
};

//Comments, Replies
exports.getComment = async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid postId' });
    }

    try {
        const comments = await forumModel.getComment(postId);
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

    exports.addComment = async (req, res) => {
        const { postId, userId, content, parentId } = req.body;

        // Validate input
        if (!postId || !userId || !content) {
            return res.status(400).json({ error: 'Missing required fields: postId, userId, or content.' });
        }

        try {
            // Add the comment and handle notifications
            const newComment = await forumModel.addComment(postId, userId, content, parentId);

            return res.status(201).json({
                message: 'Comment added successfully.',
                comment: newComment,
            });
        } catch (error) {
            console.error('Error in addComment controller:', error);
            return res.status(500).json({ error: 'Failed to add comment.' });
        }
    };

exports.addReply = async (req, res) => {
    const { postId, userId, content, parentId } = req.body;
    console.log('Received reply data:', { postId, userId, content, parentId });

    if (!postId || !userId || !content || !parentId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newReply = await forumModel.addReply(postId, userId, content, parentId);
        console.log('New reply created:', newReply);
        res.status(201).json(newReply); // Return the newly created reply
    } catch (error) {
        console.error('Error adding reply:', error); // Log any error
        res.status(500).json({ error: error.message });
    }
};

  
exports.deleteComment = async (req, res) => {
    const commentId = parseInt(req.params.commentId, 10);  // Ensure the commentId is parsed as an integer
    const userId = req.body.userId;

    console.log('Received request to delete comment with ID:', commentId);
    console.log('User ID:', userId);

    try {
        await forumModel.deleteComment(commentId, userId);
        console.log('Comment deleted successfully in controller');
        res.status(204).send('Comment deleted successfully');
    } catch (error) {
        console.error('Error deleting comment in controller:', error);
        res.status(500).json({ error: error.message });
    }
};
// Create a notification
exports.createNotification = async (req, res) => {
    const { userId, postId, message, forumId } = req.body;
    try {
        const newNotification = await forumModel.createNotification(userId, postId, message, forumId);
        return res.status(201).json({ notification: newNotification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ error: 'Unable to create notification' });
    }
};

exports.getUsername = async (req, res) => {
    const {userId} = req.params;
    try {
        const user = await forumModel.getUsername(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ username: user.username });
    } catch (error) {
        console.error('Error fetching username by ID:', error);
        return res.status(500).json({ error: 'Unable to fetch username' });
    }
};

exports.getUnreadNotificationCount = async(req, res) => {
    try {
      const { userId, forumId} = req.params;
      const count = await forumModel.getUnreadNotificationCount(
        parseInt(userId),
        parseInt(forumId)
      );
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
}

exports.getNotifications = async (req, res) => {
    const { userId, forumId } = req.params;
    try {
        const notifications = await forumModel.getNotifications(userId, forumId);
        return res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Unable to fetch notifications' });
    }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        const updatedNotification = await forumModel.markNotificationAsRead(notificationId);
        return res.status(200).json({ notification: updatedNotification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Unable to mark notification as read' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await forumModel.deleteNotification(notificationId);
        return res.status(204).json(); // No content to return after deletion
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Unable to delete notification' });
    }
};

// Get a specific notification by ID
exports.getNotificationById = async (req, res) => {
    const { notificationId } = req.params;
    try {
        const notification = await forumModel.getNotificationById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        return res.status(200).json({ notification });
    } catch (error) {
        console.error('Error fetching notification by ID:', error);
        return res.status(500).json({ error: 'Unable to fetch notification' });
    }
};

exports.createForum = async (req, res) => {
    try {
      const { forumName, forumTopic} = req.body;
      const newForum = await forumModel.createForum(forumName, forumTopic); 
      res.status(201).json({ message: 'Forum created successfully', forum: newForum });
    } catch (error) {
      console.error('Error creating forum:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

//ForumMain
exports.getAllForums = async (req, res) => {
    try {
        const forums = await forumModel.findAllForums();
        res.status(200).json(forums);
    } catch (error) {
        console.error('Error fetching forums:', error);
        res.status(500).json({ message: 'Server error' });
    }
  };

  exports.updateForumStatus = async (req, res) => {
    const { forumId } = req.params;
    const { status } = req.body;
    
    try {
        const forum = await forumModel.updateForumStatus(
            parseInt(forumId, 10), 
            status
        );
        return res.status(200).json({
            message: "Forum status updated successfully",
            forum
        });
    } catch (error) {
        console.error("Error updating forum status:", error);
        return res.status(500).json({ error: "Failed to update forum status" });
    }
};

exports.checkInactiveForums = async (req, res) => {
    try {
        await forumModel.checkInactiveForums();
        res.status(200).json({
            message: "Inactive forum check completed successfully."
        });
    } catch (error) {
        console.error("Error in controller - checking inactive forums:", error);
        res.status(500).json({ error: "Error checking inactive forums" });
    }
};
