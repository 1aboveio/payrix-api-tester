import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';

/**
 * Tier 2 Functional Tests: Tokens
 * 
 * Form interactions, success path, error path, edge cases
 */

test.describe('Tokens - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('/platform/tokens list renders with table shell and search', async ({ page }) => {
    await page.goto('/platform/tokens');
    await waitForAppReady(page);

    // Verify table shell visible
    await expect(page.locator('table, [role="table"], .table')).toBeVisible();
    
    // Verify search input visible
    await expect(page.locator('input[type="search"], input[placeholder*="search" i], button:has-text("Search")').first()).toBeVisible();
  });

  test('/platform/tokens/create — email field and submit visible', async ({ page }) => {
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Verify email field visible
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    
    // Verify submit button visible
    await expect(page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")').first()).toBeVisible();
  });

  test('/platform/tokens/create — submit with valid email shows customer resolution', async ({ page }) => {
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Fill email
    await page.locator('input[type="email"]').first().fill('test@example.com');
    
    // Click submit/resolve button
    await page.locator('button:has-text("Check"), button:has-text("Resolve"), button[type="submit"]').first().click();

    // Wait for resolution state (loading or result)
    await page.waitForTimeout(2000);

    // Should show resolution result (existing or new customer)
    const hasResult = await page.locator('text=customer, text=found, text=new, [role="alert"]').first().isVisible().catch(() => false);
    expect(hasResult).toBeTruthy();
  });

  test('/platform/tokens/create — error shown without API key', async ({ page }) => {
    // Clear API key
    await seedConfig(page, { ...TEST_DATA.validCredentials, platformApiKey: '' });
    
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Should show error alert
    await expect(page.locator('[role="alert"], .alert, .error').first()).toBeVisible();
  });

  test('/platform/tokens/[id] — token detail renders with token ID and card info', async ({ page }) => {
    // Navigate with a fake token ID
    await page.goto('/platform/tokens/t1_tok_test123');
    await waitForAppReady(page);

    // Verify token ID visible
    await expect(page.locator('text=t1_tok_test123, text=Token, [data-testid="token-id"]').first()).toBeVisible();
    
    // Verify card info section visible (last 4 or card details)
    const hasCardInfo = await page.locator('text=****, text=card, text=ending, text=last').first().isVisible().catch(() => false);
    expect(hasCardInfo).toBeTruthy();
  });
});
