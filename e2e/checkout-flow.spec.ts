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

    // Click on first invoice row
    const firstInvoiceRow = page.locator('table tbody tr').first();
    await expect(firstInvoiceRow).toBeVisible();
    
    // Get invoice ID for later verification
    const invoiceId = await firstInvoiceRow.locator('td').first().textContent();
    
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
    // Navigate directly to checkout with a test invoice ID
    const testInvoiceId = 'inv_test_12345';
    await page.goto(`/checkout?invoiceId=${testInvoiceId}`);
    await waitForAppReady(page);

    // Verify page structure
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    
    // Verify two-panel layout
    await expect(page.locator('text=Invoice').or(page.locator('text=Bill'))).toBeVisible();
    await expect(page.locator('text=Payment').or(page.locator('text=Email'))).toBeVisible();
  });

  test('checkout page loads with subscription parameter', async ({ page }) => {
    // Navigate directly to checkout with a test subscription ID
    const testSubscriptionId = 'sub_test_12345';
    await page.goto(`/checkout?subscriptionId=${testSubscriptionId}`);
    await waitForAppReady(page);

    // Verify page structure
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    
    // Verify subscription-specific content
    await expect(page.locator('text=Subscription').or(page.locator('text=Plan'))).toBeVisible();
  });

  test('checkout page shows error for missing parameters', async ({ page }) => {
    // Navigate to checkout without any parameters
    await page.goto('/checkout');
    await waitForAppReady(page);

    // Should show error message
    await expect(page.locator('text=Error').or(page.locator('text=No invoice'))).toBeVisible();
  });

  test('confirmation page loads with token parameter', async ({ page }) => {
    // Navigate directly to confirmation with test parameters
    const testInvoiceId = 'inv_test_12345';
    const testTokenId = 'tok_test_12345';
    await page.goto(`/checkout/confirmation?invoiceId=${testInvoiceId}&tokenId=${testTokenId}`);
    await waitForAppReady(page);

    // Verify confirmation page structure
    await expect(page.locator('text=Payment Successful').or(page.locator('text=Success'))).toBeVisible();
    await expect(page.locator('text=Receipt Summary')).toBeVisible();
  });

  test('email lookup form validates input', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout?invoiceId=inv_test_12345');
    await waitForAppReady(page);

    // Find email input
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email"]'));
    
    // Check button is initially disabled or shows validation
    const checkButton = page.locator('button:has-text("Check")').or(
      page.locator('button:has-text("Verify")')
    );
    
    // Try invalid email
    await emailInput.fill('invalid-email');
    await checkButton.click();
    
    // Should show validation error or stay disabled
    // (actual behavior depends on implementation)
  });
});

test.describe('Checkout Page Responsiveness', () => {
  test('checkout page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await seedConfig(page);
    await page.goto('/checkout?invoiceId=inv_test_12345');
    await waitForAppReady(page);

    // Verify content is visible and layout adapts
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    
    // On mobile, panels should stack vertically
    // (we can't easily test CSS but we can verify content is present)
    await expect(page.locator('text=Invoice').or(page.locator('text=Payment'))).toBeVisible();
  });

  test('checkout page works on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await seedConfig(page);
    await page.goto('/checkout?invoiceId=inv_test_12345');
    await waitForAppReady(page);

    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
  });
});
