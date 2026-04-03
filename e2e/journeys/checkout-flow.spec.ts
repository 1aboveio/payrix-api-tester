import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('email step renders and validates', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123');
    
    // Email step should be visible
    await expect(page.getByText('Enter Your Details')).toBeVisible();
    await expect(page.getByLabel('Email Address *')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    
    // Continue button should be disabled without email
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeDisabled();
    
    // Enter email and continue
    await page.getByLabel('Email Address *').fill('test@example.com');
    await expect(continueBtn).toBeEnabled();
  });

  test('payment form shows after email step', async ({ page }) => {
    await page.goto('/checkout?invoiceId=test-123');
    
    // Fill email and continue
    await page.getByLabel('Email Address *').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Payment form should be visible (or loading state)
    await expect(page.getByText('Back to email')).toBeVisible();
  });

  test('handles missing parameters', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should show error for missing invoice/subscription
    await expect(page.getByText('Error')).toBeVisible();
    await expect(page.getByText('No invoice or subscription ID provided')).toBeVisible();
  });
});
