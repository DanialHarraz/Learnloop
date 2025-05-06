import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import mockdate from 'mockdate';

const prisma = new PrismaClient();
const groupModel = require('../src/models/groupModel');

let inviteCode = ''; // Store the invite code

test.use({ storageState: 'playwright/.auth/admin.json' });

// As a user, I want to create a study group and I want to post assignments to the group
test('should create a study group and post an assignment successfully', async ({ page }) => {
  await page.goto('http://localhost:3001/group/group.html');
  await page.getByRole('link', { name: ' Groups' }).click();

  // Create Study Group
  await page.getByRole('button', { name: 'Create Study Group' }).click();
  await page.getByPlaceholder('Group Name').fill('Learn Git');
  await page.getByPlaceholder('Group Description').fill('Command Lines and GUI');
  await page.getByPlaceholder('Module').fill('CICD');
  
  // Extract the Invite Code from the input field
  inviteCode = await page.getByPlaceholder('Invite Code').inputValue();
  
  await page.getByRole('button', { name: 'Save' }).click();

  // Wait for group to appear
  await page.waitForSelector(`text=Learn Git Module: CICD`);
  await expect(page.getByText('Learn Git Module: CICD').first()).toBeVisible();

  await page.getByText('Learn Git Module: CICD').first().click();
  await page.getByRole('link', { name: 'Assignment' }).click();

  // Create Assignment
  await page.getByRole('button', { name: 'Create Assignment' }).click();
  await page.getByLabel('Title').fill('Class Activity 2');
  await page.getByLabel('Description').fill('Introduction to Git');
  const dueDateInput = await page.getByLabel('Due Date & Time');
  await dueDateInput.fill('2025-03-01T23:59');
  await page.locator('#submit-create-assignment-modal').click();

  // Verify Assignment Creation
  await page.waitForSelector('text=Class Activity 2');
  await expect(page.getByText('Class Activity 2')).toBeVisible();
});

// As a user, I want to join a study group that aligns with my interests and I want to submit the assignments
test.describe('login as a normal group member', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should allow a user to join a study group and submit an assignment', async ({ page }) => {
    if (!inviteCode) throw new Error('Invite code not found!');

    await page.goto('http://localhost:3001/group/group.html');
    await page.getByRole('link', { name: ' Groups' }).click();
    await page.getByRole('button', { name: 'Join Study Group' }).click();
    await expect(page.getByLabel('Invite Code')).toBeVisible();

    // Fill invite code and join group
    await page.getByLabel('Invite Code').fill(inviteCode);
    await page.getByRole('button', { name: 'Join Group' }).click();

    // Handle alert for joining group
    page.once('dialog', async dialog => {
      if (dialog.message().includes("Successfully joined the group")) {
        expect(dialog.message()).toContain("Successfully joined the group");
        await dialog.accept();
      }
    });

    // Open group page
    await page.getByRole('heading', { name: 'Learn Git' }).click();
    await page.getByRole('link', { name: 'Assignment' }).click();

    // Verify Assignment tab loaded
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await page.getByRole('button', { name: 'Submit' }).click();
    const fileInput = page.getByLabel('Upload Your Solution');
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles('./uploads/ab6761610000e5ebe50455b6a7e62abc95cff2e8.jpg');
    await page.getByRole('button', { name: 'Submit Assignment' }).click();

    // Handle alert for assignment submission
    page.once('dialog', async dialog => {
      if (dialog.message().includes("Assignment submitted successfully")) {
        expect(dialog.message()).toContain("Assignment submitted successfully");
        await dialog.accept();
      }
    });

    // Verify submission success message
    await expect(page.getByText('You have already submitted this assignment.')).toBeVisible();
  });
});

// The system should not show the admin features to a normal group member
test.describe('login as normal group member', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should not allow a normal member to see admin features', async ({ page }) => {
    await page.goto('http://localhost:3001/group/specificGroup/content.html?groupId=1');

    // Verify that the "Create Poll" button is not visible
    await expect(page.locator('#create-poll-btn')).not.toBeVisible();

    // Verify that the "Settings" tab is not visible
    await expect(page.locator('#settings-tab')).not.toBeVisible();

    // Check if the poll list is empty
    const pollList = page.locator('#poll-list');
    const pollCount = await pollList.locator('.poll-card').count();

    if (pollCount > 0) {
      // Verify that the "Pause Poll" and "Resume Poll" buttons are not visible
      await expect(page.locator('.pause-poll')).not.toBeVisible();
      await expect(page.locator('.resume-poll')).not.toBeVisible();
    } else {
      console.log('No polls available to check for admin features.');
    }

    // Navigate to the "People" tab
    await page.getByRole('link', { name: 'People' }).click();

    // Verify that the "Make Moderator" and "Kick" buttons are not visible
    const memberList = page.locator('#group-members .list-group-item');
    const memberCount = await memberList.count();

    for (let i = 0; i < memberCount; i++) {
      const memberItem = memberList.nth(i);
      await expect(memberItem.locator('.make-moderator-btn')).not.toBeVisible();
      await expect(memberItem.locator('.kick-member-btn')).not.toBeVisible();
    }

    // Navigate to the "Assignment" tab
    await page.getByRole('link', { name: 'Assignment' }).click();

    // Verify that the "Create Assignment" button is not visible
    await expect(page.locator('#create-assignment-btn')).not.toBeVisible();

    // Verify that the "Show Assignment Statistics" button is not visible
    await expect(page.locator('#show-stats-button')).not.toBeVisible();

    // Check if the assignments list is empty
    const assignmentsList = page.locator('#assignments-container .card');
    const assignmentsCount = await assignmentsList.count();

    if (assignmentsCount > 0) {
      // Verify that the "View Submissions" and "View Analysis" buttons are not visible
      for (let i = 0; i < assignmentsCount; i++) {
        const assignmentItem = assignmentsList.nth(i);
        await expect(assignmentItem.locator('button', { hasText: 'View Submissions' })).not.toBeVisible();
        await expect(assignmentItem.locator('button', { hasText: 'View Analysis' })).not.toBeVisible();
      }
    } else {
      console.log('No assignments available to check for admin features.');
    }
  });
});

// As an admin of the group, I want to give a moderator role to a group member to help me manage the group
test('should allow an admin to promote a member to moderator', async ({ page }) => {
  await page.goto('http://localhost:3001/group/specificGroup/content.html?groupId=1');

  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain("User has been promoted to moderator");
    await dialog.accept();
  });

  await page.getByRole('link', { name: 'People' }).click();

  const memberRow = await page.locator('.list-group-item').filter({ hasText: 'Dog' });
  const makeModeratorButton = await memberRow.getByRole('button', { name: 'Make Moderator' });
  await makeModeratorButton.click();
  await expect(page.locator('.member-role', { hasText: 'moderator' })).toBeVisible();
});

// As a admin of the group, I want to change the group's information to attract more members
test('should allow an admin to update group information', async ({ page }) => {
  await page.goto('http://localhost:3001/group/specificGroup/content.html?groupId=1');
  await page.getByRole('link', { name: 'Settings' }).click();

  // Verify initial values before updating
  const groupNameInput = page.getByLabel('Group Name');
  const groupDescInput = page.getByLabel('Group Description');
  const moduleInput = page.getByLabel('Module');

  await expect(groupNameInput).toBeVisible();
  await expect(groupDescInput).toBeVisible();
  await expect(moduleInput).toBeVisible();

  // Fill in new values
  await groupNameInput.fill('Math Study Community');
  await groupDescInput.fill('A group for math nerds');
  await moduleInput.fill('Mathematics');

  // Click Save Changes
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Wait for success alert
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Group information updated successfully.');
    await dialog.accept();
  });

  // Verify the values are updated in the UI
  await expect(groupNameInput).toHaveValue('Math Study Community');
  await expect(groupDescInput).toHaveValue('A group for math nerds');
  await expect(moduleInput).toHaveValue('Mathematics');
});

// As an admin of a study group, I want to create a poll to decide the topic to study this week and also vote in the poll
test("should allow admin to create poll and vote", async ({ page }) => {
  await page.goto("http://localhost:3001/group/specificGroup/content.html?groupId=1");
  const createPollButton = page.getByRole("button", { name: "Create Poll" });
  await expect(createPollButton).toBeVisible();
  await createPollButton.click();
  await page.getByLabel("Poll Title").fill("What do you want to study this week?");
  await page.getByLabel("Poll Description").fill("Let's Vote!");
  await page.getByLabel("Poll Options (comma-separated)").fill("Lesson 1, Lesson 2, Lesson 3");
  await page.getByRole("button", { name: "Submit Poll" }).click();

  // Assert that the poll was created successfully
  const pollTitle = page.getByText("What do you want to study this week?");
  await expect(pollTitle).toBeVisible();

  // Wait for poll options to load
  await expect(page.getByText("Lesson 1")).toBeVisible();
  await expect(page.getByText("Lesson 2")).toBeVisible();
  await expect(page.getByText("Lesson 3")).toBeVisible();

  // Check that poll is active before voting
  const pollStatus = page.locator(".badge.bg-success");
  await expect(pollStatus).toHaveText("Active");

  // Select and vote for "Lesson 1"
  const lesson1Radio = page.getByLabel("Lesson 1");
  await expect(lesson1Radio).toBeVisible();
  await lesson1Radio.check();
  await expect(lesson1Radio).toBeChecked();
  const submitVoteButton = page.getByRole("button", { name: "Submit Vote" });
  await expect(submitVoteButton).toBeVisible();
  await submitVoteButton.click();

  // Confirm that vote was recorded successfully
  await expect(page.getByText("You have already voted: Lesson 1")).toBeVisible();

  // Ensure the selected option remains checked after voting
  await expect(lesson1Radio).toBeChecked();
});

// As an admin of a study group, I want to pause the ongoing poll when some unexpected delays happen and resume it later
test("should allow admin to pause and resume the poll", async ({ page }) => {
  await page.goto("http://localhost:3001/group/specificGroup/content.html?groupId=1");
  await page.getByRole("button", { name: "Create Poll" }).click();
  await page.getByLabel("Poll Title").fill("What do you want to study this week?");
  await page.getByLabel("Poll Description").fill("Let's Vote");
  await page.getByLabel("Poll Options (comma-separated)").fill("Lesson 4, Lesson 5, Lesson 6");
  await page.getByRole("button", { name: "Submit Poll" }).click();

  // Assert that the poll was created successfully
  const pollTitle = page.getByText("What do you want to study this week?");
  await expect(pollTitle).toBeVisible();

  // Assert initial poll status is "Active"
  const latestPollContainer = page.locator("#poll-list div").first();
  const pollStatus = latestPollContainer.locator(".badge.bg-success");
  await expect(pollStatus).toHaveText("Active");

  // Pause the poll
  const pauseButton = page.getByRole("button", { name: "Pause Poll" }).first();
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();

  // Assert the poll status changed to "Paused"
  const pausedStatus = page.locator(".badge.bg-warning");
  await expect(pausedStatus).toHaveText("Paused");

  // Ensure the "Pause Poll" button disappears and "Resume Poll" appears
  const resumeButton = page.getByRole("button", { name: "Resume Poll" });
  await expect(resumeButton).toBeVisible();

  // Resume the poll
  await resumeButton.click();

  // Assert the poll status changed back to "Active"
  await expect(pollStatus).toHaveText("Active");

  // Ensure "Resume Poll" disappears and "Pause Poll" is available again
  await expect(resumeButton).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Pause Poll" }).first()).toBeVisible();
});

// As an admin of a study group, I want to create a lot of assignments and sort them by descending deadlines
test('should allow an admin to create multiple assignments and sort by descending deadlines', async ({ page }) => {
  await page.goto('http://localhost:3001/group/specificGroup/content.html?groupId=1');
  await page.getByRole('link', { name: 'Assignment' }).click();

  // Create first assignment
  await page.getByRole('button', { name: 'Create Assignment' }).click();
  await page.getByLabel('Title').fill('Assignment 1');
  await page.getByLabel('Description').fill('Description for Assignment 1');
  await page.getByLabel('Due Date & Time').fill('2025-03-01T23:59');
  await page.locator('#submit-create-assignment-modal').click();

  // Create second assignment
  await page.locator('#create-assignment-btn').click();
  await page.getByLabel('Title').fill('Assignment 2');
  await page.getByLabel('Description').fill('Description for Assignment 2');
  await page.getByLabel('Due Date & Time').fill('2025-04-01T23:59');
  await page.locator('#submit-create-assignment-modal').click();

  // Create third assignment
  await page.locator('#create-assignment-btn').click();
  await page.getByLabel('Title').fill('Assignment 3');
  await page.getByLabel('Description').fill('Description for Assignment 3');
  await page.getByLabel('Due Date & Time').fill('2025-02-01T23:59');
  await page.locator('#submit-create-assignment-modal').click();

  // Verify assignments are created
  await page.waitForSelector('text=Assignment 1');
  await expect(page.locator('.card-title', { hasText: 'Assignment 1' })).toBeVisible();
  await expect(page.locator('.card-title', { hasText: 'Assignment 2' })).toBeVisible();
  await expect(page.locator('.card-title', { hasText: 'Assignment 3' })).toBeVisible();

  const sortByDropdown = page.locator('#sort-order-dropdown');
  await expect(sortByDropdown).toBeVisible();
  await sortByDropdown.selectOption('desc');
  await page.waitForTimeout(5000);

  // Log the assignments after sorting
  let assignments = await page.$$eval('#assignments-container .card', items => items.map(item => item.textContent));

  // Verify assignments are sorted correctly
  expect(assignments).toEqual([
    expect.stringContaining('Assignment 2'),
    expect.stringContaining('Assignment 1'),
    expect.stringContaining('Assignment 3')
  ]);
});

// As an admin of a study group, I want to kick a member from the group if they are not participating actively
test('should allow admin to kick the member from the group', async ({ page }) => {
  await page.goto('http://localhost:3001/group/specificGroup/content.html?groupId=1');

  // Handle the confirmation dialog (Are you sure?)
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain("Are you sure you want to remove cat from the group?");
    await dialog.accept();
  });

  await page.getByRole('link', { name: 'People' }).click();

  const memberRow = page.locator('.list-group-item').filter({ hasText: 'Cat' });
  const kickButton = memberRow.getByRole('button', { name: 'Kick' });

  await kickButton.click(); // Click to trigger the confirmation dialog

  // Handle the success message (Member removed)
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain("Member removed from the group.");
    await dialog.accept();
  });

  // Ensure the member is removed
  await expect(page.locator('.list-group-item').filter({ hasText: 'Cat' })).toHaveCount(0);
});

test('should track assignment status changes over simulated time', async ({ page }) => {
  await page.goto('http://localhost:3001/group/group.html');
  await page.getByRole('link', { name: ' Groups' }).click();
  await page.getByRole('button', { name: 'Create Study Group' }).click();
  await page.getByPlaceholder('Group Name').fill('Test Time Travel');
  await page.getByPlaceholder('Group Description').fill('Simulating time');
  await page.getByPlaceholder('Module').fill('Testing');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector(`text=Test Time Travel Module: Testing`);
  await expect(page.getByText('Test Time Travel Module: Testing').first()).toBeVisible();
  await page.getByText('Test Time Travel Module: Testing').first().click();
  await page.getByRole('link', { name: 'Assignment' }).click();

  // Create Assignment
  await page.getByRole('button', { name: 'Create Assignment' }).click();
  await page.getByLabel('Title').fill('Time Travel Assignment');
  await page.getByLabel('Description').fill('Test due date changes');
  await page.getByLabel('Due Date & Time').fill('2025-03-01T23:59');
  await page.locator('#submit-create-assignment-modal').click();

  // Verify Assignment Creation
  await page.waitForSelector('text=Time Travel Assignment');
  await expect(page.getByText('Time Travel Assignment')).toBeVisible();

  // Retrieve assignment ID from database
  const assignment = await prisma.assignment.findFirst({
    where: { title: 'Time Travel Assignment' },
  });

  if (!assignment) {
    throw new Error('Assignment not found in database');
  }

  const assignmentId = assignment.id;

  // Function to update the system's current time and trigger cron
  async function simulateTimeShift(hours) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
  
    if (!assignment) {
      throw new Error('Assignment not found in database');
    }
  
    const dueDate = new Date(assignment.dueDate);
    const currentDate = new Date();
  
    // Calculate the new time based on whether we are before or after the due date
    let newTime;
    if (assignment.status == 'UPCOMING') {
      newTime = new Date(dueDate.getTime() - hours * 60 * 60 * 1000);
    } else {
      newTime = new Date(currentDate.getTime() + hours * 60 * 60 * 1000);
    }
  
    // Use mockdate to simulate the time shift
    mockdate.set(newTime);
  
    await groupModel.updateAssignmentStatusesTest(newTime);
  }

  // Simulate status changes
  await simulateTimeShift(24); // Within 24 hours → Should become DUE
  await page.waitForTimeout(1000); 
  await page.reload();
  let updatedAssignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!updatedAssignment) {
    throw new Error('Assignment not found after time shift');
  }
  expect(updatedAssignment.status).toBe('DUE');

  // Simulate time shift and verify the status change
  await simulateTimeShift(25); // Due date passed → Should become OVERDUE
  await page.waitForTimeout(1000); 
  await page.reload();
  updatedAssignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!updatedAssignment) {
    throw new Error('Assignment not found after time shift');
  }
  expect(updatedAssignment.status).toBe('OVERDUE');

  await simulateTimeShift(7 * 24); // Over 7 days → Should become CLOSED
  await page.waitForTimeout(1000); 
  await page.reload();
  updatedAssignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!updatedAssignment) {
    throw new Error('Assignment not found after time shift');
  }
  expect(updatedAssignment.status).toBe('CLOSED');

  await simulateTimeShift(8 * 24); // Closed for another 7 days → Should become ARCHIVED
  await page.waitForTimeout(1000);
  await page.reload();
  updatedAssignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!updatedAssignment) {
    throw new Error('Assignment not found after time shift');
  }
  expect(updatedAssignment.status).toBe('ARCHIVED');
});