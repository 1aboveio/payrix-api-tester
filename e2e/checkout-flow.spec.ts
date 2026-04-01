import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from './utils/test-data';

/**
 * Smoke Tests for Checkout Feature
 * 
 * Basic tests that verify checkout routes load without crashing.
 * For full integration tests with real API data, see checkout-real-api.spec.ts
 * 
 * RULE: Never assert only `body` is visible. Every test must have at least one
 * assertion that distinguishes a working page from an error page.
 */

test.describe('Checkout Flow - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedConfig(page, TEST_DATA.validCredentials);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('checkout page route exists for invoice parameter', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Assert NO error alert visible (distinguishes working page from broken)
    await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 8000 });
    
    // Should show checkout heading
    await expect(page.locator('h1:has-text("Checkout"), text=Checkout').first()).toBeVisible();
  });

  test('checkout page route exists for subscription parameter', async ({ page }) => {
    await page.goto('/checkout?subscriptionId=test123');
    await waitForAppReady(page);

    // Assert NO error alert visible
    await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 8000 });
    
    // Should show checkout heading
    await expect(page.locator('h1:has-text("Checkout"), text=Checkout').first()).toBeVisible();
  });

  test('checkout page route exists without parameters', async ({ page }) => {
    await page.goto('/checkout');
    await waitForAppReady(page);

    // Without parameters, should show error alert
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=/not configured|No invoice|No subscription|error/i').first()).toBeVisible();
  });

  test('confirmation page route exists', async ({ page }) => {
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Assert NO error alert visible
    await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 8000 });
    
    // Should show confirmation content (heading or status)
    const hasConfirmationContent = await page.locator(
      'h1:has-text("Confirmation"), text=Confirmation, text=Payment, text=Success, text=Status'
    ).first().isVisible().catch(() => false);
    
    expect(hasConfirmationContent).toBeTruthy();
  });
});
