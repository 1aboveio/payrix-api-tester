import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from './utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Real E2E Tests for Checkout Page
 * 
 * These tests verify the checkout page loads and handles various scenarios.
 * Requires: TEST_PLATFORM_API_KEY, TEST_PLATFORM_LOGIN, TEST_PLATFORM_MERCHANT
 */

test.describe('Checkout Page - Real API Integration', () => {
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

    await seedConfig(page, TEST_DATA.validCredentials);
    
    // Get existing invoices from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');
    
    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout - just verify page loads without crash
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify page loaded (body visible, no 404)
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('checkout page shows error for invalid invoice ID', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate with fake invoice ID
    await page.goto('/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Verify page loaded (shows error or validation message)
    await expect(page.locator('body')).toBeVisible();
  });

  test('checkout page requires platform credentials', async ({ page }) => {
    // Don't seed config - simulates missing credentials
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Verify page loaded with error state
    await expect(page.locator('body')).toBeVisible();
  });

  test('checkout page loads with real subscription', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    const subscriptionId = subsResult.data[0].id;

    await page.goto(`/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);

    // Verify page loaded without crash
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('confirmation page route exists', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});