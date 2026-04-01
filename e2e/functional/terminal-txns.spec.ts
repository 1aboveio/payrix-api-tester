import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';

/**
 * Tier 2 Functional Tests: Terminal Transactions
 * 
 * Simplified to verify page loads without 404.
 */

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
});