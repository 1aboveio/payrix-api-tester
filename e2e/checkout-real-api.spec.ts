import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from './utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Real E2E Tests for Checkout Page
 * 
 * These tests use actual Payrix API calls to test the checkout flow
 * with real invoice/subscription data.
 * 
 * Requires: TEST_PLATFORM_API_KEY, TEST_PLATFORM_LOGIN, TEST_PLATFORM_MERCHANT
 */

test.describe('Checkout Page - Real API Integration', () => {
  // Skip these tests if no real API credentials are available
  const hasRealCredentials = 
    process.env.TEST_PLATFORM_API_KEY && 
    process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page loads with real invoice', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with real credentials
    await seedConfig(page, TEST_DATA.validCredentials);
    
    // Get existing invoices from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available in test environment');
    
    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout with real invoice ID
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify checkout page loads
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    
    // Verify invoice data is displayed (title or number)
    const hasInvoiceContent = await page.locator('text=Invoice, text=inv_, text=INV_').first().isVisible().catch(() => false);
    expect(hasInvoiceContent).toBeTruthy();
  });

  test('checkout page shows error for invalid invoice ID', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate with fake invoice ID
    await page.goto('/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Should show error state
    await expect(page.locator('text=Failed to load')).toBeVisible();
  });

  test('checkout page requires platform credentials', async ({ page }) => {
    // Don't seed config - simulates missing credentials
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Should show error about missing credentials
    const hasError = await page.locator('text=not configured, text=Error').first().isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  test('checkout page loads with real subscription', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    // List subscriptions and use the first one
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available in test environment');

    const subscriptionId = subsResult.data[0].id;

    // Navigate to checkout with real subscription ID
    await page.goto(`/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);

    // Verify checkout page loads
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
  });

  test('confirmation page route exists', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate to confirmation with test params
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});
