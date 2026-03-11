import { test, expect, type Page } from '@playwright/test';
import { waitForAppReady } from './utils/test-data';

async function seedPlatformConfig(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'payrix_config';
    const existing = localStorage.getItem(key);
    const base = existing ? JSON.parse(existing) : {};

    localStorage.setItem(
      key,
      JSON.stringify({
        ...base,
        platformApiKey: base.platformApiKey || 'e2e-platform-key',
        platformEnvironment: base.platformEnvironment || 'test',
      })
    );
  });
}

test.describe('Platform Endpoints Coverage', () => {
  const trackClientRequests = (page: Page) => {
    let count = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
        count += 1;
      }
    });
    return () => count;
  };
  test.beforeEach(async ({ page }) => {
    await seedPlatformConfig(page);
  });

  test('platform invoices list renders key controls', async ({ page }) => {
    await page.goto('/platform/invoices');
    await waitForAppReady(page);

    await expect(page.getByRole('main').getByText('Invoices', { exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /Create Invoice/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search by number or title/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Search/i })).toBeVisible();
  });

  test('platform create invoice page renders required fields and line item controls', async ({ page }) => {
    await page.goto('/platform/invoices/create');
    await waitForAppReady(page);

    await expect(page.getByText(/Create a new Payrix Platform invoice\./i)).toBeVisible();
    await expect(page.getByLabel(/Login ID/i)).toBeVisible();
    await expect(page.getByTestId('invoice-merchant-select')).toBeVisible();
    await expect(page.getByLabel(/Invoice Number/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Item/i })).toBeVisible();

    const lineItemLabels = page.getByText('Item Name *');
    const lineItemBoxesBefore = await lineItemLabels.count();
    await page.getByRole('button', { name: /Add Item/i }).click();
    await expect(lineItemLabels).toHaveCount(lineItemBoxesBefore + 1);

    await expect(page.getByRole('button', { name: /^Create Invoice$/i })).toBeVisible();
  });

  test('platform invoice detail route triggers detail action request for requested id', async ({ page }) => {
    let detailPostSeen = false;

    page.on('request', (req) => {
      if (
        req.method() === 'POST' &&
        req.url().includes('/platform/invoices/non-existent-id')
      ) {
        detailPostSeen = true;
      }
    });

    await page.goto('/platform/invoices/non-existent-id');
    await waitForAppReady(page);

    await expect.poll(() => detailPostSeen).toBeTruthy();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('platform merchants list renders search and table shell', async ({ page }) => {
    await page.goto('/platform/merchants');
    await waitForAppReady(page);

    await expect(page.getByRole('main').getByText('Merchants', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(/Search merchants/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Search/i })).toBeVisible();
    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
  });

  test('platform customers list and create flow render core controls', async ({ page }) => {
    await page.goto('/platform/customers');
    await waitForAppReady(page);

    await expect(page.getByRole('main').getByText('Customers', { exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /Create Customer/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search customers/i)).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: /Create Customer/i }).click();
    await expect(page).toHaveURL(/.*\/platform\/customers\/create/);

    await expect(page.getByLabel(/Login ID/i)).toBeVisible();
    await expect(page.getByLabel(/Merchant ID/i)).toBeVisible();
    await expect(page.getByLabel(/First Name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Create Customer$/i })).toBeVisible();
  });

  test('invoices search action triggers client request path', async ({ page }) => {
    const getCount = trackClientRequests(page);
    await page.goto('/platform/invoices');
    await waitForAppReady(page);

    const before = getCount();
    await page.getByPlaceholder(/Search by number or title/i).fill('invoice-e2e-query');
    await page.getByRole('button', { name: /Search/i }).click();

    await expect.poll(() => getCount()).toBeGreaterThan(before);
  });

  test('merchants search action triggers client request path', async ({ page }) => {
    const getCount = trackClientRequests(page);
    await page.goto('/platform/merchants');
    await waitForAppReady(page);

    const before = getCount();
    await page.getByPlaceholder(/Search merchants/i).fill('merchant-e2e-query');
    await page.getByRole('button', { name: /Search/i }).click();

    await expect.poll(() => getCount()).toBeGreaterThan(before);
  });

  test('invoice create validates required fields on submit', async ({ page }) => {
    await page.goto('/platform/invoices/create');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /^Create Invoice$/i }).click();

    await expect(page.getByText(/Login ID is required/i)).toBeVisible();
    await expect(page.getByText(/Merchant is required/i)).toBeVisible();
    await expect(page.getByText(/Invoice number is required/i)).toBeVisible();
  });

  test('customer create submit triggers request path with minimal payload', async ({ page }) => {
    const getCount = trackClientRequests(page);
    await page.goto('/platform/customers/create');
    await waitForAppReady(page);

    await page.getByLabel(/Login ID/i).fill('e2e-login');
    await page.getByLabel(/Merchant ID/i).fill('e2e-merchant');

    const before = getCount();
    await page.getByRole('button', { name: /^Create Customer$/i }).click();

    await expect.poll(() => getCount()).toBeGreaterThan(before);
  });

  // Issue #159 - E2E coverage tests

  test('platform transactions list renders search and table shell', async ({ page }) => {
    await page.goto('/platform/transactions');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { name: /Transactions/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search by transaction ID/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Search/i })).toBeVisible();
    // Table headers
    await expect(page.getByRole('columnheader', { name: /Amount/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('platform transaction detail route renders page shell', async ({ page }) => {
    // Skip if no transactions exist - just test the route loads
    await page.goto('/platform/transactions');
    await waitForAppReady(page);

    // Check if there are any transaction rows
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // Click first row to navigate to detail
      await rows.first().click();
      await expect(page).toHaveURL(/\/platform\/transactions\//);
    } else {
      // No transactions - test with a placeholder ID
      await page.goto('/platform/transactions/t1_test_placeholder');
      await waitForAppReady(page);
    }

    // Should show detail UI or back navigation
    await expect(page.getByRole('link', { name: /Back/i })).toBeVisible();
  });

  test('platform merchants list renders Name Status Email columns', async ({ page }) => {
    await page.goto('/platform/merchants');
    await waitForAppReady(page);

    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Email/i })).toBeVisible();
  });

  test('alerts create modal enables Create without event types when no webhook URL', async ({ page }) => {
    await page.goto('/platform/alerts');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Create Alert/i }).click();
    
    // Wait for modal to be fully visible
    await expect(page.getByLabel(/Login ID/i)).toBeVisible();

    // Button should be disabled until login + name filled
    const createBtn = page.getByRole('button', { name: /^Create$/i });
    await expect(createBtn).toBeDisabled();

    await page.getByLabel(/Login ID/i).fill('t1_log_123');
    await page.getByLabel(/Alert Name/i).fill('Test Alert');

    // Button should now be enabled (no webhook URL = no events required)
    await expect(createBtn).toBeEnabled();
  });

  test('alerts create modal requires event types when webhook URL is provided', async ({ page }) => {
    await page.goto('/platform/alerts');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Create Alert/i }).click();

    const createBtn = page.getByRole('button', { name: /^Create$/i });
    await page.getByLabel(/Login ID/i).fill('t1_log_123');
    await page.getByLabel(/Alert Name/i).fill('Test Alert');
    // Use real dev webhook URL
    const devWebhookUrl = 'https://payrix-api-tester-dev-903828198190.us-central1.run.app/api/webhooks/payrix';
    await page.getByLabel(/Webhook URL/i).fill(devWebhookUrl);

    // Button should be disabled when webhook URL present but no events selected
    await expect(createBtn).toBeDisabled();
  });

  // Full webhook flow test - skipped because invoice creation requires merchant data
  test.skip('create invoice and verify webhook received in monitor', async ({ page }) => {
    // This test requires:
    // 1. Merchant with valid mid/credentials (not available in test env)
    // 2. Creating a valid invoice (requires 3-step API flow - Issue #161)
    // 3. Waiting for webhook to be received by the monitor endpoint
    
    // For now, just verify the monitor page exists
    await page.goto('/platform/webhooks/monitor');
    await waitForAppReady(page);
    await expect(page.getByRole('heading', { name: /Webhook Monitor/i })).toBeVisible();
  });

  // Webhook E2E tests - full flow
  test('webhook monitor page renders and shows events table', async ({ page }) => {
    await page.goto('/platform/webhooks/monitor');
    await waitForAppReady(page);

    await expect(page.getByRole('heading', { name: /Webhook Monitor/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Timestamp/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Event/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Payload/i })).toBeVisible();
  });

  // Skip if no real API key is configured
  test('create alert with webhook URL and invoice event', async ({ page }) => {
    // Check if we have a real API key (not the placeholder)
    const hasRealApiKey = await page.evaluate(() => {
      const config = localStorage.getItem('payrix_config');
      if (!config) return false;
      const parsed = JSON.parse(config);
      return parsed.platformApiKey && parsed.platformApiKey !== 'e2e-platform-key';
    });
    
    if (!hasRealApiKey) {
      // Just verify the form opens and has required fields - don't try to submit
      await page.goto('/platform/alerts');
      await waitForAppReady(page);
      await page.getByRole('button', { name: /Create Alert/i }).click();
      await expect(page.getByLabel(/Login ID/i)).toBeVisible();
      return;
    }

    // Real API key available - run the full test
    await page.goto('/platform/alerts');
    await waitForAppReady(page);

    await page.getByRole('button', { name: /Create Alert/i }).click();
    
    // Wait for modal to be fully visible
    await expect(page.getByLabel(/Login ID/i)).toBeVisible();

    // Fill in required fields - use real dev webhook URL
    const devWebhookUrl = 'https://payrix-api-tester-dev-903828198190.us-central1.run.app/api/webhooks/payrix';
    await page.getByLabel(/Login ID/i).fill('t1_log_6927fb9719a2e103bd075a9');
    await page.getByLabel(/Alert Name/i).fill('E2E Test Alert');
    await page.getByLabel(/Webhook URL/i).fill(devWebhookUrl);

    // Select invoice.paid event type
    await page.getByLabel(/invoice.paid/i).check();

    // Submit
    await page.getByRole('button', { name: /^Create$/i }).click();

    // Should see success message or the alert in the list
    await expect(page.getByText(/success/i).or(page.getByText('E2E Test Alert'))).toBeVisible();
  });
});
