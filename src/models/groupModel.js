const prisma = require("./prismaClient");
const cron = require("node-cron");

exports.createGroup = async ({
  groupName,
  inviteCode,
  groupDesc,
  module,
  createdBy,
}) => {
  return await prisma.studyGroup.create({
    data: {
      groupName,
      inviteCode,
      groupDesc,
      module,
      createdBy,
      createdAt: new Date(),
    },
  });
};

exports.addGroupMember = async ({ groupId, userId, role }) => {
  return await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      role,
      joinedAt: new Date(),
    },
  });
};

exports.getJoinedGroups = async (userId) => {
  return await prisma.groupMember.findMany({
    where: {
      userId: parseInt(userId),
    },
    include: {
      group: {
        include: {
          creator: true,
        },
      },
    },
  });
};

exports.findGroupById = async (groupId) => {
  return await prisma.studyGroup.findUnique({
    where: { groupId },
    include: { creator: { select: { name: true } } },
  });
};

exports.findGroupMembersByGroupId = async (groupId) => {
  return await prisma.groupMember.findMany({
    where: {
      groupId: groupId,
    },
    include: {
      member: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });
};

exports.findGroupByInviteCode = async (inviteCode) => {
  return await prisma.studyGroup.findUnique({
    where: { inviteCode },
  });
};

exports.isUserInGroup = async (userId, groupId) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  return !!member;
};

exports.updateGroup = async (groupId, data) => {
  return await prisma.studyGroup.update({
    where: { groupId },
    data,
  });
};

exports.deleteGroup = async (groupId) => {
  await prisma.groupMember.deleteMany({
    where: { groupId: groupId },
  });
  return await prisma.studyGroup.delete({
    where: { groupId: groupId },
  });
};

// Check if the user is a member of the group and get their role
exports.findGroupMember = async (userId, groupId) => {
  return await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: {
      role: true,
    },
  });
};

// Update the role of a group member
exports.updateMemberRole = async (memberId, groupId, newRole) => {
  return await prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId: memberId,
        groupId,
      },
    },
    data: {
      role: newRole,
    },
  });
};

exports.removeGroupMember = async (userId, groupId) => {
  return await prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
};

exports.fetchMemberRole = async (groupId, userId) => {
  try {
    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId),
        },
      },
      select: {
        role: true,
      },
    });

    return member ? member.role : null;
  } catch (error) {
    console.error("Error fetching member role:", error);
    throw error;
  }
};

exports.createPoll = async ({
  groupId,
  createdBy,
  title,
  description,
  options,
  createdAt,
  pollCloseTime,
}) => {
  return await prisma.poll.create({
    data: {
      groupId,
      createdBy,
      title,
      description,
      createdAt,
      pollCloseTime,
      options: {
        create: options.map((optionText) => ({ text: optionText })),
      },
    },
    include: {
      options: true,
    },
  });
};

exports.getPollsByGroup = async (groupId) => {
  return await prisma.poll.findMany({
    where: { groupId },
    include: {
      options: true, // Include poll options
    },
  });
};

exports.getPollsByGroupWithUserVotes = async (
  groupId,
  groupMemberId,
  filter,
  orderBy
) => {
  try {
    return await prisma.poll.findMany({
      where: { groupId, ...filter },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
        votes: {
          where: { groupMemberId },
          select: {
            optionId: true,
            pollOption: { select: { text: true } },
          },
        },
      },
      orderBy,
    });
  } catch (error) {
    console.error("Error in getPollsByGroupWithUserVotes:", error);
    throw new Error("Failed to fetch polls");
  }
};

// Cast a vote
exports.castVote = async ({ pollId, optionId, groupMemberId }) => {
  await prisma.pollVote.create({
    data: {
      pollId,
      optionId,
      groupMemberId,
    },
  });

  const totalMembers = await prisma.groupMember.count({
    where: {
      groupId: (await prisma.poll.findUnique({ where: { pollId } })).groupId,
    },
  });

  const totalVotes = await prisma.pollVote.count({ where: { pollId } });

  if (totalVotes >= totalMembers) {
    await prisma.poll.update({
      where: { pollId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingCondition: "All members voted",
      },
    });
  }
};

cron.schedule("* * * * *", async () => {
  const currentTime = new Date();

  const pollsToClose = await prisma.poll.findMany({
    where: {
      status: "ACTIVE",
      pollCloseTime: { lte: currentTime },
    },
  });

  // Close each poll
  for (const poll of pollsToClose) {
    await prisma.poll.update({
      where: { pollId: poll.pollId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingCondition: "Poll closed after reaching pollCloseTime",
      },
    });
  }

  if (pollsToClose.length > 0) {
    console.log(`Closed ${pollsToClose.length} polls.`);
  }

  const pollsToArchive = await prisma.poll.findMany({
    where: {
      status: "CLOSED",
      closedAt: { lte: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000) },
    },
  });

  for (const poll of pollsToArchive) {
    await prisma.poll.update({
      where: { pollId: poll.pollId },
      data: {
        status: "ARCHIVED",
      },
    });
    console.log(`Poll with ID ${poll.pollId} has been archived.`);
  }

  if (pollsToArchive.length > 0) {
    console.log(`Archived ${pollsToArchive.length} polls.`);
  }
});

exports.updatePollStatus = async (pollId, status) => {
  return await prisma.poll.update({
    where: { pollId },
    data: { status },
  });
};

exports.getPollAnalytics = async (groupId) => {
  const analytics = await prisma.poll.findMany({
    where: { groupId },
    include: {
      _count: {
        select: {
          votes: true,
        },
      },
      options: {
        select: {
          text: true,
          _count: { select: { votes: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (analytics.length === 0) {
    return { message: "No polls have been created in this group." };
  }

  const mostActiveMembers = await prisma.pollVote.groupBy({
    by: ["groupMemberId"],
    _count: {
      voteId: true,
    },
    orderBy: {
      _count: {
        voteId: "desc",
      },
    },
    take: 3,
  });

  const activeMemberDetails = await Promise.all(
    mostActiveMembers.map(async (member) => {
      const memberDetails = await prisma.groupMember.findUnique({
        where: { membershipId: member.groupMemberId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return {
        ...memberDetails,
        voteCount: member._count.voteId,
      };
    })
  );

  const totalVotes = analytics.reduce(
    (acc, poll) => acc + poll._count.votes,
    0
  );

  const mostPopularPoll = analytics.reduce(
    (max, poll) => (poll._count.votes > max._count.votes ? poll : max),
    analytics[0]
  );

  return {
    totalVotes,
    mostPopularPoll,
    analytics,
    mostActiveMembers: activeMemberDetails,
  };
};

exports.getMessagesByGroup = async (groupId) => {
  return await prisma.studyGroupMessage.findMany({
    where: { groupId },
    orderBy: { sentAt: "asc" },
    include: {
      sender: {
        select: { name: true, avatar: true },
      },
    },
  });
};

exports.sendMessage = async (groupId, userId, content, status = "SENT") => {
  return await prisma.studyGroupMessage.create({
    data: {
      groupId,
      userId,
      content,
      sentAt: new Date(),
      status,
    },
  });
};

exports.updateMessageStatus = async (messageId, status) => {
  return await prisma.studyGroupMessage.update({
    where: { messageId },
    data: { status },
  });
};

exports.getUnseenMessages = async (groupId, userId) => {
  return await prisma.studyGroupMessage.findMany({
    where: {
      groupId,
      userId: { not: userId },
      status: { not: "SEEN" },
    },
  });
};

exports.getSenderDetails = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, avatar: true },
  });
};

exports.getAssignments = async (groupId, userId, sortOrder = 'asc') => {
  // Validate sortOrder
  const validSortOrders = ['asc', 'desc'];
  if (!validSortOrders.includes(sortOrder)) {
    sortOrder = 'asc'; // Default to ascending order if invalid
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      groupId: groupId,
      status: {
        not: "ARCHIVED",
      },
    },
    include: {
      submissions: {
        where: {
          userId: userId,
        },
      },
      group: true,
      creator: true,
    },
    orderBy: {
      dueDate: sortOrder,
    },
  });

  return assignments;
};

exports.createAssignment = async ({
  groupId,
  createdBy,
  title,
  description,
  dueDate,
}) => {
  return prisma.assignment.create({
    data: {
      groupId,
      createdBy,
      title,
      description,
      dueDate: new Date(dueDate),
    },
  });
};

exports.submitAssignment = async ({ assignmentId, fileSubmitted, userId }) => {
  const existingSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId,
      userId,
    },
  });

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { status: true },
  });

  const submissionStatus = assignment.status === 'OVERDUE' ? 'LATE' : 'SUBMITTED';

  if (existingSubmission) {
    await prisma.submission.update({
      where: {
        id: existingSubmission.id,
      },
      data: {
        fileSubmitted,
        submittedAt: new Date(),
        status: submissionStatus,
      },
    });

    return { updated: true };
  } else {
    await prisma.submission.create({
      data: {
        assignmentId,
        fileSubmitted,
        userId,
        submittedAt: new Date(),
        status: submissionStatus, 
      },
    });

    return { updated: false };
  }
};


exports.getSubmissionsByAssignmentId = async (assignmentId) => {
  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId: assignmentId,
    },
    include: {
      submitter: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return submissions;
};

exports.getSubmissionById = async (submissionId) => {
  return prisma.submission.findUnique({
    where: { id: submissionId },
  });
};

exports.updateAssignmentStatuses = async () => {
  const now = new Date();

  // Update status to 'DUE' if the dueDate is within 24 hours
  await prisma.assignment.updateMany({
    where: {
      status: "UPCOMING",
      dueDate: {
        lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // within 24 hours
      },
    },
    data: {
      status: "DUE",
    },
  });

  // Update status to 'OVERDUE' if the dueDate has passed
  await prisma.assignment.updateMany({
    where: {
      status: { in: ["UPCOMING", "DUE"] },
      dueDate: { lt: now },
    },
    data: {
      status: "OVERDUE",
    },
  });

  // Update status to 'CLOSED' if dueDate is over by 7 days 
  const closedAssignments = await prisma.assignment.findMany({
    where: {
      status: { in: ["OVERDUE"] },
      OR: [
        { dueDate: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }, // Over 7 days
      ],
    },
  });

  for (const assignment of closedAssignments) {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: "CLOSED" },
    });
  }

  // Update status to 'ARCHIVED' if the assignment has been closed for 7 days
  await prisma.assignment.updateMany({
    where: {
      status: "CLOSED",
      updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Closed for 7 days
    },
    data: {
      status: "ARCHIVED",
    },
  });
};

exports.updateAssignmentStatusesTest = async (mockedNow) => {
  const now = new Date(mockedNow); // Use mocked time instead of real time

  // Update status to 'DUE' if the dueDate is within 24 hours
  await prisma.assignment.updateMany({
    where: {
      status: "UPCOMING",
      dueDate: {
        lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    data: {
      status: "DUE",
      updatedAt: now,
    },
  });

  // Update status to 'OVERDUE' if the dueDate has passed
  await prisma.assignment.updateMany({
    where: {
      status: { in: ["UPCOMING", "DUE"] },
      dueDate: { lt: now },
    },
    data: {
      status: "OVERDUE",
      updatedAt: now,
    },
  });

  // Update status to 'CLOSED' if dueDate is over by 7 days
  await prisma.assignment.updateMany({
    where: {
      status: "OVERDUE",
      dueDate: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    data: {
      status: "CLOSED",
      updatedAt: now,
    },
  });

  // Update status to 'ARCHIVED' if the assignment has been closed for 7 days
  await prisma.assignment.updateMany({
    where: {
      status: "CLOSED",
      updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    data: {
      status: "ARCHIVED",
      updatedAt: now,
    },
  });
};

exports.getAssignmentStats = async (groupId) => {
  // Fetch all assignments for the group (regardless of status)
  const allAssignments = await prisma.assignment.findMany({
    where: { groupId },
    include: { submissions: true },
  });

  // Fetch only CLOSED and ARCHIVED assignments
  const closedArchivedAssignments = allAssignments.filter(
    (assignment) => assignment.status === "CLOSED" || assignment.status === "ARCHIVED"
  );

  // Total assignments (all statuses)
  const totalAssignments = allAssignments.length;

  // Status distribution (all statuses)
  const statusDistribution = allAssignments.reduce((distribution, assignment) => {
    distribution[assignment.status] = (distribution[assignment.status] || 0) + 1;
    return distribution;
  }, {});

  // Total students in the group
  const totalStudents = await prisma.groupMember.count({ where: { groupId } });

  // If there are no CLOSED or ARCHIVED assignments, return early
  if (closedArchivedAssignments.length === 0) {
    return {
      totalStudents,
      totalAssignments,
      statusDistribution,
      avgSubmissionsPerAssignment: "N/A",
      fullySubmittedPercentage: "N/A",
      noSubmissionAssignments: 0,
      mostActiveAssignments: [],
    };
  }

  // Average submissions per assignment (only CLOSED/ARCHIVED)
  const totalSubmissions = closedArchivedAssignments.reduce(
    (sum, assignment) => sum + assignment.submissions.length,
    0
  );
  const avgSubmissionsPerAssignment = (totalSubmissions / closedArchivedAssignments.length).toFixed(2);

  // Fully submitted assignments (only CLOSED/ARCHIVED)
  const fullySubmittedCount = closedArchivedAssignments.filter(
    (assignment) => assignment.submissions.length === (totalStudents - 1)
  ).length;
  const fullySubmittedPercentage = ((fullySubmittedCount / closedArchivedAssignments.length) * 100).toFixed(2) + "%";

  // Assignments with no submissions (only CLOSED/ARCHIVED)
  const noSubmissionAssignments = closedArchivedAssignments.filter(
    (assignment) => assignment.submissions.length === 0
  ).length;

  // Most active assignments (only CLOSED/ARCHIVED)
  const mostActiveAssignments = closedArchivedAssignments
    .map((assignment) => ({
      title: assignment.title,
      submissions: assignment.submissions.length,
    }))
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 3);

  return {
    totalAssignments,
    totalStudents,
    statusDistribution,
    avgSubmissionsPerAssignment,
    fullySubmittedPercentage,
    noSubmissionAssignments,
    mostActiveAssignments,
  };
};

exports.getAssignmentAnalysis = async (assignmentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: true,
      group: {
        include: {
          members: {
            include: {
              member: true, // Include user details for members
            },
          },
        },
      },
    },
  });

  if (!assignment) return null;

  const nonAdminMembers = assignment.group.members.filter(
    (member) => member.role !== "admin"
  );

  const totalSubmissions = assignment.submissions.length;
  const lateSubmissions = assignment.submissions.filter(
    (submission) => new Date(submission.submittedAt) > new Date(assignment.dueDate)
  ).length;
  
  const onTimeSubmissionRate = totalSubmissions
    ? (((totalSubmissions - lateSubmissions) / totalSubmissions) * 100).toFixed(2)
    : 0;

  const totalNonAdminMembers = nonAdminMembers.length;
  const participationRate = totalNonAdminMembers
    ? ((totalSubmissions / totalNonAdminMembers) * 100).toFixed(2)
    : 0;
  
  const missingAssignmentPercentage = totalNonAdminMembers
    ? ((totalNonAdminMembers - totalSubmissions) / totalNonAdminMembers * 100).toFixed(2)
    : 0;

  const membersWhoDidNotSubmit = nonAdminMembers
    .filter((member) => !assignment.submissions.some((submission) => submission.userId === member.userId))
    .map((member) => member.member.name);

  // Calculate average submission time difference (how early or late students submitted)
  const submissionTimeDiffs = assignment.submissions.map(submission => 
    new Date(submission.submittedAt) - new Date(assignment.dueDate)
  );

  const avgSubmissionTime =
    submissionTimeDiffs.length > 0
      ? (submissionTimeDiffs.reduce((acc, diff) => acc + diff, 0) / submissionTimeDiffs.length) / (1000 * 60 * 60) // Convert ms to hours
      : 0;

  // Identify earliest and latest submissions
  const earliestSubmission = assignment.submissions.length
    ? assignment.submissions.reduce((earliest, current) =>
        new Date(current.submittedAt) < new Date(earliest.submittedAt) ? current : earliest
      )
    : null;

  const latestSubmission = assignment.submissions.length
    ? assignment.submissions.reduce((latest, current) =>
        new Date(current.submittedAt) > new Date(latest.submittedAt) ? current : latest
      )
    : null;

  // Find peak submission hour
  const submissionTimes = assignment.submissions.map(submission => 
    new Date(submission.submittedAt).getHours()
  );

  const peakSubmissionHour =
    submissionTimes.length > 0
      ? submissionTimes
          .sort((a, b) => submissionTimes.filter(v => v === a).length - submissionTimes.filter(v => v === b).length)
          .pop()
      : "N/A";

  return {
    totalSubmissions,
    lateSubmissions,
    onTimeSubmissionRate,
    participationRate,
    missingAssignmentPercentage,
    avgSubmissionTime: avgSubmissionTime.toFixed(2),
    membersWhoDidNotSubmit,
    earliestSubmission: earliestSubmission ? new Date(earliestSubmission.submittedAt).toLocaleString() : "N/A",
    latestSubmission: latestSubmission ? new Date(latestSubmission.submittedAt).toLocaleString() : "N/A",
    peakSubmissionHour
  };
};