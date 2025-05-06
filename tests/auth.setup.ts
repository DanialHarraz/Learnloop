import { test as setup, expect } from '@playwright/test';
import path from 'path';

const adminAuthFile = path.join(__dirname, '../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.waitForURL('http://localhost:3001/index.html');
  await page.context().storageState({ path: adminAuthFile });
});

const userAuthFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as user', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('dog');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('root@1234');
  await page.getByLabel('Password').press('Enter');
  await page.waitForURL('http://localhost:3001/index.html');
  await page.context().storageState({ path: userAuthFile });
});