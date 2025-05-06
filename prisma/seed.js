const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const prisma = require('../src/models/prismaClient');

const statuses = [
  { text: 'Pending' },
  { text: 'In Progress' },
  { text: 'Completed' },
  { text: 'On Hold' },
];

const persons = [
  { email: 'alice@example.com', name: 'Alice' }, // Task 1
  { email: 'bob@example.com', name: 'Bob' }, // Task 1
  { email: 'carol@example.com', name: 'Carol' }, // Task 2
  { email: 'dave@example.com', name: 'Dave' }, // Task 2
  { email: 'eve@example.com', name: 'Eve' },
  { email: 'frank@example.com', name: 'Frank' },
  { email: 'grace@example.com', name: 'Grace' },
  { email: 'heidi@example.com', name: 'Heidi' },
  { email: 'ivan@example.com', name: 'Ivan' },
  { email: 'judy@example.com', name: 'Judy' },
  { email: 'mallory@example.com', name: 'Mallory' },
  { email: 'oscar@example.com', name: 'Oscar' },
  { email: 'peggy@example.com', name: 'Peggy' },
  { email: 'trent@example.com', name: 'Trent' },
  { email: 'victor@example.com', name: 'Victor' },
  { email: 'walter@example.com', name: 'Walter' },
  { email: 'xavier@example.com', name: 'Xavier' },
  { email: 'yvonne@example.com', name: 'Yvonne' },
  { email: 'zara@example.com', name: 'Zara' },
  { email: 'leo@example.com', name: 'Leo' },
];

const users =[
  { email: 'admin@example.com', name: 'admin', password: 'root@1234', avatar: '/images/bear.png', bio: 'Admin user' },
  { email: 'dog@example.com', name: 'dog', password: 'root@1234', avatar: '/images/chicken.png', bio: 'I am Jon' },
  { email: 'cat@example.com', name: 'cat', password: 'root@1234', avatar: '/images/meerkat.png', bio: 'I am Cat' },
  { email: 'bird@example.com', name: 'bird', password: 'root@1234', avatar: '/images/meerkat.png', bio: 'I love flying' },
  { email: 'fish@example.com', name: 'fish', password: 'root@1234', avatar: '/images/bear.png', bio: 'Swimming is life' },
  { email: 'turtle@example.com', name: 'turtle', password: 'root@1234', avatar: 'turtle', bio: 'Slow but steady' },
];

const studyGroups = [
  { groupName: 'Math Study Group', inviteCode: 'XDD123', groupDesc: 'A group for math enthusiasts', module: 'Math', createdBy: 1 },
  { groupName: 'Science Study Group', inviteCode: 'GGWP99', groupDesc: 'A group for science lovers', module: 'Science', createdBy: 2 },
  { groupName: 'Literature Club', inviteCode: 'BRUH69', groupDesc: 'A club for literature aficionados', module: 'Literature', createdBy: 3 },
  { groupName: 'History Buffs', inviteCode: 'ISTG54', groupDesc: 'Discussing all things history', module: 'History', createdBy: 4 },
  { groupName: 'Art Collective', inviteCode: 'FFS666', groupDesc: 'A community for art lovers', module: 'Art', createdBy: 5 },
];

const groupMembers = [
  // Math Study Group members
  { groupId: 1, userId: 1, role: 'admin' },
  { groupId: 1, userId: 2, role: 'member' },
  { groupId: 1, userId: 3, role: 'member' },
  // Science Study Group members
  { groupId: 2, userId: 2, role: 'admin' },
  { groupId: 2, userId: 4, role: 'member' },
  { groupId: 2, userId: 5, role: 'member' },
  // Literature Club members
  { groupId: 3, userId: 3, role: 'admin' },
  { groupId: 3, userId: 1, role: 'member' },
  { groupId: 3, userId: 5, role: 'member' },
  // History Buffs members
  { groupId: 4, userId: 4, role: 'admin' },
  { groupId: 4, userId: 1, role: 'member' },
  { groupId: 4, userId: 3, role: 'member' },
  // Art Collective members
  { groupId: 5, userId: 5, role: 'admin' },
  { groupId: 5, userId: 2, role: 'member' },
  { groupId: 5, userId: 4, role: 'member' },
];

const UserActivity = [
  {id : 1, userId : 1 , login_timestamp : new Date('2024-12-02T10:15:00Z')},
  {id : 2, userId : 1 , login_timestamp : new Date('2024-12-03T14:30:00Z')},
  {id : 3, userId : 1 , login_timestamp : new Date('2024-12-03T19:45:00Z')},
  {id : 4, userId : 1 , login_timestamp : new Date('2024-12-04T19:45:00Z')},
  {id : 5, userId : 1 , login_timestamp : new Date('2024-12-06T09:20:00Z')},
  {id : 6, userId : 1 , login_timestamp : new Date('2024-12-06T16:35:00Z')},
]

const forum = [
  { forumId: 1, forumName: 'testName', forumTopic: 'testTopic', status: 'open' },  
  { forumId: 2, forumName: 'testName2', forumTopic: 'testTopic2', status: 'archived' },
];

const resources = [
  {
    name: 'LEARN LOOP 1 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 1 TESTING.docx',
    uploadedBy: 1,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 2 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 2 TESTING.docx',
    uploadedBy: 1,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 3 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 3 TESTING.docx',
    uploadedBy: 2,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 4 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 4 TESTING.docx',
    uploadedBy: 2,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 5 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 5 TESTING.docx',
    uploadedBy: 3,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 6 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 6 TESTING.docx',
    uploadedBy: 3,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARN LOOP 7 TESTING',
    fileType: 'docx',
    url: '/uploads/LEARN LOOP 7 TESTING.docx',
    uploadedBy: 1,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARNLOOP VIDEO1',
    fileType: 'mp4',
    url: '/uploads/LEARNLOOP VIDEO1.mp4',
    uploadedBy: 2,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARNLOOP VIDEO2',
    fileType: 'mp4',
    url: '/uploads/LEARNLOOP VIDEO2.mp4',
    uploadedBy: 3,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
  {
    name: 'LEARNLOOP VIDEO3',
    fileType: 'mp4',
    url: '/uploads/LEARNLOOP VIDEO3.mp4',
    uploadedBy: 1,
    views: 0,
    downloads: 0,
    uploadedAt: new Date(),
  },
];

const progressTrackerData = {
  userId: 5,
  title: 'Test Progress Tracker',
  startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 
  deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  notes: 'This is a test tracker.',
  progressPercentage: 100, 
  status: 'COMPLETED', 
  isClosed: true,
};

const taskTrackingData = Array.from({ length: 10 }, (_, index) => {
 
  const completedDate = new Date();
  completedDate.setDate(completedDate.getDate() - 5); 

  return {
    progressTrackerId: 1, 
    title: `Task ${index + 1}`,
    isCompleted: true,
    status: 'COMPLETED',
    isClosed: true,
    createdAt: completedDate, 
    completedAt: completedDate, 
    estimatedDuration: 2,
    completionDuration: 2,
  };
});




async function hashPasswords(users) {
  return Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10); // Hash each password
      return { ...user, password: hashedPassword }; // Replace the plain password with the hashed version
    })
  );
}

async function main() {

  const insertedStatuses = await prisma.status.createManyAndReturn({
    data: statuses,
  });

const insertedPersons = await prisma.person.createManyAndReturn({
  data: persons,
});

console.log(insertedPersons, insertedStatuses);

const insertedTaskss = await prisma.task.createManyAndReturn({
  data: [
    { name: 'Seed 1', statusId: insertedStatuses[0].id },
    { name: 'Seed 2', statusId: insertedStatuses[1].id },
  ],
});

await prisma.taskAssignment.createMany({
  data: [
    { personId: insertedPersons[0].id, taskId: insertedTaskss[0].id },
    { personId: insertedPersons[1].id, taskId: insertedTaskss[0].id },
    { personId: insertedPersons[2].id, taskId: insertedTaskss[1].id },
    { personId: insertedPersons[3].id, taskId: insertedTaskss[1].id },
  ],
});

  // Hash passwords before seeding
  const hashedUsers = await hashPasswords(users);

  // Seed Users
  const insertedUsers = await prisma.user.createMany({
    data: hashedUsers,
  });
  console.log('Inserted users:', insertedUsers);

  // Seed StudyGroups
  const insertedStudyGroups = await prisma.studyGroup.createMany({
    data: studyGroups,
  });
  console.log('Inserted study groups:', insertedStudyGroups);

  // Seed GroupMembers
  const insertedGroupMembers = await prisma.groupMember.createMany({
    data: groupMembers,
  });
  console.log('Inserted group members:', insertedGroupMembers);

  // Seed Forum
  const insertedForum = await prisma.forum.createMany({
    data: forum,
  });
  console.log('Inserted forum:', insertedForum);

  // Seed Resources
  const insertedResources = await prisma.resource.createMany({
    data: resources,
  });
  console.log('Inserted resources:', insertedResources);

  const userActivity = await prisma.userActivity.createMany({
    data : UserActivity
  })
  console.log('Inserted userActvitity',userActivity)

  const insertedProgressTracker = await prisma.progressTracker.create({
    data: progressTrackerData,
  });
  console.log('Inserted progress tracker:', insertedProgressTracker);
  
  // Seed Task Tracking (for 10 tasks)
  const insertedTasks = await prisma.taskTracking.createMany({
    data: taskTrackingData,
  });
  console.log('Inserted tasks:', insertedTasks);

  console.log('Seed data inserted successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
