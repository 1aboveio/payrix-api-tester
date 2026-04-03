import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from '../utils/test-data';

test.describe('Checkout Flow Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page loads with config', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123');
    await waitForAppReady(page);
    
    // Page should load without 404
    const title = await page.title();
    expect(title).not.toContain('404');
    
    // Body should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('checkout shows error without invoice or subscription', async ({ page }) => {
    await page.goto('/checkout');
    await waitForAppReady(page);
    
    // Should show error message
    await expect(page.getByText(/No invoice or subscription ID provided|Error/)).toBeVisible();
  });
});
