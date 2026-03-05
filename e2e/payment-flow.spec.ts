import { test, expect } from '@playwright/test';
import { seedConfig, clearTestData, waitForAppReady, TEST_DATA, generateTestId } from './utils/test-data';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('sale form submits with valid data', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Fill form
    await page.getByLabel(/Lane ID/i).fill(TEST_DATA.transaction.laneId);
    await page.getByLabel(/Transaction Amount/i).fill(TEST_DATA.transaction.amount);
    await page.getByLabel(/Reference Number/i).fill(generateTestId());
    
    // Submit
    await page.getByRole('button', { name: /Execute Sale/i }).click();
    
    // Wait for result panel to appear
    await expect(page.getByText(/Request Headers/i)).toBeVisible({ timeout: 10000 });
    
    // Verify result panel shows something
    const resultText = await page.getByText(/apiResponse|error|status/i).first();
    await expect(resultText).toBeVisible();
  });

  test('sale form validates required fields', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Try to submit without filling required fields
    const executeButton = page.getByRole('button', { name: /Execute Sale/i });
    
    // Lane ID is required - check for HTML5 validation
    const laneIdInput = page.getByLabel(/Lane ID/i);
    await expect(laneIdInput).toHaveAttribute('required', '');
  });

  test('reset button clears sale form', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Fill form
    await page.getByLabel(/Lane ID/i).fill('99999');
    await page.getByLabel(/Transaction Amount/i).fill('99.99');
    
    // Click reset
    await page.getByRole('button', { name: /Reset/i }).click();
    
    // Verify fields cleared (or reset to defaults)
    const laneIdValue = await page.getByLabel(/Lane ID/i).inputValue();
    expect(laneIdValue).not.toBe('99999');
  });

  test('void page loads with transaction ID from URL', async ({ page }) => {
    const testTransactionId = 'TXN-12345';
    await page.goto(`/reversals/void?transactionId=${testTransactionId}`);
    await waitForAppReady(page);
    
    const transactionIdInput = page.getByLabel(/Transaction ID/i);
    await expect(transactionIdInput).toHaveValue(testTransactionId);
  });

  test('refund form accepts transaction ID', async ({ page }) => {
    await page.goto('/transactions/refund');
    await waitForAppReady(page);
    
    await page.getByLabel(/Original Transaction ID/i).fill('TXN-REFUND-TEST');
    await page.getByLabel(/Lane ID/i).fill(TEST_DATA.transaction.laneId);
    await page.getByLabel(/Refund Amount/i).fill('5.00');
    
    // Verify form is fillable
    const txnIdValue = await page.getByLabel(/Original Transaction ID/i).inputValue();
    expect(txnIdValue).toBe('TXN-REFUND-TEST');
  });

  test('query form accepts terminal ID', async ({ page }) => {
    await page.goto('/transactions/query');
    await waitForAppReady(page);
    
    await page.getByLabel(/Terminal ID/i).fill(TEST_DATA.transaction.terminalId);
    
    const terminalValue = await page.getByLabel(/Terminal ID/i).inputValue();
    expect(terminalValue).toBe(TEST_DATA.transaction.terminalId);
  });

  test('tip configuration options work', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Select preset tip mode
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /Pre-set Tip/i }).click();
    
    // Tip amount field should appear
    await expect(page.getByLabel(/Tip Amount/i)).toBeVisible();
    
    // Fill tip amount
    await page.getByLabel(/Tip Amount/i).fill('2.00');
    
    // Change to PIN Pad mode
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /PIN Pad Tip Prompt/i }).click();
    
    // Tip options field should appear
    await expect(page.getByLabel(/Tip Options/i)).toBeVisible();
  });

  test('lanes page can create new lane', async ({ page }) => {
    await page.goto('/lanes');
    await waitForAppReady(page);
    
    // Click create lane button
    await page.getByRole('button', { name: /Create Lane/i }).click();
    
    // Should navigate to create page
    await expect(page).toHaveURL(/.*create/);
    await expect(page.getByRole('heading', { name: /Create Lane/i })).toBeVisible();
  });
});
