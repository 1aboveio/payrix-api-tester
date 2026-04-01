import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from './utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Real E2E Tests for Checkout Page
 * 
 * These tests use actual Payrix API calls to verify checkout renders correctly.
 * Includes regression test for #436 (auto-resolve login/merchant).
 * 
 * RULE: Never assert only `body` is visible. Use real content assertions.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Checkout Page - Real API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page loads with real invoice', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);
    
    // Get real invoice from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');
    
    const invoice = invoicesResult.data[0];
    const invoiceId = invoice.id;

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // No error alert visible
    await expect(page.locator('[role="alert"]').first()).not.toBeVisible({ timeout: 10000 });
    
    // Bill summary renders
    await expect(page.locator('text=Invoice, text=Summary, text=Order, text=Bill').first()).toBeVisible();
    
    // Invoice ID shown
    await expect(page.locator(`text=${invoiceId}`).first()).toBeVisible();
    
    // Amount shown (currency pattern)
    await expect(page.locator('text=/\\$[\\d,.]+/').first()).toBeVisible();
    
    // Payment form renders (PayFields container)
    await expect(page.locator('#payrix-payfields, [data-testid="payment-form"], #payFields-ccnumber').first()).toBeVisible({ timeout: 15000 });
    
    // Email field visible
    await expect(page.locator('input[type="email"], #email').first()).toBeVisible();
  });

  test('checkout page shows error for invalid invoice ID', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate with fake invoice ID
    await page.goto('/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Error alert visible
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 8000 });
    
    // Error text contains "not found" or "failed"
    await expect(page.locator('text=/not found|failed|error/i').first()).toBeVisible();
  });

  test('checkout page requires platform credentials', async ({ page }) => {
    // Don't seed config - simulates missing credentials
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Error alert visible
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 8000 });
    
    // Error text about API key not configured
    await expect(page.locator('text=/API key not configured|not configured|missing credentials/i').first()).toBeVisible();
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

    const subscription = subsResult.data[0];

    await page.goto(`/checkout?subscriptionId=${subscription.id}`);
    await waitForAppReady(page);

    // No error alert visible
    await expect(page.locator('[role="alert"]').first()).not.toBeVisible({ timeout: 10000 });
    
    // Subscription content visible
    await expect(page.locator('text=Subscription, text=Plan').first()).toBeVisible();
    
    // Payment form renders
    await expect(page.locator('#payrix-payfields, [data-testid="payment-form"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('checkout auto-resolves login/merchant — regression #436', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed with API key only (no login/merchant) — this is the regression scenario
    await seedConfig(page, {
      ...TEST_DATA.validCredentials,
      platformLogin: '',
      platformMerchant: '',
    });

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoice = invoicesResult.data[0];

    // Navigate to checkout — should auto-resolve and not show "not configured" error
    await page.goto(`/checkout?invoiceId=${invoice.id}`);
    await waitForAppReady(page);

    // Should NOT show "not configured" error (auto-resolve should work)
    await expect(page.locator('[role="alert"]').first()).not.toBeVisible({ timeout: 10000 });
    
    // Should show checkout content
    await expect(page.locator('h1:has-text("Checkout"), text=Checkout').first()).toBeVisible();
    
    // Payment form should render (means txnSession was created successfully)
    await expect(page.locator('#payrix-payfields, [data-testid="payment-form"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('confirmation page shows success state', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate to confirmation with test params
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // No error alert
    await expect(page.locator('[role="alert"]').first()).not.toBeVisible({ timeout: 8000 });
    
    // Should show confirmation content
    const hasConfirmationContent = await page.locator(
      'text=Confirmation, text=Payment Successful, text=Success, text=Thank you, h1, h2'
    ).first().isVisible();
    
    expect(hasConfirmationContent).toBeTruthy();
  });
});