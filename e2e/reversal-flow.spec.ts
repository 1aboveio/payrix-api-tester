import { test, expect } from '@playwright/test';
import { clearTestData, seedConfig, waitForAppReady, TEST_DATA, generateTestId } from './utils/test-data';

async function getResponseJson(page: Parameters<typeof test>[0]['page']) {
  const responseCard = page.getByRole('heading', { name: 'Response' }).locator('..').locator('..');
  const responseText = await responseCard.locator('pre').first().textContent();
  if (!responseText) return {};
  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

async function executeSale(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/transactions/sale');
  await waitForAppReady(page);

  await page.getByLabel(/Lane ID/i).fill(TEST_DATA.transaction.laneId);
  await page.getByLabel(/Transaction Amount/i).fill(TEST_DATA.transaction.amount);
  await page.getByLabel(/Reference Number/i).fill(generateTestId('sale'));

  await page.getByRole('button', { name: /Execute Sale/i }).click();
  await expect(page.getByRole('button', { name: /Save to History|Saved to History/i })).toBeVisible({ timeout: 60000 });

  const response = await getResponseJson(page);
  const transactionId = response.transactionId as string | undefined;
  expect(transactionId).toBeTruthy();
  return transactionId as string;
}

test.describe('Reversal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('quick actions appear after successful sale', async ({ page }) => {
    await executeSale(page);
    await expect(page.getByRole('link', { name: 'Void' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print|Printer/i })).toBeVisible();
  });

  test('sale -> void -> response received', async ({ page }) => {
    const transactionId = await executeSale(page);
    await page.goto(`/reversals/void?transactionId=${encodeURIComponent(transactionId)}`);
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Execute Void/i }).click();
    await expect(page.getByText('Execute request to view response.')).not.toBeVisible({ timeout: 60000 });
  });

  test('sale -> return -> response received', async ({ page }) => {
    const transactionId = await executeSale(page);
    await page.goto(`/reversals/return?transactionId=${encodeURIComponent(transactionId)}&paymentType=credit`);
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Execute Return/i }).click();
    await expect(page.getByText('Execute request to view response.')).not.toBeVisible({ timeout: 60000 });
  });

  test('sale -> reversal -> response received', async ({ page }) => {
    const transactionId = await executeSale(page);
    await page.goto(`/reversals/reversal?transactionId=${encodeURIComponent(transactionId)}&paymentType=credit`);
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Execute Reversal/i }).click();
    await expect(page.getByText('Execute request to view response.')).not.toBeVisible({ timeout: 60000 });
  });
});
