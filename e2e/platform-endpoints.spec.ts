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
    await expect(page.getByText(/Select merchant/i)).toBeVisible();
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
});
