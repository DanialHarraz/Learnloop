this is my prisma.schema 
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
model User {
  id                 Int               @id @default(autoincrement())
  email              String            @unique
  name               String
  password           String
  avatar             String?
  bio                String?
  created_at         DateTime          @default(now())
  updated_at         DateTime          @updatedAt()
  status             String?           @default("not active")
  ProgressTracker    ProgressTracker[]
  studyGroups        StudyGroup[]      @relation("UserStudyGroups")
  groupMembers       GroupMember[]
  studyGroupMessages StudyGroupMessage[]
  assignments     Submission[]
  resources       Resource[]
  posts           Post[]
  votes           Vote[]
  userActivity UserActivity[]
  quiz            Quiz[]
  Comment Comment[]
  HistoricalData HistoricalData[]

}
model StudyGroup {
  groupId    Int      @id @default(autoincrement())
  groupName  String
  inviteCode String   @unique
  groupDesc  String?
  module     String
  createdBy  Int
  createdAt  DateTime @default(now())

  creator   User          @relation("UserStudyGroups", fields: [createdBy], references: [id])
  members   GroupMember[]
  polls     Poll[]
  messages  StudyGroupMessage[]
  assignments Assignment[]
}

model GroupMember {
  membershipId Int      @id @default(autoincrement())
  groupId      Int
  userId       Int
  role         String
  joinedAt     DateTime @default(now())

  group     StudyGroup @relation(fields: [groupId], references: [groupId])
  member    User       @relation(fields: [userId], references: [id])
  polls     Poll[]
  pollVotes PollVote[]
  assignments Assignment[]

  @@unique([userId, groupId])
}
enum AssignmentStatus {
  UPCOMING
  DUE
  OVERDUE
  COMPLETED
  CLOSED
  ARCHIVED
}

model Assignment {
  id          Int               @id @default(autoincrement())
  groupId     Int
  createdBy   Int
  title       String
  description String?
  dueDate     DateTime
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt()
  status      AssignmentStatus  @default(UPCOMING)

  group   StudyGroup @relation(fields: [groupId], references: [groupId])
  creator GroupMember @relation(fields: [createdBy], references: [membershipId])
  submissions Submission[]
}

model Submission {
  id          Int       @id @default(autoincrement())
  assignmentId Int
  userId      Int
  fileSubmitted     String
  submittedAt DateTime  @default(now())

  assignment Assignment @relation(fields: [assignmentId], references: [id])
  submitter  User       @relation(fields: [userId], references: [id])
}

this is my groupController.js
const groupModel = require('../models/groupModel');
const multer = require('multer');
const path = require('path');
exports.getAllAssignments = async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);

  try {
    const assignments = await groupModel.getAssignments(groupId, userId);
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
      const fileSubmitted = req.file.path; // Path to the uploaded file
      const userId = parseInt(req.body.userId);

      try {
          await groupModel.submitAssignment({ assignmentId, fileSubmitted, userId });
          res.status(201).json({ message: 'Assignment submitted successfully' });
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

this is my groupModel.js
exports.getAssignments = async (groupId, userId) => {
  const assignments = await prisma.assignment.findMany({
    where: {
      groupId: groupId,
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
  });

  return assignments;
};

exports.createAssignment = async ({ groupId, createdBy, title, description, dueDate }) => {
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
  return prisma.submission.create({
    data: {
      assignmentId,
      fileSubmitted,
      userId,
    },
  });
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

I want to add the feature on my assignment which update the status of the assignment automatically. for example assignment status will be upcoming after the creation of assignment. it will be due when the dueDate is less than 24 hours. It will be overdue if the dueDate is over. It will be completed if the user has submitted the assignment before the deadline. it will be closed after the dueDate is over 7 days or all the members have submitted the assigment. It will be archived if the assignment has been closed for 7 days.