const prisma = require('./prismaClient');
const cron = require('node-cron');

exports.findForumById = async (forumId) => {
    return await prisma.forum.findUnique({
      where: { forumId },
    });
  };



exports.createPost = async (title, content, forumId, authorId) => {
    return prisma.post.create({
        data: {
            title,
            content,
            forumId,
            authorId,
        },
    });
};

exports.getAllPosts = async (forumId) => {
    return prisma.post.findMany({
        where: {
            forumId: forumId,  // Ensure forumId matches
        },
        select: {
            postId: true,
            title: true,
            content: true,
            createdAt: true,
            votes: true,
            authorId: true,
            forumId: true, // Include forumId for debugging
        },
    });
};


module.exports.fetchSortedPosts = async (sortBy) => {
    let orderBy = {};

    switch (sortBy) {
        case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
        case 'oldest':
            orderBy = { createdAt: 'asc' };
            break;
        case 'highestVotes':
            orderBy = { votes: { _count: 'desc' } };
            break;
        case 'lowestVotes':
            orderBy = { votes: { _count: 'asc' } };
            break;
        default:
            orderBy = { createdAt: 'desc' }; // Default to newest
    }

    try {
        const posts = await prisma.post.findMany({
            include: { votes: true },
            orderBy,
        });
        return posts;
    } catch (error) {
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
};

exports.getPostById = async (postId) => {
    return prisma.post.findUnique({
        where: {
            id: postId,
        },
    });
};

exports.updatePost = async (postId, title, content) => {
    return prisma.post.update({
        where: {
            postId: postId,
        },
        data: {
            title,
            content,
        },
    });
};

exports.deletePost = async (postId) => {
    return prisma.post.delete({
        where: {
            postId: postId,
        },
    });
};

exports.createOrUpdateVote = async (postId, userId, value) => {

    try {
        const existingVote = await prisma.vote.findFirst({
            where: { postId: postId, userId },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                });
            } else {
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            await prisma.vote.create({
                data: {
                    postId: postId,
                    userId,
                    value,
                },
            });
        }

        const totalVotes = await prisma.vote.aggregate({
            _sum: { value: true },
            where: { postId: postId },
        });

        return { voteCount: totalVotes._sum.value || 0 };
    } catch (error) {
        console.error('Error in createOrUpdateVote:', error);
        throw error;
    }
};

exports.getVote = async () => {
    const voteCount = await Vote.sum('value', {
        where: { postId }
    });

    return voteCount || 0; }

//Comments, Replies
exports.addComment = async (postId, userId, content, parentId = null) => {
    const parsedParentId = parentId !== null ? parseInt(parentId, 10) : null;

    try {
        return await prisma.$transaction(async (prisma) => {
            const newComment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content,
                    parentId: parsedParentId,
                },
            });

            if (parsedParentId) {
                const post = await prisma.post.findUnique({
                    where: {
                      postId: postId,
                    },
                    select: {
                      authorId: true,
                    },
                  });

                if (post && post.authorId) {
                    const username = (await this.getUsername(userId)).name;
                    await exports.createNotification(
                        post.authorId,
                        postId,
                        `Replied by ${username}: ${content}`,
                    );
                }
            }

            return newComment;
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        throw new Error('Unable to add comment');
    }
};



exports.addReply = async (postId, userId, content, parentId) => {
    console.log('Adding reply with data:', { postId, userId, content, parentId });
    const newReply = await prisma.comment.create({
        data: {
            postId,
            userId,
            content,
            parentId,
        },
    });
    console.log('New reply added:', newReply);

    // Create a notification for the post author
    const postAuthorId = await postAuthorId(postId); // You need to implement this function to get the post author ID
    const username = await forumModel.getUsername(userId);
    const message = `Replied by ${username}: ${content}`;
    await this.createNotification(postAuthorId, postId, message, forumId); // Assuming forumId is available in the context

    return newReply;
};

exports.deleteComment = async (commentId) => {
    try {
        // First, recursively fetch all descendants
        const getAllDescendantIds = async (parentId) => {
            const descendants = await prisma.comment.findMany({
                where: { parentId: parentId },
                select: { id: true } // Use 'id' instead of 'commentId'
            });
            
            let descendantIds = descendants.map(d => d.id); // Use 'id' instead of 'commentId'
            
            // Recursively get descendants of each child
            for (const descendant of descendants) {
                const childDescendants = await getAllDescendantIds(descendant.id); // Use 'id' instead of 'commentId'
                descendantIds = [...descendantIds, ...childDescendants];
            }
            
            return descendantIds;
        };

        // Get all descendant IDs
        const descendantIds = await getAllDescendantIds(commentId);
        
        // Delete all descendants and the comment itself in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete all descendants first (in reverse order to handle foreign key constraints)
            if (descendantIds.length > 0) {
                await tx.comment.deleteMany({
                    where: {
                        id: {
                            in: descendantIds
                        }
                    }
                });
            }
            
            // Delete the original comment
            await tx.comment.delete({
                where: {
                    id: commentId
                }
            });
        });

        return true;
    } catch (error) {
        console.error('Error deleting comment and descendants:', error);
        throw error;
    }
};
  
  
exports.getComment = async (postId) => {
    postId = parseInt(postId, 10); // Convert postId to an integer

    return await prisma.comment.findMany({
        where: { postId: postId}, // Get only top-level comments
        include: {
            replies: {
                orderBy: { createdAt: 'asc' }, // Optional: order replies by creation date
                include: {
                    user: true, // Include user details for the reply (optional)
                },
            },
            user: true, // Include user details for the main comment (optional)
        },
    });
};

exports.getUsername = async (userId) => {
    try {
        return await prisma.user.findUnique({
            where: {
                id: parseInt(userId)
            },
            select: {
                name: true
            }
        });
    } catch (error) {
        console.error('Error fetching username:', error);
        throw error; // Throw the error to be caught by the controller
    }
}

exports.getUnreadNotificationCount = async (userId, forumId) => {
      return await prisma.notification.count({
        where: {
          userId: userId,
          read: false, // Only count unread notifications
        },
      });
    }

exports.createNotification = async (userId, postId, message, forumId) => {
    return await prisma.notification.create({
        data: {
            userId,
            postId,
            message,
            forumId, // Store forumId along with other data
            read: false,
        },
    });
};


exports.getNotifications = async (userId, forumId) => {
    return await prisma.notification.findMany({
        where: {
            userId: parseInt(userId, 10),
            post: {
                forumId: parseInt(forumId, 10)
            }
        },
        orderBy: { createdAt: 'desc' },
    });
};

exports.markNotificationAsRead = async (notificationId) => {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
};

exports.deleteNotification = async (notificationId) => {
    return await prisma.notification.delete({
        where: { id: notificationId },
    });
};

exports.getNotificationById = async (notificationId) => {
    return await prisma.notification.findUnique({
        where: { id: notificationId },
    });
};

exports.createForum = async (forumName, forumTopic) => {
    return await prisma.forum.create({
      data: {
        forumName,
        forumTopic,
      },
    });
  };

//ForumMain
exports.findAllForums = async () => {
    try {
        return await prisma.forum.findMany();
    } catch (error) {
        console.error('Error fetching all forums in model:', error);
        throw new Error('Could not retrieve forums');
    }
};

exports.updateForumStatus = async (forumId, status) => {
    try {
        let updateData = { status };
        
        if (status === "closed") {
            updateData.inactiveStart = new Date();
            updateData.inactiveDays = 0;
        } else if (status === "open") {
            updateData.inactiveStart = null;
            updateData.inactiveDays = 0;
        }
        
        return await prisma.forum.update({
            where: { forumId },
            data: updateData
        });
    } catch (error) {
        console.error("Error in forum model - update status:", error);
        throw error;
    }
};

exports.checkInactiveForums = async () => {
    try {
        console.log("🔍 Starting forum inactivity check...");

        // Fetch forums that are closed or archived
        const forums = await prisma.forum.findMany({
            where: { status: { in: ["closed", "archived"] } },
        });

        const now = new Date();

        for (let forum of forums) {
            const forumId = forum.forumId;
            const inactiveStart = new Date(forum.inactiveStart);

            console.log(`⏳ Forum ${forumId} inactiveStart: ${inactiveStart}`);

            // If no valid inactiveStart, skip this forum
            if (!forum.inactiveStart || inactiveStart > now || isNaN(inactiveStart.getTime())) {
                console.log(`⚠️ Forum ${forumId} has an invalid inactiveStart. Skipping.`);
                continue;
            }

            // ✅ Calculate inactive days by rounding off to nearest integer
            const daysInactive = Math.round((now - inactiveStart) / (1000 * 60 * 60 * 24)); // Rounds to nearest integer
            console.log("Days inactive for Forum " + forumId + " is:", daysInactive); // Debugging log

            console.log(`➡️ Checking forum ${forumId} (Status: ${forum.status}, Stored Inactive Days: ${forum.inactiveDays}, Calculated Days: ${daysInactive})`);

            // 📌 Archive forum if inactive for 10 days and still "closed"
            if (daysInactive >= 10 && forum.status.toLowerCase() === "closed") {
                await archiveForum(forumId, daysInactive);
                continue;
            }

            // ❌ Delete forum if inactive for 30 days while archived
            if (daysInactive >= 30 && forum.status.toLowerCase() === "archived") {
                await deleteForum(forumId);
                continue;
            }

            // ✅ Only update inactiveDays if it has changed
            if (daysInactive !== forum.inactiveDays) {
                console.log(`📝 Updating Forum ${forumId} inactiveDays to ${daysInactive}`);
                await prisma.forum.update({
                    where: { forumId },
                    data: { inactiveDays: daysInactive },
                });
            } else {
                console.log(`⏭️ Skipping forum ${forumId} - No changes needed.`);
            }
        }

        console.log("✅ Forum inactivity check completed.");
    } catch (error) {
        console.error("❌ Error checking inactive forums:", error);
    }
};

// 📌 Function to archive a forum
const archiveForum = async (forumId, daysInactive) => {
    try {
        console.log(`📌 Attempting to archive Forum ${forumId}...`);

        const updatedForum = await prisma.forum.update({
            where: { forumId },
            data: {
                status: "archived",
                inactiveStart: new Date(),
                inactiveDays: daysInactive, // Ensure inactiveDays is correctly updated
            },
        });

        console.log(`✔️ Forum ${forumId} archived. Updated Data:`, updatedForum);
        return true; // ✅ Success
    } catch (error) {
        console.error(`❌ Error archiving Forum ${forumId}:`, error);
        return false; // ❌ Failure
    }
};

// ❌ Function to delete a forum
const deleteForum = async (forumId) => {
    try {
        console.log(`❌ Forum ${forumId} reached 30 days in archived state. Deleting...`);
        await prisma.forum.delete({ where: { forumId } });
        console.log(`✔️ Forum ${forumId} successfully deleted.`);
    } catch (error) {
        console.error(`❌ Error deleting Forum ${forumId}:`, error);
    }
};

// Run the function every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log("⏳ Running daily forum inactivity check...");
    await exports.checkInactiveForums();
});
