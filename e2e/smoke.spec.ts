import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/test-data';

test.describe('Smoke Tests', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    await expect(page).toHaveTitle(/Payrix API Tester/);
    await expect(page.getByText('Payrix API Tester')).toBeVisible();
  });

  test('app shell renders navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check main navigation sections
    await expect(page.getByText(/Transactions/i)).toBeVisible();
    await expect(page.getByText(/Reversals/i)).toBeVisible();
    await expect(page.getByText(/Utility/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });

  test('navigation to sale page works', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    await page.getByRole('link', { name: /Sale/i }).click();
    await expect(page).toHaveURL(/.*sale/);
    await expect(page.getByText(/Sale/i).first()).toBeVisible();
  });

  test('navigation to settings page works', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
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
    
    await expect(page.getByText(/Environment/i)).toBeVisible();
    await expect(page.getByText(/Express Credentials/i)).toBeVisible();
  });

  test('lanes page loads', async ({ page }) => {
    await page.goto('/lanes');
    await waitForAppReady(page);
    
    await expect(page.getByText(/Lanes/i).first()).toBeVisible();
  });
});
test.describe('Error Handling', () => {
  test('404 page handles unknown routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Next.js returns 404 status while keeping the URL
    expect(response?.status()).toBe(404);
  });
});
