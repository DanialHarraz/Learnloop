import { test, expect } from '@playwright/test';
//TEST 1.1: Create Progress Tracker
test('1.1 Create Progress Tracker with accurate results', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Fill in progress tracker form
  await page.getByLabel('Title').fill('Progress Tracker Test');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes');
  
  await page.getByPlaceholder('Task Name').dblclick();
  await page.getByPlaceholder('Task Name').fill('Task 1');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
   await page.waitForLoadState('networkidle'); 
  // View tasks and update task completion
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.locator('li').filter({ hasText: 'Task 1' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
  
  // Delete the progress tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  
  // Wait for the custom confirmation modal to appear
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' }); 
  
  // Click the 'Delete' button in the modal to confirm the deletion
  await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 1.2: Title is empty
test('1.2 Title is empty', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Leave the Title field empty
  await page.getByLabel('Title').fill('');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes');
  
  // Add tasks
  await page.getByPlaceholder('Task Name').dblclick();
  await page.getByPlaceholder('Task Name').fill('task 1');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByText('No Dependency task 1 Remove').click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task 2');
  await page.locator('#task-container div').filter({ hasText: 'No Dependency task 1 Remove' }).getByRole('combobox').selectOption('0');
  
  // Attempt to create tracker without title
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  
  // Assert that the error message is shown
  const errorMessage = await page.locator('text=Please provide valid details and at least one task.');
  await expect(errorMessage).toBeVisible();
});
//TEST 1.3: Deadline earlier than start date
test('1.3 Deadline earlier than start date', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Fill in the tracker form with the deadline earlier than the start date
  await page.getByLabel('Title').fill('Progress Tracker Test 1.3');
  await page.getByLabel('Start Date and Time').fill('2025-02-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-20T14:24'); 
  await page.getByLabel('Notes').fill('Test notes for 1.3');
  
  // Add tasks
  await page.getByPlaceholder('Task Name').fill('Task 1');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByText('No Dependency task 1 Remove').click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task 2');
  await page.locator('#task-container div').filter({ hasText: 'No Dependency task 1 Remove' }).getByRole('combobox').selectOption('0');
  
  // Try to create the tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  
  // Assert that the error message is shown
  const errorMessage = await page.locator('text=Due date cannot be earlier than the start date.');
  await expect(errorMessage).toBeVisible();
});
//TEST 1.4: Duration left empty for tasks when manual mode is selected
test('1.4 Duration left empty for tasks when manual mode is selected', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Fill in tracker form and select manual mode
  await page.getByLabel('Title').fill('Progress Tracker Test 1.4');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes for 1.4');
  
  // Add a task
  await page.getByPlaceholder('Task Name').fill('Task 1');
  // Wait for the "Manual Mode" radio button to be available and select it
  const manualModeRadio = page.locator('input[type="radio"][value="manual"]');
  await manualModeRadio.waitFor({ state: 'visible' });
  await manualModeRadio.click();
  await page.getByRole('button', { name: 'Add Duration' }).click();
  
  // Ensure that the task duration fields are visible and leave them empty
  const durationField = page.locator('input[placeholder="Minutes"]');
  await durationField.fill('');
  
  // Try to create the tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  
  // Assert that the error message is shown
  const errorMessage = await page.locator('text=Please allocate duration for at least one task.');
  await expect(errorMessage).toBeVisible();
});
// TEST 2.1: Task B can be started and marked completed after Task A is completed
test('2.1 Task B can be started and marked completed', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Fill in tracker form and add Task B (no dependencies)
  await page.getByLabel('Title').fill('Progress Tracker Test 2.1');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes for 2.1');
  
  // Add Task A and Task B (with Task A depending on Task B)
  await page.getByPlaceholder('Task Name').fill('Task A');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
  
  // Set dependency (Task A depends on Task B)
  await page.locator('#task-container div').filter({ hasText: 'No Dependency Task A Remove' }).getByRole('combobox').selectOption('0');
  
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  await page.waitForLoadState('networkidle'); 
  
  // View tasks
  await page.getByRole('button', { name: 'View Tasks' }).click();
  
  // Complete Task B to unlock Task A
  await page.locator('li').filter({ hasText: 'Task A' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
  await page.waitForLoadState('networkidle'); 
  await page.reload();
  await page.waitForLoadState('networkidle'); 
  
  // Assert that Task A is now unlocked
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.locator('li').filter({ hasText: 'Task B' }).getByRole('checkbox').check();
  //Assert that Task B is marked as completed
  await page.getByLabel('Close').click();
   await page.waitForLoadState('networkidle'); 
  await page.reload();
  await page.waitForTimeout(1000); 
  await page.getByRole('button', { name: 'View Tasks' }).first().click();

  await page.getByLabel('Close').click();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' }); 
  await confirmModal.locator('#confirm-delete-btn').click();
});
function formatLocalDateTime(date) {
  return new Date(date).toLocaleString('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '').replace(/\//g, '-').replace(' ', 'T');
}


// TEST 3.1: Task creation with future start and due dates
test('3.1 Tracker creation with future start date (Singapore Time)', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3001/');
  // Log in
  
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
   // Set past start date and deadline
  const currentDate = new Date();
  const startDate = new Date();
const deadline = new Date();
startDate.setTime(startDate.getTime() + 1 * 60 * 1000); 
deadline.setTime(deadline.getTime() + 5 * 60 * 1000); 

  // Format dates as 'yyyy-mm-ddThh:mm'
  const startDateString = formatLocalDateTime(startDate);
  const deadlineString = formatLocalDateTime(deadline);
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  // Fill in tracker form
  await page.getByLabel('Title').fill('Progress Tracker Test 3.1');
  await page.getByLabel('Start Date and Time').fill(startDateString); 
  await page.getByLabel('Due Date and Time').fill(deadlineString); 
  await page.getByLabel('Notes').fill('Test notes for 3.1');
  // Add Task A and Task B (with Task A depending on Task B)
  await page.getByPlaceholder('Task Name').fill('Task A');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
  // Set dependency (Task B depends on Task A)
  await page.locator('#task-container div').filter({ hasText: 'No Dependency Task A Remove' }).getByRole('combobox').selectOption('0');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  // Check if the status is 'PENDING'
  await expect(page.getByRole('cell', { name: '🔜 PENDING' })).toBeVisible();
  // Wait for 1 minute + buffer time to ensure the start date has passed
  await page.waitForTimeout(70000); 
  // Reload the page to reflect changes
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Verify that the status has changed to 'NOT BEGUN' after the start date has passed
  await expect(page.getByRole('cell', { name: '❌ NOT BEGUN' })).toBeVisible();
  // Cleanup: Delete the created tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' });
  await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 3.2: Tracker creation with deadline 1 minute after current time
test('3.2 Tracker creation with deadline 1 minute after current time', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3001/');
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  // Get the current date and set the deadline to 1 minute after current time
  const currentDate = new Date();
  const startDate = currentDate; 
  const deadline = new Date(currentDate);
  deadline.setMinutes(currentDate.getMinutes() + 1); 
  // Format dates as 'yyyy-mm-ddThh:mm'
  const startDateString = formatLocalDateTime(startDate);
  const deadlineString = formatLocalDateTime(deadline);
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  // Fill in tracker form
  await page.getByLabel('Title').fill('Progress Tracker Test 3.2');
  await page.getByLabel('Start Date and Time').fill(startDateString); 
  await page.getByLabel('Due Date and Time').fill(deadlineString); 
  await page.getByLabel('Notes').fill('Test notes for 3.2');
  // Add Task A and Task B (with Task A depending on Task B)
  await page.getByPlaceholder('Task Name').fill('Task A');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
  // Set dependency (Task B depends on Task A)
  await page.locator('#task-container div').filter({ hasText: 'No Dependency Task A Remove' }).getByRole('combobox').selectOption('0');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  // Verify the initial status is 'NOT BEGUN'
  await expect(page.getByRole('cell', { name: '❌ NOT BEGUN' })).toBeVisible();
  // Wait for 1 minute + buffer time to ensure the deadline has passed
  await page.waitForTimeout(70000); 
  // Reload the page to reflect changes
  await page.reload();
  // Verify the status has changed to 'OVERDUE'
  await expect(page.getByRole('cell', { name: 'OVERDUE' })).toBeVisible();
  // Cleanup: Delete the created tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' });
  await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 3.3: All tasks completed - Status remains COMPLETED after deadline
test('3.3 All tasks completed - Status remains COMPLETED after deadline', async ({ page }) => {
  test.setTimeout(120000); 
  await page.goto('http://localhost:3001/');
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  // Set past start date and deadline
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 1); 
  const deadline = new Date(currentDate);
  deadline.setMinutes(currentDate.getMinutes() + 1); 
  // Format dates as 'yyyy-mm-ddThh:mm'
  const startDateString = formatLocalDateTime(startDate);
  const deadlineString = formatLocalDateTime(deadline);
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  // Fill in tracker form
  await page.getByLabel('Title').fill('Progress Tracker Test 3.3');
  await page.getByLabel('Start Date and Time').fill(startDateString); 
  await page.getByLabel('Due Date and Time').fill(deadlineString); 
  await page.getByLabel('Notes').fill('Test notes for 3.3');
 // Add Task A and Task B (with Task A depending on Task B)
 await page.getByPlaceholder('Task Name').fill('Task A');
 await page.getByRole('button', { name: 'Add Task' }).click();
 await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
 // Set dependency (Task B depends on Task A)
 await page.locator('#task-container div').filter({ hasText: 'No Dependency Task A Remove' }).getByRole('combobox').selectOption('0');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  // View tasks
  await page.getByRole('button', { name: 'View Tasks' }).click();
  
  // Complete Task B to unlock Task A
  await page.locator('li').filter({ hasText: 'Task A' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
   await page.waitForLoadState('networkidle'); 
   await page.reload();
   await page.waitForLoadState('networkidle'); 
  // Assert that Task A is now unlocked
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.locator('li').filter({ hasText: 'Task B' }).getByRole('checkbox').check();
  //Assert that Task B is marked as completed
  await page.getByLabel('Close').click();
   await page.waitForLoadState('networkidle'); 
   await page.reload();
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.getByLabel('Close').click();
  // Verify the initial status is 'COMPLETED'
  await expect(page.getByRole('cell', { name: 'COMPLETED' })).toBeVisible();
  // Wait for 1 minute to ensure the deadline has passed
  await page.waitForTimeout(70000); 
  // Reload the page to reflect changes
  await page.reload();
  // Verify the status remains 'COMPLETED' after the deadline
  await expect(page.getByRole('cell', { name: 'COMPLETED' })).toBeVisible();
  // Cleanup: Delete the created tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' });
  await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 4.1: Tracker status changes to "Ahead of Schedule" 
  test('4.1 Tracker status changes to "Ahead of Schedule" if task is completed earlier than estimated duration', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3001/');
    // Log in
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('root@1234');
    await page.getByRole('button', { name: 'Log in' }).click();
    // Set Start Date and Due Date 
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate());
    const dueDate = new Date(currentDate);
    dueDate.setDate(currentDate.getDate() + 2); 
    // Format dates as 'yyyy-mm-ddThh:mm'
    const startDateString = formatLocalDateTime(startDate);
    const dueDateString = formatLocalDateTime(dueDate);
    // Navigate to Individual tab and create tracker
    await page.getByRole('link', { name: ' Individual' }).click();
    await page.getByRole('link', { name: 'Track Now' }).click();
    // Fill in tracker form
    await page.getByLabel('Title').fill('Progress Tracker Test 4.1');
    await page.getByLabel('Start Date and Time').fill(startDateString);
    await page.getByLabel('Due Date and Time').fill(dueDateString);
    await page.getByLabel('Notes').fill('Test notes for Boundary Value Analysis');
    // Add Task A and Task B
    await page.getByPlaceholder('Task Name').fill('Task A');
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
    // Create tracker
    await page.getByRole('button', { name: 'Create Tracker' }).click();
    // View tasks and mark them as completed
    await page.getByRole('button', { name: 'View Tasks' }).click();
    await page.locator('li').filter({ hasText: 'Task A' }).getByRole('checkbox').check();
    await page.locator('li').filter({ hasText: 'Task B' }).getByRole('checkbox').check();
    await page.getByLabel('Close').click();
    // Wait for 1 minute to ensure the deadline has passed
    await page.waitForTimeout(70000); 
    // Reload the page to reflect changes
    await page.reload();
    // Verify the tracker status changes to "Ahead of Schedule"
    await expect(page.getByRole('cell', { name: 'Ahead Of Schedule' })).toBeVisible();
    // Cleanup: Delete the created tracker
    await page.getByRole('button', { name: 'Delete' }).first().click();
    const confirmModal = page.locator('#confirm-modal');
    await confirmModal.waitFor({ state: 'visible' });
    await confirmModal.locator('#confirm-delete-btn').click();
  });
 
//TEST 4.2: Tracker status changes to "Behind Schedule" if tasks are not completed within the estimated duration
test('4.2 Tracker status changes to "Behind Schedule" if tasks are not completed within the estimated duration', async ({ page }) => {
  test.setTimeout(240000);
  await page.goto('http://localhost:3001/');
  // Log in
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  // Set Start Date and Due Date
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate());
  const dueDate = new Date(currentDate); 
  dueDate.setMinutes(currentDate.getMinutes() + 4); 
  // Format dates as 'yyyy-mm-ddThh:mm'
  const startDateString = formatLocalDateTime(startDate);
  const dueDateString = formatLocalDateTime(dueDate);
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  // Fill in tracker form
  await page.getByLabel('Title').fill('Progress Tracker Test 4.3');
  await page.getByLabel('Start Date and Time').fill(startDateString);
  await page.getByLabel('Due Date and Time').fill(dueDateString);
  await page.getByLabel('Notes').fill('Test notes for Equivalence Partitioning');
  // Add Task A and Task B
  await page.getByPlaceholder('Task Name').fill('Task A');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('Task name', { exact: true }).fill('Task B');
   // Wait for the "Manual Mode" radio button to be available and select it
   const manualModeRadio = page.locator('input[type="radio"][value="manual"]');
   await manualModeRadio.waitFor({ state: 'visible' });
   await manualModeRadio.click();
   await page.getByRole('button', { name: 'Add Duration' }).click();
   await page.getByRole('button', { name: 'Add Duration' }).click();
   
   // Ensure that the task duration fields are visible and leave them empty
   const durationFields = page.locator('input[placeholder="Minutes"]');
  await durationFields.nth(0).fill('0.5'); 
  await durationFields.nth(1).fill('0.5'); 
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
  // Wait beyond due date to simulate late completion (task not completed within the estimated duration)
  await page.waitForTimeout(120000);  
  // View tasks and mark them as completed after the due date (delay task completion)
  await page.getByRole('button', { name: 'View Tasks' }).click();
  await page.locator('li').filter({ hasText: 'Task A' }).getByRole('checkbox').check();
  await page.locator('li').filter({ hasText: 'Task B' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
  
  // Reload the page to reflect changes
  await page.reload();
  // Verify the tracker status changes to "Behind Schedule"
  await expect(page.getByRole('cell', { name: 'Behind Schedule' })).toBeVisible();
  // Cleanup: Delete the created tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' });
  await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 5.1: Streaks incrementing for that day when completing a task appearing in streaks and leaderbaord page 
test('5.1 streaks incrementing for that day when completing a task', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').dblclick();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').dblclick();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
 // Navigate to Individual tab and create tracker
 await page.getByRole('link', { name: ' Individual' }).click();
 await page.getByRole('link', { name: 'Track Now' }).click();
 
 // Fill in progress tracker form
 await page.getByLabel('Title').fill('Progress Tracker streak duo');
 await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
 await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
 await page.getByLabel('Notes').fill('Test notes');
 
 await page.getByPlaceholder('Task Name').dblclick();
 await page.getByPlaceholder('Task Name').fill('Task 1');
 // Create tracker
 await page.getByRole('button', { name: 'Create Tracker' }).click();
  await page.waitForLoadState('networkidle'); 
 // View tasks and update task completion
 await page.getByRole('button', { name: 'View Tasks' }).first().click();
 await page.locator('li').filter({ hasText: 'Task 1' }).getByRole('checkbox').check();
 await page.getByLabel('Close').click();
 await page.getByRole('link', { name: 'Streaks' }).click();
 await page.getByText('Current Streak: 1', { exact: true }).click();
 await page.locator('#currentStreak').click();
 await page.getByRole('link', { name: 'Leaderboard' }).click();
 await page.locator('#currentStreakList div').filter({ hasText: 'admin' }).locator('span').click();
 await page.getByRole('link', { name: 'Progress Tracker' }).click();
 // Cleanup: Delete the created tracker
 await page.getByRole('button', { name: 'Delete' }).first().click();
 const confirmModal = page.locator('#confirm-modal');
 await confirmModal.waitFor({ state: 'visible' });
 await confirmModal.locator('#confirm-delete-btn').click();
});
//TEST 5.2: Sending a request and accepting the request to be partners
test('5.2 Sending a request and accepting the request to be partners', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').dblclick();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').dblclick();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Start streaking' }).click();
  await page.getByLabel('Choose a Partner:').selectOption('2');
  await page.getByRole('button', { name: 'Set Partner' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('dog');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Start streaking' }).click();
  await page.getByRole('button', { name: 'Accept' }).click();
});
test('5.3 Duo steak increases when user and partner completes a task that day', async ({ page }) => {
  test.setTimeout(130000);
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').dblclick();
  await page.getByLabel('Username').fill('bird');
  await page.getByLabel('Password').dblclick();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  
  // Fill in progress tracker form
  await page.getByLabel('Title').fill('Progress Tracker streak duo');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes');
  
  await page.getByPlaceholder('Task Name').dblclick();
  await page.getByPlaceholder('Task Name').fill('Task 1');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
   await page.waitForLoadState('networkidle'); 
  // View tasks and update task completion
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.locator('li').filter({ hasText: 'Task 1' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
  await page.getByRole('link', { name: 'Streaks' }).click();
  await page.getByLabel('Choose a Partner:').selectOption('3');
  await page.getByRole('button', { name: 'Set Partner' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('cat');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
  // Fill in progress tracker form
  await page.getByLabel('Title').fill('Progress Tracker streak ');
  await page.getByLabel('Start Date and Time').fill('2025-01-21T14:32');
  await page.getByLabel('Due Date and Time').fill('2025-02-21T14:24');
  await page.getByLabel('Notes').fill('Test notes');
  
  await page.getByPlaceholder('Task Name').dblclick();
  await page.getByPlaceholder('Task Name').fill('Task 1');
  // Create tracker
  await page.getByRole('button', { name: 'Create Tracker' }).click();
   await page.waitForLoadState('networkidle'); 
  // View tasks and update task completion
  await page.getByRole('button', { name: 'View Tasks' }).first().click();
  await page.locator('li').filter({ hasText: 'Task 1' }).getByRole('checkbox').check();
  await page.getByLabel('Close').click();
  await page.getByRole('link', { name: 'Streaks' }).click();
  await page.waitForLoadState('networkidle'); 
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.waitForTimeout(60000);
  await page.getByRole('link', { name: 'Leaderboard' }).click();
  await page.getByText('bird & cat').click();
  await page.getByRole('link', { name: 'Progress Tracker' }).click();
  // Delete the progress tracker
  await page.getByRole('button', { name: 'Delete' }).first().click();
  
  // Wait for the custom confirmation modal to appear
  const confirmModal = page.locator('#confirm-modal');
  await confirmModal.waitFor({ state: 'visible' }); 
  
  // Click the 'Delete' button in the modal to confirm the deletion
  await confirmModal.locator('#confirm-delete-btn').click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByLabel('Username').fill('bird');
  await page.getByLabel('Password').dblclick();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  // Navigate to Individual tab and create tracker
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Track Now' }).click();
    // Delete the progress tracker
    await page.getByRole('button', { name: 'Delete' }).first().click();
  
    // Wait for the custom confirmation modal to appear
    const confirmsModal = page.locator('#confirm-modal');
    await confirmsModal.waitFor({ state: 'visible' }); 
    
    // Click the 'Delete' button in the modal to confirm the deletion
    await confirmModal.locator('#confirm-delete-btn').click();


});

//TEST 6.1: 6.1 Receiving a freeze power up after completing 10 tasks
test('6.1 Receiving a freeze power up after completing 10 tasks',  async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('fish');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.getByRole('link', { name: ' Individual' }).click();
  await page.getByRole('link', { name: 'Start streaking' }).click();
  await page.goto('http://localhost:3001/individual/streaks/streaks.html');
  await page.waitForTimeout(70000); 
  await page.reload();
  await page.waitForLoadState('networkidle'); 
  await expect(page.getByText('🎉 Congrats! You completed 10')).toBeVisible();
});