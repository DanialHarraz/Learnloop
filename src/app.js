
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv").config();
const cron = require("node-cron");
const { Server } = require("socket.io");
const http = require("http");
const prisma = require("./models/prismaClient");

const { checkProgressTrackers } = require("./models/progressTrackerModel");
const { updatePartnerStreak } = require("./models/streakModel");
const { checkDailyTaskCompletion } = require("./models/streakModel");
const { checkFreezeStatus } = require("./models/freezeModel");
const { checkAndAwardFreezePowerUp } = require("./models/freezeModel");
const taskRouter = require("./routers/Task.router");
const statusRouter = require("./routers/Status.router");
const personRouter = require("./routers/Person.router");
const progressTrackerRouter = require("./routers/progressTracker");
const userRouter = require("./routers/User.router");
const groupRouter = require("./routers/group");
const resourceRouter = require("./routers/resources");
const forumRouter = require("./routers/forum.router");
const securityRouter = require("./routers/security.router");
const profileRouter = require("./routers/profile");
const quizRouter = require("./routers/quiz");
const groupController = require("./controllers/groupController");
const groupModel = require('./models/groupModel');
const streakRouter = require('./routers/streak');
const dashboardRouter = require('./routers/dashboard');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Enable JSON parsing and CORS
app.use(express.json());
app.use(cors());

// Serve the main login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "auth")));
app.use(
  "/progress-tracker",
  express.static(
    path.join(__dirname, "public", "individual", "progressTracker")
  )
);
app.use(
  "/individual",
  express.static(path.join(__dirname, "public", "individual"))
);

// Serve the 'uploads' folder statically
const uploadDir = path.resolve(__dirname, "../uploads");
console.log("Serving static files from:", uploadDir);
app.use("/uploads", express.static(uploadDir));

app.use("/profile", express.static(path.join(__dirname, "public", "profile")));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Set up routers
app.use("/tasks", taskRouter);
app.use("/statuses", statusRouter);
app.use("/persons", personRouter);
app.use("/progress-tracker", progressTrackerRouter);
app.use("/user", userRouter);
app.use("/group", groupRouter);
app.use("/resources", resourceRouter);
app.use("/forum", forumRouter);
app.use("/security", securityRouter);
app.use("/profile", profileRouter);
app.use("/quiz", quizRouter);
app.use('/streak',streakRouter);
app.use('/dashboard',dashboardRouter)

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinGroup", async (groupId, userId) => {
    if (!groupId || !userId) {
      console.error("Invalid groupId or userId:", groupId, userId);
      return;
    }

    socket.userId = userId;
    socket.join(`group_${groupId}`);

    if (!onlineUsers[groupId]) {
      onlineUsers[groupId] = new Set();
    }
    onlineUsers[groupId].add(userId);

    console.log(`User ${userId} joined group ${groupId}`);
    console.log("Online users in group:", onlineUsers[groupId]);

    const membersOnline = onlineUsers[groupId].size > 1;
    if (membersOnline) {
      await prisma.studyGroupMessage.updateMany({
        where: {
          groupId: parseInt(groupId),
          status: "SENT",
        },
        data: { status: "DELIVERED" },
      });

      io.to(`group_${groupId}`).emit("updateMessageStatus", {
        groupId: parseInt(groupId),
        status: "DELIVERED",
      });
    }
  });

  socket.on("sendMessage", async (data) => {
    const { groupId, userId, content } = data;
    if (!groupId || !userId || !content) return;
  
    try {
      let status = "SENT";
      if (onlineUsers[groupId] && onlineUsers[groupId].size > 1) {
        status = "DELIVERED";
      }

      console.log("Online users:", onlineUsers[groupId]);
  
      const message = await prisma.studyGroupMessage.create({
        data: {
          groupId: parseInt(groupId),
          userId,
          content,
          sentAt: new Date(),
          status,
        },
        include: {
          sender: { select: { name: true, avatar: true } },
        },
      });
  
      io.to(`group_${groupId}`).emit("newMessage", message);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("markAsSeen", async ({ groupId, userId }) => {
    if (!groupId || !userId) return;
  
    const members = await prisma.groupMember.findMany({
      where: { groupId: parseInt(groupId) },
      select: { userId: true },
    });
  
    const allMembers = members.map((member) => member.userId);
    const onlineInGroup = onlineUsers[groupId] || new Set();
    const otherMembers = allMembers.filter((memberId) => memberId !== userId);
    const allSeen = otherMembers.every((memberId) => onlineInGroup.has(memberId));
  
    if (allSeen) {
      await prisma.studyGroupMessage.updateMany({
        where: { 
          groupId: parseInt(groupId), 
          status: "DELIVERED",
          userId: { not: userId },
        },
        data: { status: "SEEN" },
      });
  
      io.to(`group_${groupId}`).emit("updateMessageStatus", {
        groupId: parseInt(groupId),
        status: "SEEN",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  
    Object.keys(onlineUsers).forEach((groupId) => {
      onlineUsers[groupId].delete(socket.userId);
      if (onlineUsers[groupId].size === 0) {
        delete onlineUsers[groupId];
      }
    });
  });
});

// Catch all other routes (404 error)
app.use((req, res, next) => {
  next(createError(404, `Unknown resource ${req.method} ${req.originalUrl}`));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server Error:", error);
  res
    .status(error.status || 500)
    .json({ error: error.message || "Unknown Server Error!" });
});

// Cron job for progress tracker
cron.schedule("* * * * *", async () => {
  await checkProgressTrackers();
  await updatePartnerStreak();
  await checkFreezeStatus();
  await checkAndAwardFreezePowerUp();
});

cron.schedule('0 0 * * *', async () => {
   await checkDailyTaskCompletion();
  });


cron.schedule('* * * * *', async () => {
  console.log('Running cron job to update assignment statuses...');
  try {
    await groupModel.updateAssignmentStatuses();
  } catch (error) {
    console.error('Error updating assignment statuses:', error);
  }
});

module.exports = server;