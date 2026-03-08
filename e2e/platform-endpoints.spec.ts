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

    const lineItemBoxesBefore = await page.getByText('Item Name *').count();
    await page.getByRole('button', { name: /Add Item/i }).click();
    const lineItemBoxesAfter = await page.getByText('Item Name *').count();
    expect(lineItemBoxesAfter).toBeGreaterThan(lineItemBoxesBefore);

    await expect(page.getByRole('button', { name: /^Create Invoice$/i })).toBeVisible();
  });

  test('platform invoice detail route handles unknown id gracefully', async ({ page }) => {
    await page.goto('/platform/invoices/non-existent-id');
    await waitForAppReady(page);

    await expect(page.getByText(/Invoice not found/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Invoices/i })).toBeVisible();
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
});
