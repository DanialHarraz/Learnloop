const groupModel = require('../models/groupModel');
const multer = require('multer');
const path = require('path');

exports.createGroup = async (req, res, next) => {
  try {
    const { groupName, inviteCode, groupDesc, module, createdBy } = req.body;

    // Create the group and add the creator to GroupMember
    const newGroup = await groupModel.createGroup({
      groupName,
      inviteCode,
      groupDesc,
      module,
      createdBy,
    });

    // Add creator to GroupMember table as the admin
    await groupModel.addGroupMember({
      groupId: newGroup.groupId,
      userId: createdBy,
      role: 'admin',
    });

    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    next(error);
  }
};

exports.getJoinedGroups = async (req, res, next) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const groups = await groupModel.getJoinedGroups(userId);
    res.status(200).json({ groups });

  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};

exports.getGroupById = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
      const group = await groupModel.findGroupById(groupId);

      if (group) {
          res.status(200).json(group);
      } else {
          res.status(404).json({ message: 'Group not found' });
      }
  } catch (error) {
      console.error('Error fetching group in controller:', error);
      res.status(500).json({ message: 'Server error' });
  }
};

exports.getGroupMembers = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId);
  try {
      const members = await groupModel.findGroupMembersByGroupId(groupId);

      if (members) {
          res.status(200).json(members);
      } else {
          res.status(404).json({ message: 'No members found for this group' });
      }
  } catch (error) {
      console.error('Error fetching group members in controller:', error);
      res.status(500).json({ message: 'Server error' });
  }
};

exports.joinGroup = async (req, res) => {
  const { inviteCode, userId } = req.body;

  if (!inviteCode || !userId) {
    return res.status(400).json({ message: 'Invite code and user ID are required' });
  }

  try {
    // Find the group by invite code
    const group = await groupModel.findGroupByInviteCode(inviteCode);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member of the group
    const isMember = await groupModel.isUserInGroup(userId, group.groupId);
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to the group as a member
    await groupModel.addGroupMember({
      groupId: group.groupId,
      userId: userId,
      role: 'member',
    });

    res.status(200).json({ message: 'Successfully joined the group' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Failed to join group' });
  }
};

exports.updateGroup = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const { groupName, groupDesc, module } = req.body;
  const userId = req.body.userId; 

  try {
      // Check if the user is the creator of the group
      const group = await groupModel.findGroupById(groupId);
      if (!group || group.createdBy !== userId) {
          return res.status(403).json({ message: 'Not authorized to update this group' });
      }

      // Update the group
      const updatedGroup = await groupModel.updateGroup(groupId, { groupName, groupDesc, module });
      res.status(200).json(updatedGroup);
  } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = req.body.userId;

  try {
      const group = await groupModel.findGroupById(groupId);

      if (group.createdBy !== userId) {
          return res.status(403).send('You are not authorized to delete this group');
      }

      await groupModel.deleteGroup(groupId); // Delete group and related data
      res.status(200).send('Group deleted successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Failed to delete group');
  }
};

exports.makeModerator = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const memberId = parseInt(req.body.memberId);
  const userId = parseInt(req.body.userId);
  
  try {
    // Check if the user making the request is an admin
    const groupMember = await groupModel.findGroupMember(userId, groupId);
    if (!groupMember || groupMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign moderators' });
    }

    // Update the member's role to "moderator"
    const updatedMember = await groupModel.updateMemberRole(memberId, groupId, 'moderator');
    res.status(200).json({ message: 'Role updated to moderator', member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.kickMember = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const memberId = parseInt(req.body.memberId);
  const userId = parseInt(req.body.userId); // Admin or moderator ID performing the action
  
  try {
    // Check if the user making the request has admin privileges
    const requester = await groupModel.findGroupMember(userId, groupId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can kick members' });
    }

    // Check if the member is part of the group
    const member = await groupModel.findGroupMember(memberId, groupId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    // Kick the member
    await groupModel.removeGroupMember(memberId, groupId);
    res.status(200).json({ message: 'Member kicked successfully' });
  } catch (error) {
    console.error('Error kicking member:', error);
    res.status(500).json({ message: 'Failed to kick member' });
  }
};

exports.getMemberRole = async (req, res) => {
  const { groupId, userId } = req.params;

  try {
      const role = await groupModel.fetchMemberRole(groupId, userId);

      if (role) {
          res.status(200).json({ role });
      } else {
          res.status(404).json({ error: 'Member role not found' });
      }
  } catch (error) {
      console.error('Error fetching member role:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPoll = async (req, res) => {
  const { createdBy, title, description, options } = req.body;
  const groupId = parseInt(req.params.groupId);

  if (!groupId || !createdBy || !title || !options || !options.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const createdAt = new Date();
    const pollCloseTime = new Date(createdAt.getTime() + 5 * 60 * 1000); 

    const poll = await groupModel.createPoll({ 
      groupId, 
      createdBy, 
      title, 
      description, 
      options, 
      createdAt, 
      pollCloseTime  
    });

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create poll', details: error.message });
  }
};

exports.getPollsByGroup = async (req, res) => {
  const groupId = parseInt(req.params.groupId);

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required' });
  }

  try {
    // Fetch polls from the database
    const polls = await groupModel.getPollsByGroup(groupId);
    res.status(200).json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load polls', details: error.message });
  }
};

exports.loadPolls = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const groupMemberId = parseInt(req.params.groupMemberId);
  const { sortBy } = req.query;

  if (!groupId) {
    return res.status(400).json({ error: "Group ID is required" });
  }

  try {
    let filter = {}; 
    let orderBy = { createdAt: "desc" }; 

    if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (["active", "paused", "closed"].includes(sortBy)) {
      filter = { status: sortBy.toUpperCase() }; 
    }

    const polls = await groupModel.getPollsByGroupWithUserVotes(groupId, groupMemberId, filter, orderBy);
    res.status(200).json(polls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load polls", details: error.message });
  }
};

// Cast a vote
exports.castVote = async (req, res) => {
  const pollId = parseInt(req.body.pollId);
  const optionId = parseInt(req.body.optionId);
  const groupMemberId = parseInt(req.body.groupMemberId);

  if (!pollId || !optionId || !groupMemberId) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      const vote = await groupModel.castVote({ pollId, optionId, groupMemberId });
      res.status(201).json({ message: 'Vote cast successfully', vote });
  } catch (error) {
      res.status(500).json({ error: 'Failed to cast vote', details: error.message });
  }
};

// Pause a poll
exports.pausePoll = async (req, res) => {
  const pollId = parseInt(req.params.pollId);

  if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
  }

  try {
      await groupModel.updatePollStatus(pollId, 'PAUSED');
      res.status(200).json({ message: 'Poll paused successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to pause poll', details: error.message });
  }
};

exports.resumePoll = async (req, res) => {
  const pollId = parseInt(req.params.pollId);

  if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
  }

  try {
      await groupModel.updatePollStatus(pollId, 'ACTIVE');
      res.status(200).json({ message: 'Poll resumed successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to resume poll', details: error.message });
  }

};

exports.loadPollAnalytics = async (req, res) => {
  const groupId = parseInt(req.params.groupId);

    try {
        const analyticsData = await groupModel.getPollAnalytics(Number(groupId));
        res.status(200).json(analyticsData);
    } catch (error) {
        console.error("Error loading poll analytics:", error);
        res.status(500).json({ message: "Failed to load poll analytics." });
    }
  
};

exports.getMessagesByGroup = async (req, res) => {
  const groupId = parseInt(req.params.groupId);

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required' });
  }

  try {
    const messages = await groupModel.getMessagesByGroup(groupId);
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load messages', details: error.message });
  }
};

const onlineUsers = new Set();
exports.sendMessage = async (groupId, userId, content) => {
  if (!groupId || !userId || !content) {
    throw new Error("Group ID, User ID, and content are required.");
  }

  try {
    let status = "SENT";
    const groupMembers = await groupModel.getGroupMembers(groupId);
    const otherMembersOnline = groupMembers.some(
      (member) => onlineUsers.has(member.userId) && member.userId !== userId
    );
    console.log("Other members online:", otherMembersOnline);

    if (otherMembersOnline) {
      status = "DELIVERED";
    }

    const message = await groupModel.sendMessage(groupId, userId, content, status);
    const senderDetails = await groupModel.getSenderDetails(userId);

    const messageWithSender = {
      ...message,
      sender: { name: senderDetails.name, avatar: senderDetails.avatar },
    };

    return messageWithSender;
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    throw error;
  }
};

exports.getAllAssignments = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);
  const { sortOrder } = req.query; 

  try {
    const assignments = await groupModel.getAssignments(groupId, userId, sortOrder);
    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

exports.createAssignment = async (req, res) => {
  const { title, description, dueDate } = req.body;
  const groupId = parseInt(req.body.groupId);
  const createdBy = parseInt(req.body.createdBy);

  try {
    await groupModel.createAssignment({ groupId, createdBy, title, description, dueDate });
    res.status(201).json({ message: 'Assignment created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating assignment' });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage }).single('file');

exports.submitAssignment = (req, res) => {
  upload(req, res, async function (err) {
      if (err) {
          return res.status(500).json({ error: 'Error uploading file' });
      }

      const assignmentId = parseInt(req.params.assignmentId);
      const fileSubmitted = req.file.path; 
      const userId = parseInt(req.body.userId);

      try {
          const result = await groupModel.submitAssignment({ assignmentId, fileSubmitted, userId });

          if (result.updated) {
              res.status(200).json({ message: 'Assignment updated successfully' });
          } else {
              res.status(201).json({ message: 'Assignment submitted successfully' });
          }
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error submitting assignment' });
      }
  });
};

exports.getAssignmentSubmissions = async (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId);

  try {
    const submissions = await groupModel.getSubmissionsByAssignmentId(assignmentId);
    res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch assignment submissions" });
  }
};

exports.downloadSubmission = async (req, res) => {
  const submissionId = parseInt(req.params.submissionId);

  try {
      const submission = await groupModel.getSubmissionById(submissionId);

      if (submission) {
          const filePath = path.resolve(submission.fileSubmitted);
          res.download(filePath, path.basename(filePath), (err) => {
              if (err) {
                  console.error(err);
                  res.status(500).json({ error: "Failed to download the file" });
              }
          });
      } else {
          res.status(404).json({ error: "Submission not found" });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching the submission" });
  }
};

exports.getAssignmentStatistics = async (req, res) => {
  const groupId = parseInt(req.params.groupId);

  try {
    const stats = await groupModel.getAssignmentStats(groupId);
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch assignment statistics" });
  }
};

exports.getAssignmentAnalysis = async (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId);

  try {
    const analysis = await groupModel.getAssignmentAnalysis(assignmentId);
    res.status(200).json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch assignment analysis" });
  }
};