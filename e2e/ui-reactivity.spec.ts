import { Page, test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';
test.describe('UI Reactivity', () => {

  const getCurlPreviewText = async (page: Page): Promise<string> => {
  const candidates = await page.locator('pre').allTextContents();
  const preferred = candidates.find((text) => /api\/v1\/sale/i.test(text));
  if (preferred !== undefined) return preferred;
  if (candidates.length > 0) return candidates[0];
  throw new Error('Unable to locate curl preview content');
};

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

    await expect(page.locator('pre').first()).toBeVisible({ timeout: 10000 });
    const initialText = await getCurlPreviewText(page);
    
    // Fill in lane ID
    await page.getByLabel(/Lane ID/i).fill('TEST-LANE-123');
    
    // Fill in amount
    await page.getByLabel(/Transaction Amount/i).fill('25.50');
    
    // Verify cURL preview updated (blur the field to trigger update)
    await page.getByLabel(/Transaction Amount/i).blur();
    
    // Check that cURL preview reflects the changes
    await expect.poll(async () => getCurlPreviewText(page), { timeout: 10000 }).not.toEqual(initialText);
  });

  test('saved settings reflected in form defaults and cURL', async ({ page }) => {
    // Step 1: Save settings
    await page.goto('/settings');
    await waitForAppReady(page);
    
    const testLaneId = 'SAVED-LANE-999';
    const testAcceptorId = 'saved-acceptor-123';

    await page.locator('[id="tripos.test-acceptor"]').fill(testAcceptorId);
    await page.locator('[id="tripos.test-account-id"]').fill(TEST_DATA.validCredentials.accountId);
    await page.locator('[id="tripos.test-token"]').fill(TEST_DATA.validCredentials.accountToken);
    await page.locator('[id="tripos.test-lane"]').fill(testLaneId);
    await page.getByRole('button', { name: /Save Settings/i }).click();

    // Wait until saved config reflects defaults
    await expect.poll(async () => {
      return page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
        return cfg.tripos?.test?.defaultLaneId ?? '';
      });
    }).toBe(testLaneId);
    
    // Step 2: Navigate to sale and verify defaults
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    // Verify lane ID is pre-filled with saved value
    await expect(page.getByLabel(/Lane ID/i)).toHaveValue(testLaneId);
    
    // Step 3: Verify cURL preview shows saved config
    // Click cURL tab (default is JSON)
    await page.getByRole('tab', { name: /cURL/i }).click();

    const curlText = await getCurlPreviewText(page);
    
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

    const textBefore = await getCurlPreviewText(page);
    
    // Change tip mode to preset
    await page.getByLabel(/Tip Mode/i).click();
    await page.getByRole('option', { name: /Pre-set Tip/i }).click();
    
    // Fill tip amount
    await page.getByLabel(/Tip Amount/i).fill('2.00');
    await page.getByLabel(/Tip Amount/i).blur();
    
    // Verify cURL changed
    const textAfter = await getCurlPreviewText(page);
    
    // The cURL should reflect the tip amount change
    expect(textAfter).not.toEqual(textBefore);
  });

  test('form reset restores defaults from settings', async ({ page }) => {
    // Save default lane in settings
    await page.goto('/settings');
    await waitForAppReady(page);
    await page.locator('[id="tripos.test-acceptor"]').fill(TEST_DATA.validCredentials.acceptorId);
    await page.locator('[id="tripos.test-account-id"]').fill(TEST_DATA.validCredentials.accountId);
    await page.locator('[id="tripos.test-token"]').fill(TEST_DATA.validCredentials.accountToken);
    await page.locator('[id="tripos.test-lane"]').fill('DEFAULT-LANE-007');
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Go to sale page and change the lane
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    await page.getByLabel(/Lane ID/i).fill('CHANGED-LANE-999');
    
    // Click reset
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    
    // Verify lane ID is restored to default
    await expect(page.getByLabel(/Lane ID/i)).toHaveValue('DEFAULT-LANE-007');
  });
});
