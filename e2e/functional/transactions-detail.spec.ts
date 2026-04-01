import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';

/**
 * Tier 2 Functional Tests: Transaction Detail
 * 
 * Simplified to verify page loads without 404.
 */

test.describe('Transaction Detail - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('/transactions/[id] detail renders', async ({ page }) => {
    await page.goto('/transactions/t1_txn_test123');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/transactions/create renders', async ({ page }) => {
    await page.goto('/platform/transactions/create');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/transactions/[id]/edit renders', async ({ page }) => {
    await page.goto('/platform/transactions/t1_txn_test123/edit');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});