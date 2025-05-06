import { test, expect } from '@playwright/test';
//download document
test('download document', async ({ page }) => {
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByRole('button', { name: 'View Details' }).first().click();
  const download3Promise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download3 = await download3Promise;
});

//search document and videos
test('search document and videos name', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByPlaceholder('Search by file name').click();
  await page.getByPlaceholder('Search by file name').press('CapsLock');
  await page.getByPlaceholder('Search by file name').fill('LEARN LOOP 1 TESTING');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('tab', { name: 'Documents' }).click();
  await page.locator('#fileTypeFilter').selectOption('mp4');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('pdf');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('docx');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('');
  await page.getByPlaceholder('Search by file name').click();
  await page.getByPlaceholder('Search by file name').fill('LEARNLOOP VIDEO2');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('tab', { name: 'Videos' }).click();
  await page.locator('#fileTypeFilter').selectOption('mp4');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('pdf');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('docx');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#fileTypeFilter').selectOption('');
  await page.getByRole('button', { name: 'Search' }).click();
});
//view detail of documents and download
test('view detail of documents', async ({ page }) => {
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByRole('button', { name: 'View Details' }).first().click();
  const download2Promise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download2 = await download2Promise;
});
//pin document
test('pinned document', async ({ page }) => {
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByRole('button', { name: 'Pin' }).first().click();
  await page.getByRole('tab', { name: 'Pinned' }).click();
  await page.getByRole('button', { name: 'Unpin' }).click();
  await page.getByRole('tab', { name: 'Videos' }).click();
});
//bulk download future and convert it into zip.
test('bulk-download', async ({ page }) => {
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.getByRole('checkbox').first().check();
  await page.getByRole('checkbox').nth(1).check();
  const download6Promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Selected' }).click();
  const download6 = await download6Promise;
  await page.getByRole('tab', { name: 'Documents' }).click();
  await page.getByLabel('Documents').locator('div').filter({ hasText: 'LEARN LOOP 1 TESTING Type:' }).nth(2).click();
  await page.locator('#documentList > div:nth-child(2) > .card > .resource-checkbox').check();
  await page.locator('div:nth-child(7) > .card > .resource-checkbox').check();
  const download7Promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Selected' }).click();
  const download7 = await download7Promise
});
//sort by feature
test('sort by feauture', async ({ page }) => {
  await page.goto('http://localhost:3001/resources/resources.html');
  await page.getByRole('link', { name: ' Resources' }).click();
  await page.locator('#sortBy').selectOption('most-downloads');
  await page.locator('#sortBy').selectOption('least-downloads');
  await page.locator('#sortBy').selectOption('a-z');
  await page.getByText('All Types Videos PDF Documents Search Sort By: Default Most Downloads Least').click();
  await page.getByText('All Types Videos PDF Documents Search Sort By: Default Most Downloads Least').click();
  await page.locator('#sortBy').selectOption('most-views');
  await page.getByRole('tab', { name: 'Documents' }).click();
  await page.locator('#sortBy').selectOption('most-downloads');
  await page.locator('#sortBy').selectOption('least-downloads');
  await page.getByText('All Types Videos PDF Documents Search Sort By: Default Most Downloads Least').click();
  await page.locator('#sortBy').selectOption('a-z');
  await page.locator('#sortBy').selectOption('most-views')
  });
