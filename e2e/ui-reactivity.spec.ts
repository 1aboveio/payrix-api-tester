import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';

test.describe('UI Reactivity', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('cURL preview updates when parameters change', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Get initial cURL preview
    // Click cURL tab (default is JSON)
    await page.getByRole('tab', { name: /cURL/i }).click();

    const initialCurl = await page.getByText(/curl.*api\/v1\/sale/i).first();
    await expect(initialCurl).toBeVisible();
    const initialText = await initialCurl.textContent();
    
    // Fill in lane ID
    await page.getByLabel(/Lane ID/i).fill('TEST-LANE-123');
    
    // Fill in amount
    await page.getByLabel(/Transaction Amount/i).fill('25.50');
    
    // Verify cURL preview updated (blur the field to trigger update)
    await page.getByLabel(/Transaction Amount/i).blur();
    
    // Check that cURL preview reflects the changes
    // The preview should now contain the lane ID or amount
    const updatedCurl = await page.getByText(/curl.*api\/v1\/sale/i).first();
    const updatedText = await updatedCurl.textContent();
    
    // cURL should have changed after filling form
    expect(updatedText).not.toEqual(initialText);
  });

  test('saved settings reflected in form defaults and cURL', async ({ page }) => {
    // Step 1: Save settings
    await page.goto('/settings');
    await waitForAppReady(page);
    
    const testLaneId = 'SAVED-LANE-999';
    const testAcceptorId = 'saved-acceptor-123';

    await page.getByLabel(/Acceptor ID/i).fill(testAcceptorId);
    await page.getByLabel(/Account ID/i).fill(TEST_DATA.validCredentials.accountId);
    await page.getByLabel(/Account Token/i).fill(TEST_DATA.validCredentials.accountToken);
    await page.getByLabel(/Default Lane ID/i).fill(testLaneId);
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Step 2: Navigate to sale and verify defaults
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Verify lane ID is pre-filled with saved value
    const laneIdValue = await page.getByLabel(/Lane ID/i).inputValue();
    expect(laneIdValue).toBe(testLaneId);
    
    // Step 3: Verify cURL preview shows saved config
    // Click cURL tab (default is JSON)
    await page.getByRole('tab', { name: /cURL/i }).click();

    const curlPreview = await page.getByText(/curl.*api\/v1\/sale/i).first();
    await expect(curlPreview).toBeVisible();
    const curlText = await curlPreview.textContent();
    
    // cURL should include the API endpoint
    expect(curlText).toContain('/api/v1/sale');
  });

  test('cURL preview updates when tip configuration changes', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Fill basic fields first
    await page.getByLabel(/Lane ID/i).fill('LANE-001');
    await page.getByLabel(/Transaction Amount/i).fill('10.00');
    
    // Get cURL before tip config
    // Click cURL tab (default is JSON)
    await page.getByRole('tab', { name: /cURL/i }).click();

    const curlBefore = await page.getByText(/curl.*api\/v1\/sale/i).first();
    const textBefore = await curlBefore.textContent();
    
    // Change tip mode to preset
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /Pre-set Tip/i }).click();
    
    // Fill tip amount
    await page.getByLabel(/Tip Amount/i).fill('2.00');
    await page.getByLabel(/Tip Amount/i).blur();
    
    // Verify cURL changed
    const curlAfter = await page.getByText(/curl.*api\/v1\/sale/i).first();
    const textAfter = await curlAfter.textContent();
    
    // The cURL should reflect the tip amount change
    expect(textAfter).not.toEqual(textBefore);
  });

  test('form reset restores defaults from settings', async ({ page }) => {
    // Save default lane in settings
    await page.goto('/settings');
    await waitForAppReady(page);
    await page.getByLabel(/Acceptor ID/i).fill(TEST_DATA.validCredentials.acceptorId);
    await page.getByLabel(/Account ID/i).fill(TEST_DATA.validCredentials.accountId);
    await page.getByLabel(/Account Token/i).fill(TEST_DATA.validCredentials.accountToken);
    await page.getByLabel(/Default Lane ID/i).fill('DEFAULT-LANE-007');
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Go to sale page and change the lane
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    await page.getByLabel(/Lane ID/i).fill('CHANGED-LANE-999');
    
    // Click reset
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    
    // Verify lane ID is restored to default
    const laneIdValue = await page.getByLabel(/Lane ID/i).inputValue();
    expect(laneIdValue).toBe('DEFAULT-LANE-007');
  });
});
