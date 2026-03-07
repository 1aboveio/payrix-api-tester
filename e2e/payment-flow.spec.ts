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
    
    // Wait for post-submit response signal (not static pre-submit text)
    await expect(page.getByRole('button', { name: /Save to History|Saved to History/i })).toBeVisible({ timeout: 15000 });

    // Verify response placeholder is replaced after execution
    await expect(page.getByText('Execute request to view response.')).not.toBeVisible();
  });

  test('sale form validates required fields', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
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
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    
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

    // Wait for hydrated defaults to land before filling (container race)
    await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_DATA.transaction.laneId, { timeout: 10000 });

    const paymentAccountInput = page.getByLabel(/Payment Account ID/i);
    await paymentAccountInput.waitFor({ state: 'visible' });
    await paymentAccountInput.fill('PAY-REFUND-TEST');
    await page.getByLabel(/Transaction Amount/i).fill('5.00');

    // Verify form is fillable
    await expect(paymentAccountInput).toHaveValue('PAY-REFUND-TEST');
  });

  test('query form accepts terminal ID', async ({ page }) => {
    await page.goto('/transactions/query');
    await waitForAppReady(page);
    
    await page.getByLabel(/Terminal ID/i).fill(TEST_DATA.transaction.terminalId);
    
    await expect(page.getByLabel(/Terminal ID/i)).toHaveValue(TEST_DATA.transaction.terminalId);
  });

  test('tip configuration options work', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    // Select preset tip mode (same pattern as ui-reactivity.spec.ts)
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /Pre-set Tip/i }).click();

    // Tip amount field should appear
    await expect(page.getByLabel(/Tip Amount/i)).toBeVisible({ timeout: 10000 });

    // Fill tip amount
    await page.getByLabel(/Tip Amount/i).fill('2.00');

    // Change to PIN Pad mode
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /PIN Pad Tip Prompt/i }).click();

    // Tip options field should appear
    await expect(page.getByLabel(/Tip Options/i)).toBeVisible({ timeout: 10000 });
  });


});
