import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/test-data';

test.describe('Smoke Tests', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    await expect(page).toHaveTitle(/Payrix API Tester/);
    await expect(page.getByRole('heading', { name: 'Payrix API Tester' })).toBeVisible();
  });

  test('app shell renders navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check main navigation sections
    await expect(page.getByText('Transactions', { exact: true })).toBeVisible();
    await expect(page.getByText('Reversals', { exact: true })).toBeVisible();
    await expect(page.getByText('Utility', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i }).first()).toBeVisible();
    // Platform navigation - check for actual links like "Sale"
    await expect(page.getByRole('link', { name: /Sale/i }).first()).toBeVisible();
  });

  test('navigation to sale page works', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByRole('link', { name: /Sale/i }).click();
    await expect(page).toHaveURL(/.*sale/);
    // Assert route-unique content, not persistent sidebar labels
    await expect(page.getByRole('button', { name: /Execute Sale/i })).toBeVisible();
    await expect(page.getByLabel(/Transaction Amount/i)).toBeVisible();
  });

  test('navigation to settings page works', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Navigate directly to settings for stability
    await page.goto('/settings');

    // Assert route-unique content
    await expect(page.getByRole('button', { name: /Save Settings/i })).toBeVisible();
    await expect(page.getByText(/Express Credentials/i)).toBeVisible();
  });

  test('sale page has required form elements', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    await expect(page.getByLabel(/Lane ID/i)).toBeVisible();
    await expect(page.getByLabel(/Transaction Amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Execute Sale/i })).toBeVisible();
  });

  test('settings page has configuration sections', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);

    await expect(page.getByRole('button', { name: /Save Settings/i })).toBeVisible();
    await expect(page.getByText(/Express Credentials/i)).toBeVisible();
  });

  test('lanes page loads', async ({ page }) => {
    await page.goto('/lanes');
    await waitForAppReady(page);

    // Assert route-unique content
    await expect(page.getByRole('button', { name: /Execute List Lanes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Execute Get Lane/i })).toBeVisible();
  });

  test('platform invoices page loads', async ({ page }) => {
    await page.goto('/platform/invoices');
    await waitForAppReady(page);

    // Assert route-unique content for Platform Invoices
    await expect(page.getByRole('main').getByText('Invoices', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: /^Create Invoice$/i }).first()
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search by number or title/i)).toBeVisible();
  });
});
test.describe('Error Handling', () => {
  test('404 page handles unknown routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Next.js returns 404 status while keeping the URL
    expect(response?.status()).toBe(404);
  });
});
