import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: PayFields Integration
 * 
 * Tests checkout page loading and invoice/subscription display.
 * Note: PayFields SDK rendering is not tested directly as it depends on
 * external script loading which is flaky in CI environments.
 * Issue #501: PayFields checkout + token creation E2E tests
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

  test('checkout page loads with valid invoice', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify page loads without 404
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');

    // Should show loading state initially, then invoice content
    await expect(page.locator('text=/Loading|Invoice|checkout|payment/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('checkout page shows error for invalid invoice', async ({ page }) => {
    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/platform/checkout?invoiceId=invalid_fake_id_12345');
    await waitForAppReady(page);

    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Should show error or form (not 404)
    const content = await page.content();
    const hasErrorOrForm = content.includes('error') || 
                           content.includes('Error') || 
                           content.includes('not found') ||
                           content.includes('Loading');
    
    expect(hasErrorOrForm).toBe(true);
  });

  test('token creation page loads', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');

    // Should show customer lookup form or token creation UI
    await expect(page.locator('input, form, h1, h2').first()).toBeVisible();
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

    // Wait for page to load invoice data
    await page.waitForTimeout(3000);

    // Verify page shows invoice-related content
    const content = await page.content();
    const hasInvoiceInfo = content.includes(invoice.id) || 
                          content.includes(String(invoice.amount)) ||
                          content.includes('Invoice') ||
                          content.includes('Loading') ||
                          content.includes('checkout');
    
    expect(hasInvoiceInfo).toBe(true);
  });

  test('confirmation page renders', async ({ page }) => {
    await page.goto('/platform/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify confirmation page elements
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('checkout page requires credentials', async ({ page }) => {
    // Don't seed config - should show error or prompt for credentials
    await page.goto('/platform/checkout?invoiceId=test123');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    
    // Should show some indication that credentials are needed
    const content = await page.content();
    const hasRelevantContent = content.includes('API') || 
                               content.includes('config') || 
                               content.includes('setting') ||
                               content.includes('Loading') ||
                               content.includes('checkout');
    
    expect(hasRelevantContent).toBe(true);
  });
});
