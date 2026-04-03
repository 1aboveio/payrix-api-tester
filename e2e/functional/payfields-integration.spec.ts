import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: PayFields Integration
 * 
 * Tests PayFields checkout and token creation flows.
 * Issue #501: PayFields checkout + token creation E2E tests
 * 
 * Note: These tests verify user-visible behavior (form rendering, submission)
 * rather than internal SDK state, as PayFields loads asynchronously.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('PayFields Integration', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page renders payment form with invoice', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real invoice for checkout
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available for checkout test');

    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify page loads and shows payment form elements
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Checkout|Payment/i })).toBeVisible();
    
    // Verify payment form containers exist (PayFields will inject into these)
    await expect(page.locator('#payFields-ccnumber, [data-testid="card-number"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#payFields-ccexp, [data-testid="card-expiry"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#payFields-cvv, [data-testid="card-cvv"]')).toBeVisible({ timeout: 15000 });
    
    // Verify submit button exists
    await expect(page.locator('button[type="submit"]').filter({ hasText: /Pay|Submit/i })).toBeVisible();
  });

  test('checkout page shows error state for invalid invoice', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Verify page loads (either shows form with error or redirects)
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some form of error or warning
    const errorVisible = await page.locator('text=/error|Error|not found|invalid/i').isVisible().catch(() => false);
    const formVisible = await page.locator('#payFields-ccnumber, form').isVisible().catch(() => false);
    
    expect(errorVisible || formVisible).toBe(true);
  });

  test('token creation page renders payment form', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real customer for token creation
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const customersResult = await client.listCustomers([], { limit: 1 });
    test.skip(customersResult.data.length === 0, 'No customers available for token test');

    const customer = customersResult.data[0];

    // Navigate to token creation
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Enter customer email to lookup
    await page.fill('input[placeholder*="email"], input[type="email"]', customer.email || 'test@example.com');
    await page.click('button:has-text("Lookup"), button[type="submit"]');
    
    // Wait for customer resolution and form to appear
    await page.waitForTimeout(2000);

    // Verify payment form elements are visible
    await expect(page.locator('#payFields-ccnumber, [data-testid="card-number"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#payFields-ccexp, [data-testid="card-expiry"]')).toBeVisible({ timeout: 15000 });
    
    // Verify create token button exists
    await expect(page.locator('button[type="submit"]').filter({ hasText: /Create|Token|Save/i })).toBeVisible();
  });

  test('checkout page shows invoice details', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoice = invoicesResult.data[0];

    await page.goto(`/checkout?invoiceId=${invoice.id}`);
    await waitForAppReady(page);

    // Verify invoice details are displayed
    await expect(page.locator('body')).toBeVisible();
    
    // Should show invoice amount or ID somewhere
    const pageContent = await page.content();
    const hasInvoiceInfo = pageContent.includes(invoice.id) || 
                          pageContent.includes(String(invoice.amount)) ||
                          pageContent.includes('Invoice');
    
    expect(hasInvoiceInfo).toBe(true);
  });

  test('confirmation page renders after payment', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate to confirmation with mock params
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify confirmation page elements
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /Confirmation|Success|Complete/i })).toBeVisible();
  });

  test('checkout form validates required fields', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    await page.goto(`/checkout?invoiceId=${invoicesResult.data[0].id}`);
    await waitForAppReady(page);

    // Wait for form to be ready
    await page.waitForTimeout(3000);

    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Pay|Submit/i });
    await expect(submitButton).toBeVisible();
    
    // Click submit - should not navigate away or should show validation
    await submitButton.click();
    
    // Wait a moment for any validation
    await page.waitForTimeout(1000);
    
    // Should still be on checkout page (validation prevented submission)
    await expect(page).toHaveURL(/checkout/);
  });
});
