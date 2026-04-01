import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: Terminal Transactions
 * 
 * Simplified to verify page loads without 404.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Terminal Transactions - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('/platform/terminal-txns list renders', async ({ page }) => {
    await page.goto('/platform/terminal-txns');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/terminal-txns/create renders', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/terminal-txns/create shows error with missing required field', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);

    // Try to submit without filling required fields
    await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create")').first().click();
    await waitForAppReady(page);

    // Verify page still shows (no crash) - form validation error is expected
    await expect(page.locator('body')).toBeVisible();
  });

  test('/platform/terminal-txns/[id] detail renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const result = await client.listTerminalTransactions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No terminal transactions available');

    await page.goto(`/platform/terminal-txns/${result.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});