import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady } from './utils/test-data';

test.describe('Alerts - multi-event selection', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('requires at least one event before enabling create', async ({ page }) => {
    await page.goto('/platform/alerts');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Create Alert/i }).click();

    const createButton = page.getByRole('button', { name: /^Create$/i });

    await expect(createButton).toBeDisabled();

    await page.getByLabel(/Login ID/i).fill('test-login');
    await page.getByLabel(/Alert Name/i).fill('Multi event alert');
    await page.getByLabel(/Webhook URL/i).fill('https://example.com/webhook');

    await expect(createButton).toBeDisabled();

    await page.getByRole('checkbox', { name: 'txn.created', exact: true }).check();
    await page.getByRole('checkbox', { name: 'invoice.created' }).check();

    await expect(page.getByText('2 event(s) selected')).toBeVisible();
    await expect(createButton).toBeEnabled();
  });

  test('trims whitespace from Login ID before validation', async ({ page }) => {
    await page.goto('/platform/alerts');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Create Alert/i }).click();

    const createButton = page.getByRole('button', { name: /^Create$/i });
    await page.getByLabel(/Login ID/i).fill('  spaced-login  ');
    await page.getByLabel(/Alert Name/i).fill('Spacing Test');

    // Whitespace-only input should be treated as trimmed and still count as valid input.
    await expect(createButton).toBeEnabled();
  });
});
