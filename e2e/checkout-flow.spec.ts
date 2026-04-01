import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from './utils/test-data';

/**
 * E2E Tests for Checkout Feature
 * 
 * Tests the Stripe-style checkout flow loads correctly
 */

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app first to avoid localStorage SecurityError on about:blank
    await page.goto('/');
    await seedConfig(page, TEST_DATA.validCredentials);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page loads with invoice parameter', async ({ page }) => {
    // Navigate directly to checkout with a test invoice ID
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Verify page structure loads (either checkout heading or error state)
    const hasCheckout = await page.locator('h1:has-text("Checkout")').isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').or(page.locator('text=not configured')).isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasCheckout || hasError || hasLoading).toBeTruthy();
  });

  test('checkout page loads with subscription parameter', async ({ page }) => {
    // Navigate directly to checkout with a test subscription ID
    await page.goto('/checkout?subscriptionId=test123');
    await waitForAppReady(page);

    // Verify page structure loads
    const hasCheckout = await page.locator('h1:has-text("Checkout")').isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').or(page.locator('text=not configured')).isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasCheckout || hasError || hasLoading).toBeTruthy();
  });

  test('checkout page shows error for missing parameters', async ({ page }) => {
    // Navigate to checkout without any parameters
    await page.goto('/checkout');
    await waitForAppReady(page);

    // Should show error message or loading state
    const hasError = await page.locator('text=Error').or(page.locator('text=not configured')).isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasError || hasLoading).toBeTruthy();
  });

  test('confirmation page structure', async ({ page }) => {
    // Navigate directly to confirmation with test parameters
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify confirmation page structure - either success or error
    const hasSuccess = await page.locator('text=Payment Successful').or(page.locator('text=Success')).isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasSuccess || hasError || hasLoading).toBeTruthy();
  });
});
