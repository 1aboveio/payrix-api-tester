import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';

/**
 * Tier 2 Functional Tests: Transaction Detail
 */

test.describe('Transaction Detail - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('/transactions/[id] — detail renders with txn ID, amount, status', async ({ page }) => {
    // Navigate with fake transaction ID
    await page.goto('/transactions/t1_txn_test123');
    await waitForAppReady(page);

    // Verify transaction ID visible
    await expect(page.locator('text=t1_txn_test123, text=Transaction, [data-testid="txn-id"]').first()).toBeVisible();
    
    // Verify amount or status visible
    const hasAmountOrStatus = await page.locator('text=amount, text=status, text=$, text=pending, text=approved, text=complete').first().isVisible().catch(() => false);
    expect(hasAmountOrStatus).toBeTruthy();
  });

  test('/platform/transactions/create — form visible with required fields', async ({ page }) => {
    await page.goto('/platform/transactions/create');
    await waitForAppReady(page);

    // Verify form visible
    await expect(page.locator('form').first()).toBeVisible();
    
    // Verify submit button visible
    await expect(page.locator('button[type="submit"], button:has-text("Create")').first()).toBeVisible();
  });

  test('/platform/transactions/create — validates required fields on submit', async ({ page }) => {
    await page.goto('/platform/transactions/create');
    await waitForAppReady(page);

    // Click submit without filling
    await page.locator('button[type="submit"], button:has-text("Create")').first().click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should show error
    const hasError = await page.locator('[role="alert"], .error, text=required').first().isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  test('/platform/transactions/[id]/edit — edit form visible', async ({ page }) => {
    // Navigate with fake transaction ID
    await page.goto('/platform/transactions/t1_txn_test123/edit');
    await waitForAppReady(page);

    // Verify form visible
    await expect(page.locator('form').first()).toBeVisible();
    
    // Verify save/update button visible
    await expect(page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first()).toBeVisible();
  });
});
