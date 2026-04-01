import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';

/**
 * Tier 2 Functional Tests: Terminal Transactions
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

    // Verify page content visible (table or empty state)
    await expect(page.locator('table, [role="table"], .table, text=No data, text=transactions').first()).toBeVisible();
  });

  test('/platform/terminal-txns/create — form renders with required fields', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);

    // Verify form visible
    await expect(page.locator('form').first()).toBeVisible();
    
    // Verify submit button visible
    await expect(page.locator('button[type="submit"], button:has-text("Create")').first()).toBeVisible();
    
    // Verify at least one input field visible
    await expect(page.locator('input, select, textarea').first()).toBeVisible();
  });

  test('/platform/terminal-txns/create — error shown with missing required field', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);

    // Click submit without filling fields
    await page.locator('button[type="submit"], button:has-text("Create")').first().click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should show error alert or validation message
    const hasError = await page.locator('[role="alert"], .error, text=required, text=invalid').first().isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });
});
