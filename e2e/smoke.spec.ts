import { test, expect } from '@playwright/test';

test.describe('Payrix API Tester', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Payrix/);
    await expect(page.getByText('Payrix API Tester')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Click on Sale
    await page.getByRole('link', { name: /Sale/i }).click();
    await expect(page.getByText('Sale')).toBeVisible();
    
    // Click on Settings
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('sale page has form elements', async ({ page }) => {
    await page.goto('/transactions/sale');
    
    await expect(page.getByLabel(/Lane ID/i)).toBeVisible();
    await expect(page.getByLabel(/Transaction Amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Execute Sale/i })).toBeVisible();
  });

  test('settings page has configuration', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page.getByText(/Environment/i)).toBeVisible();
    await expect(page.getByText(/Application ID/i)).toBeVisible();
  });

  test('lanes page loads', async ({ page }) => {
    await page.goto('/lanes');
    await expect(page.getByText(/Lanes/i)).toBeVisible();
  });

  test('void page loads', async ({ page }) => {
    await page.goto('/reversals/void');
    await expect(page.getByText(/Void/i)).toBeVisible();
  });
});
