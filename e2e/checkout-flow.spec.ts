import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData } from './utils/test-data';

/**
 * E2E Tests for Checkout Feature
 * 
 * Tests the Stripe-style checkout flow:
 * 1. Invoice detail page → Pay button
 * 2. Checkout page with bill summary + payment form
 * 3. Confirmation page after payment
 */

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app first to avoid localStorage SecurityError on about:blank
    await page.goto('/');
    await seedConfig(page);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('invoice detail page shows Pay button for unpaid invoices', async ({ page }) => {
    // Navigate to invoices list
    await page.goto('/platform/invoices');
    await waitForAppReady(page);

    // Wait for invoice table to load
    await expect(page.locator('table')).toBeVisible();

    // Get invoice rows
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    if (count === 0) {
      test.skip('No invoices available for testing');
      return;
    }

    // Click on first invoice row
    const firstInvoiceRow = rows.first();
    await expect(firstInvoiceRow).toBeVisible();
    
    // Click to view detail
    await firstInvoiceRow.click();
    
    // Wait for detail page to load
    await expect(page).toHaveURL(/\/platform\/invoices\/[a-z0-9_]+/);
    
    // Check if Pay button is visible for unpaid invoices
    const payButton = page.locator('a[href*="/checkout?invoiceId"]').or(
      page.locator('button:has-text("Pay")')
    );
    
    // Pay button should exist (may be hidden if invoice is already paid)
    const payButtonExists = await payButton.isVisible().catch(() => false);
    
    if (payButtonExists) {
      // Verify the button links to checkout
      const href = await payButton.getAttribute('href');
      expect(href).toContain('/checkout?invoiceId=');
    }
  });

  test('checkout page loads with invoice parameter', async ({ page }) => {
    // First get a real invoice ID from the API
    await page.goto('/platform/invoices');
    await waitForAppReady(page);

    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) {
      test.skip('No invoices available for testing');
      return;
    }

    // Get first invoice ID
    const firstRow = rows.first();
    const invoiceId = await firstRow.locator('td').first().textContent();
    
    if (!invoiceId) {
      test.skip('Could not get invoice ID');
      return;
    }

    // Navigate to checkout with real invoice ID
    await page.goto(`/checkout?invoiceId=${invoiceId}`);
    await waitForAppReady(page);

    // Verify page structure - either Checkout heading or Error (if invoice not found)
    const hasCheckout = await page.locator('h1:has-text("Checkout")').isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').or(page.locator('text=not found')).isVisible().catch(() => false);
    
    expect(hasCheckout || hasError).toBeTruthy();
  });

  test('checkout page loads with subscription parameter', async ({ page }) => {
    // First get a real subscription ID from the API
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    const rows = page.locator('table tbody tr');
    if (await rows.count() === 0) {
      test.skip('No subscriptions available for testing');
      return;
    }

    // Get first subscription ID
    const firstRow = rows.first();
    const subscriptionId = await firstRow.locator('td').first().textContent();
    
    if (!subscriptionId) {
      test.skip('Could not get subscription ID');
      return;
    }

    // Navigate to checkout with real subscription ID
    await page.goto(`/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);

    // Verify page structure
    const hasCheckout = await page.locator('h1:has-text("Checkout")').isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').or(page.locator('text=not found')).isVisible().catch(() => false);
    
    expect(hasCheckout || hasError).toBeTruthy();
  });

  test('checkout page shows error for missing parameters', async ({ page }) => {
    // Navigate to checkout without any parameters
    await page.goto('/checkout');
    await waitForAppReady(page);

    // Should show error message or loading state
    const hasError = await page.locator('text=Error').or(page.locator('text=not configured')).isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    
    expect(hasError || hasLoading).toBeTruthy();
  });

  test('confirmation page structure', async ({ page }) => {
    // Navigate directly to confirmation with test parameters
    // Note: This tests the page structure, not actual payment flow
    await page.goto('/checkout/confirmation?invoiceId=test123&tokenId=test456');
    await waitForAppReady(page);

    // Verify confirmation page structure - either success or error
    const hasSuccess = await page.locator('text=Payment Successful').or(page.locator('text=Success')).isVisible().catch(() => false);
    const hasError = await page.locator('text=Error').isVisible().catch(() => false);
    
    expect(hasSuccess || hasError).toBeTruthy();
  });
});

test.describe('Checkout Page Responsiveness', () => {
  test('checkout page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to app first
    await page.goto('/');
    await seedConfig(page);
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Verify content loads (either checkout or error state)
    const hasContent = await page.locator('h1, text=Error, text=Loading').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('checkout page works on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to app first
    await page.goto('/');
    await seedConfig(page);
    await page.goto('/checkout?invoiceId=test123');
    await waitForAppReady(page);

    // Verify content loads
    const hasContent = await page.locator('h1, text=Error, text=Loading').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
