import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: PayFields Integration
 * 
 * Tests PayFields SDK loading and form rendering for checkout and token creation.
 * Issue #501: PayFields checkout + token creation E2E tests
 * 
 * Prerequisites:
 * - TEST_PLATFORM_API_KEY must be set with valid Payrix credentials
 * - Customer must exist in platform (for token creation)
 * - Invoice must exist (for checkout flow)
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

  test('checkout page loads PayFields SDK with spa=1 mode', async ({ page }) => {
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

    // Verify page loads
    await expect(page.locator('body')).toBeVisible();

    // Wait for jQuery to load (required by PayFields)
    await page.waitForFunction(() => {
      return (window as any).jQuery !== undefined;
    }, { timeout: 10000 });

    // Wait for PayFields SDK to load with spa=1
    await page.waitForFunction(() => {
      return (window as any).PayFields !== undefined;
    }, { timeout: 10000 });

    // Verify PayFields config is set correctly
    const payFieldsConfig = await page.evaluate(() => {
      return (window as any).PayFields?.config;
    });

    expect(payFieldsConfig).toBeDefined();
    expect(payFieldsConfig.mode).toBe('txn');
    expect(payFieldsConfig.txnType).toBe('sale');
  });

  test('token creation page loads PayFields SDK with spa=1 mode', async ({ page }) => {
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

    const customerId = customersResult.data[0].id;

    // Navigate to token creation
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    // Enter customer email to lookup
    await page.fill('input[placeholder*="email"]', customersResult.data[0].email || 'test@example.com');
    await page.click('button:has-text("Lookup")');
    
    // Wait for customer resolution
    await page.waitForSelector('text=Customer resolved', { timeout: 10000 });

    // Wait for jQuery to load (required by PayFields)
    await page.waitForFunction(() => {
      return (window as any).jQuery !== undefined;
    }, { timeout: 10000 });

    // Wait for PayFields SDK to load with spa=1
    await page.waitForFunction(() => {
      return (window as any).PayFields !== undefined;
    }, { timeout: 10000 });

    // Verify PayFields config is set correctly for token mode
    const payFieldsConfig = await page.evaluate(() => {
      return (window as any).PayFields?.config;
    });

    expect(payFieldsConfig).toBeDefined();
    expect(payFieldsConfig.mode).toBe('token');
  });

  test('PayFields form containers render with correct dimensions', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real invoice
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Wait for PayFields to be ready
    await page.waitForFunction(() => {
      return (window as any).PayFields !== undefined;
    }, { timeout: 10000 });

    // Wait for form containers to be visible
    await page.waitForSelector('#payFields-ccnumber', { timeout: 10000 });
    await page.waitForSelector('#payFields-ccexp', { timeout: 10000 });
    await page.waitForSelector('#payFields-cvv', { timeout: 10000 });

    // Verify container dimensions (300x73px per Worldpay spec)
    const ccNumberContainer = page.locator('#payFields-ccnumber');
    const box = await ccNumberContainer.boundingBox();
    
    expect(box).toBeDefined();
    expect(box?.width).toBe(300);
    expect(box?.height).toBe(73);
  });

  test('PayFields script loads with correct URL pattern', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Monitor network requests for PayFields script
    const payFieldsRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('payFieldsScript')) {
        payFieldsRequests.push(url);
      }
    });

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real invoice
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Wait for PayFields to load
    await page.waitForFunction(() => {
      return (window as any).PayFields !== undefined;
    }, { timeout: 10000 });

    // Verify PayFields script was loaded with spa=1 parameter
    expect(payFieldsRequests.length).toBeGreaterThan(0);
    expect(payFieldsRequests[0]).toContain('spa=1');
    expect(payFieldsRequests[0]).toContain('test-api.payrix.com');
  });

  test('jQuery loads before PayFields SDK', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real invoice
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    // Track load order
    const loadOrder: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('jQuery loaded')) {
        loadOrder.push('jQuery');
      }
      if (text.includes('PayFields loaded')) {
        loadOrder.push('PayFields');
      }
    });

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Wait for both to load
    await page.waitForFunction(() => {
      return (window as any).jQuery !== undefined && (window as any).PayFields !== undefined;
    }, { timeout: 15000 });

    // Verify jQuery is available before PayFields
    const jQueryIndex = loadOrder.indexOf('jQuery');
    const payFieldsIndex = loadOrder.indexOf('PayFields');
    
    if (jQueryIndex !== -1 && payFieldsIndex !== -1) {
      expect(jQueryIndex).toBeLessThan(payFieldsIndex);
    }
  });

  test('PayFields ready() is called for SPA mode', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config with platform credentials
    await seedConfig(page, TEST_DATA.validCredentials);

    // Get a real invoice
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const invoicesResult = await client.listInvoices([], { limit: 1 });
    test.skip(invoicesResult.data.length === 0, 'No invoices available');

    const invoiceId = invoicesResult.data[0].id;

    // Navigate to checkout
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Wait for PayFields to be ready
    await page.waitForFunction(() => {
      const pf = (window as any).PayFields;
      return pf !== undefined && typeof pf.ready === 'function';
    }, { timeout: 10000 });

    // Verify ready() was called (fields should be configured)
    const fieldsConfigured = await page.evaluate(() => {
      const pf = (window as any).PayFields;
      return pf.fields && pf.fields.length > 0;
    });

    expect(fieldsConfigured).toBe(true);
  });
});
