import { test, expect } from '@playwright/test';

//Login test
test('test', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('root@1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('link', { name: ' Forum' })).toBeVisible();
  await page.getByRole('link', { name: ' Forum' }).click();
  await page.getByRole('link', { name: ' Forum' }).click();
});

//Forum page test
test('test forum page actions', async ({ page }) => {
  await page.goto('http://localhost:3001/forum/forum.html?forumId=1');

  page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '' }).click();
  await page.getByPlaceholder('Title', { exact: true }).click();
  await page.getByPlaceholder('Title', { exact: true }).fill('Title');
  await page.getByPlaceholder('What\'s happening?').click();
  await page.getByPlaceholder('What\'s happening?').fill('Content');
  await page.getByLabel('New Post', { exact: true }).locator('div').filter({ hasText: 'Post' }).nth(3).click();
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await page.getByPlaceholder('Write a comment').click();
  await page.getByPlaceholder('Write a comment').fill('Comment 1');
  await page.getByRole('button', { name: 'Comment', exact: true }).click();

  await page.getByRole('button', { name: 'Show Comments' }).click();
  await expect(page.getByRole('button', { name: 'Reply' })).toBeVisible();

  await page.getByRole('button', { name: 'Reply' }).click();
  await page.getByPlaceholder('Write a reply').click();
  await page.getByPlaceholder('Write a reply').fill('Comment 1 1');
  await page.locator('#reply-form-1').getByRole('button', { name: 'Reply' }).click();
  await expect(page.getByText('Comment 1 1')).toBeVisible();

  await page.getByRole('button', { name: 'Reply' }).nth(1).click();
  await page.getByRole('textbox', { name: 'Write a reply' }).click();
  await page.getByRole('textbox', { name: 'Write a reply' }).fill('Comment 1 2');
  await page.locator('#reply-form-1').getByRole('button', { name: 'Reply' }).click();
  await expect(page.getByText('Comment 1 2')).toBeVisible();

  await page.locator('#comment-2').getByRole('button', { name: 'Reply' }).click();
  await page.getByRole('textbox', { name: 'Write a reply' }).click();
  await page.getByRole('textbox', { name: 'Write a reply' }).fill('Comment 2');
  await page.locator('#reply-form-2').getByRole('button', { name: 'Reply' }).click();
  await expect(page.getByText('Comment 2')).toBeVisible();

  await page.getByTitle('Delete').first().click();
  await expect(page.getByPlaceholder('New Post Title')).toBeVisible();

  await page.getByPlaceholder('New Post Title').click();
  await page.getByPlaceholder('New Post Title').fill('Test Title');
  await page.getByPlaceholder('New Post Content').click();
  await page.getByPlaceholder('New Post Content').fill('Test Content ');
  await page.locator('#updatePostId').fill('1');
  await page.locator('#updatePostId').click();
  await page.getByRole('button', { name: 'Update Post' }).click();
  await expect(page.getByText('Test Title')).toBeVisible();
  await expect(page.getByText('Test Content')).toBeVisible();

  await page.getByPlaceholder('Search posts...').click();
  await page.getByPlaceholder('Search posts...').fill('Test');
  await expect(page.getByText('Test Title')).toBeVisible();
});

//Forum page miscellaneous actions
test('test forum page miscellaneous actions', async ({ page }) => {
  await page.goto('http://localhost:3001/forum/forum.html?forumId=1');
  await page.getByRole('button', { name: '🌙' }).click();
  await page.getByRole('button', { name: '🌙' }).click();
  await page.getByRole('button', { name: '' }).click();
  
  await page.getByPlaceholder('Title', { exact: true }).click();
  await page.getByPlaceholder('Title', { exact: true }).fill('Test Title 2');
  await page.getByPlaceholder('What\'s happening?').click();
  await page.getByPlaceholder('What\'s happening?').fill('Test Content 2');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page.getByText('Test Title 2')).toBeVisible();
  await expect(page.getByText('Test Content 2')).toBeVisible();

  await page.locator('#filterDropdown').selectOption('oldest');
  await expect(page.locator('#filterDropdown')).toHaveValue('oldest');
  await page.locator('#filterDropdown').selectOption('highestVotes');
  await expect(page.locator('#filterDropdown')).toHaveValue('highestVotes');
  await page.locator('#filterDropdown').selectOption('lowestVotes');
  await expect(page.locator('#filterDropdown')).toHaveValue('lowestVotes')
  await page.getByPlaceholder('Search posts...').click();
  await page.getByPlaceholder('Search posts...').fill('Test');
  await page.getByRole('link', { name: 'Back' }).click();
});

//Forum Main page actions
test('test forumMain actions', async ({ page }) => {
  await page.goto('http://localhost:3001/forum/forumMain.html');
  await page.getByRole('button', { name: 'Close Forum' }).click();
  await expect(page.getByText('Closed')).toBeVisible();
  
  await page.getByRole('button', { name: 'Open Forum' }).click();
  
  await page.getByRole('button', { name: 'View Archived Forums' }).click();
  await expect(page.getByRole('button', { name: 'View Active Forums' })).toBeVisible();
  
  await page.locator('#forumList').getByRole('list').click();
  await page.getByRole('button', { name: 'View Active Forums' }).click();
  await expect(page.getByRole('button', { name: 'View Archived Forums' })).toBeVisible();
});
