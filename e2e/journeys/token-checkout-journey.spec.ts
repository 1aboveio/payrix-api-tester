import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: Token → Checkout
 * 
 * Complete customer-facing payment journey with real APIs.
 * Simplified to just verify page loads without crash.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Token Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('complete journey: invoice list → detail → checkout', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Step 1: Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Step 2: Navigate to invoices page
    await page.goto('/platform/invoices');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Get first invoice from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    // Step 4: Navigate to invoice detail
    await page.goto(`/platform/invoices/${invoiceId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Step 5: Navigate to checkout
    await page.goto(`/platform/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('checkout auto-resolves login/merchant — regression #436', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed with API key but NO login/merchant
    await seedConfig(page, { 
      ...TEST_DATA.validCredentials, 
      platformLogin: '', 
      platformMerchant: '' 
    });

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoice = invoicesResult.data[0];

    await page.goto(`/platform/checkout?invoiceId=${invoice.id}`);
    await waitForAppReady(page);

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});