import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from './utils/test-data';

/**
 * Smoke Tests for Checkout Feature
 * 
 * Basic tests that verify checkout routes load without 404.
 * For full integration tests with real API data, see checkout-real-api.spec.ts
 */

test.describe('Checkout Flow - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedConfig(page, TEST_DATA.validCredentials);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page route exists for invoice parameter', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    
    // Should show checkout heading or error (not 404)
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('checkout page route exists for subscription parameter', async ({ page }) => {
    await page.goto('/checkout?subscriptionId=test123');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('checkout page route exists without parameters', async ({ page }) => {
    await page.goto('/checkout');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('confirmation page route exists', async ({ page }) => {
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});
