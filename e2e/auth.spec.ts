import { test, expect } from '@playwright/test';
import { seedConfig, clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';

test.describe('Authentication & Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('settings page accepts valid credentials', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Fill in credentials
    await page.getByLabel(/Acceptor ID/i).fill(TEST_DATA.validCredentials.acceptorId);
    await page.getByLabel(/Account ID/i).fill(TEST_DATA.validCredentials.accountId);
    await page.getByLabel(/Account Token/i).fill(TEST_DATA.validCredentials.accountToken);
    
    // Save settings
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Verify settings persisted (check localStorage)
    const config = await page.evaluate(() => {
      return localStorage.getItem('payrix_config');
    });
    
    expect(config).toContain(TEST_DATA.validCredentials.acceptorId);
  });

  test('environment selector works', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Select production environment
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /prod/i }).click();
    
    // Save
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Verify environment was saved
    const config = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('payrix_config') || '{}');
    });
    
    expect(config.environment).toBe('prod');
  });

  test('default lane and terminal settings persist', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Set defaults
    await page.getByLabel(/Default Lane ID/i).fill(TEST_DATA.transaction.laneId);
    await page.getByLabel(/Default Terminal ID/i).fill(TEST_DATA.transaction.terminalId);
    
    // Save
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Navigate to sale and verify defaults
    await page.goto('/transactions/sale');
    await waitForAppReady(page);
    
    const laneIdValue = await page.getByLabel(/Lane ID/i).inputValue();
    expect(laneIdValue).toBe(TEST_DATA.transaction.laneId);
  });

  test('reset to defaults clears custom values', async ({ page }) => {
    // First seed with custom values
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
    await page.reload();
    await waitForAppReady(page);
    
    // Click reset
    await page.getByRole('button', { name: /Reset to Defaults/i }).click();
    
    // Verify config was reset
    const config = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('payrix_config') || '{}');
    });
    
    expect(config.expressAcceptorId).toBe('');
  });

  test('settings persist across page navigation', async ({ page }) => {
    // Set settings
    await page.goto('/settings');
    await waitForAppReady(page);
    await page.getByLabel(/Acceptor ID/i).fill('persist-test');
    await page.getByRole('button', { name: /Save Settings/i }).click();
    
    // Navigate away and back
    await page.goto('/transactions/sale');
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Verify setting persisted
    const acceptorValue = await page.getByLabel(/Acceptor ID/i).inputValue();
    expect(acceptorValue).toBe('persist-test');
  });
});
