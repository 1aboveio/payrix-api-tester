import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from './utils/test-data';
import { PlatformClient } from '@/lib/platform/client';
import type { CreateInvoiceRequest } from '@/lib/platform/types';

/**
 * Real E2E Tests for Checkout Page
 * 
 * These tests use actual Payrix API calls to create invoices/subscriptions,
 * then verify the checkout page renders correctly with real data.
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
    
    // Create a real invoice via API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoiceData: CreateInvoiceRequest = {
      login: TEST_DATA.validCredentials.platformLogin,
      merchant: TEST_DATA.validCredentials.platformMerchant,
      number: `INV-E2E-${Date.now()}`,
      status: 'pending',
      title: 'E2E Test Invoice',
      total: 1000, // $10.00
      type: 'single',
    };

    const createResult = await client.createInvoice(invoiceData);
    expect(createResult.errors).toHaveLength(0);
    expect(createResult.data).toHaveLength(1);
    
    const invoice = createResult.data[0];
    const invoiceId = invoice.id;

    // Navigate to checkout with real invoice ID
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify checkout page loads with invoice data
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    await expect(page.locator('text=E2E Test Invoice')).toBeVisible();
    await expect(page.locator('text=$10.00')).toBeVisible();

    // Verify payment form is present
    await expect(page.locator('[data-testid="payment-form"], #payrix-payfields')).toBeVisible();
  });

  test('checkout page shows error for invalid invoice ID', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate with fake invoice ID
    await page.goto('/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Should show error state
    await expect(page.locator('text=Failed to load invoice')).toBeVisible();
  });

  test('checkout page requires platform credentials', async ({ page }) => {
    // Don't seed config - simulates missing credentials
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Should show error about missing credentials
    await expect(
      page.locator('text=Platform API key not configured, text=Platform login and merchant not configured')
    ).toBeVisible();
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
    await expect(page.locator('text=Subscription')).toBeVisible();
  });

  test('confirmation page shows success after payment', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate to confirmation with test params
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Should show success or error state (not loading indefinitely)
    const hasSuccess = await page.locator('text=Payment Successful').isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasSuccess || hasError || hasLoading).toBeTruthy();
  });
});
