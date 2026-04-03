import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('email step renders and validates', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123&amount=100.00&sessionKey=session-abc');
    
    // Email step should be visible
    await expect(page.getByText('Enter Your Details')).toBeVisible();
    await expect(page.getByLabel('Email Address *')).toBeVisible();
    await expect(page.getByLabel('First Name (optional)')).toBeVisible();
    await expect(page.getByLabel('Last Name (optional)')).toBeVisible();
    
    // Continue button should be disabled without email
    const continueBtn = page.getByRole('button', { name: 'Continue to Payment' });
    await expect(continueBtn).toBeDisabled();
    
    // Enter email and continue
    await page.getByLabel('Email Address *').fill('test@example.com');
    await expect(continueBtn).toBeEnabled();
  });

  test('payment form shows after email step', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123&amount=100.00&sessionKey=session-abc');
    
    // Fill email and continue
    await page.getByLabel('Email Address *').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue to Payment' }).click();
    
    // Payment form should be visible
    await expect(page.getByText('Card Details')).toBeVisible();
    
    // PayFields containers should exist with correct dimensions
    const ccContainer = page.locator('#payFields-ccnumber');
    await expect(ccContainer).toBeVisible();
    await expect(ccContainer).toHaveCSS('width', '300px');
    await expect(ccContainer).toHaveCSS('height', '73px');
  });

  test('pay button shows correct amount', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123&amount=99.99&sessionKey=session-abc');
    
    await page.getByLabel('Email Address *').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue to Payment' }).click();
    
    // Pay button should show correct amount
    await expect(page.getByRole('button', { name: 'Pay $99.99' })).toBeVisible();
  });

  test('handles missing parameters', async ({ page }) => {
    await page.goto('/checkout');
    
    await expect(page.getByText('Invalid Checkout')).toBeVisible();
    await expect(page.getByText('Missing required parameters.')).toBeVisible();
  });
});
