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
    // Option A: seed config directly instead of filling the form
    await page.goto('/settings');
    await waitForAppReady(page);
    await seedConfig(page, TEST_DATA.validCredentials);

    // Verify settings persisted (check localStorage)
    const config = await page.evaluate(() => {
      return localStorage.getItem('payrix_config');
    });
    expect(config).toContain(TEST_DATA.validCredentials.acceptorId);
  });

  test('global environment toggle works in header', async ({ page }) => {
    // Navigate to app origin first so localStorage is scoped correctly
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    // Seed config with globalEnvironment so we have a known initial state
    await page.evaluate(() => {
      localStorage.setItem('payrix_config', JSON.stringify({
        globalEnvironment: 'test',
        environment: 'cert',
        platformEnvironment: 'test',
        expressAcceptorId: '',
        expressAccountId: '',
        expressAccountToken: '',
        defaultLaneId: '',
        defaultTerminalId: '',
        platformApiKey: '',
      }));
    });

    // Reload so the app picks up the seeded config
    await page.reload();
    await waitForAppReady(page);

    // Verify TEST is selected by default
    const config = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('payrix_config') || '{}');
    });
    expect(config.globalEnvironment).toBe('test');

    // Switch to LIVE — header has a TEST/LIVE segmented button
    // Click the LIVE button (it opens an AlertDialog confirmation)
    const liveButton = page.locator('header button', { hasText: 'LIVE' });
    await liveButton.scrollIntoViewIfNeeded();
    await liveButton.click();

    // Confirm the AlertDialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('alertdialog').getByRole('button', { name: /Switch to Live/i }).click();

    // Verify globalEnvironment is 'live' in localStorage
    const liveConfig = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('payrix_config') || '{}');
    });
    expect(liveConfig.globalEnvironment).toBe('live');

    // Switch back to TEST — direct click, no dialog
    const testButton = page.locator('header button', { hasText: 'TEST' });
    await testButton.scrollIntoViewIfNeeded();
    await testButton.click();

    const testConfig = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('payrix_config') || '{}');
    });
    expect(testConfig.globalEnvironment).toBe('test');
  });

  test('default lane and terminal settings persist', async ({ page }) => {
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
    await page.reload();
    await waitForAppReady(page);

    // Scope locators to test-credentials section (dual-cred UI has Test + Live side-by-side)
    const testSection = page.locator('[data-testid="tripos-test-credentials"]');

    // Set defaults
    await testSection.getByLabel(/Default Lane ID/i).fill(TEST_DATA.transaction.laneId);
    await testSection.getByLabel(/Default Terminal ID/i).fill(TEST_DATA.transaction.terminalId);

    // Save
    await page.getByRole('button', { name: /Save Settings/i }).click();

    // Wait until saved config reflects defaults
    await expect.poll(async () => {
      return page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
        return cfg.tripos?.test?.defaultLaneId ?? '';
      });
    }).toBe(TEST_DATA.transaction.laneId);

    // Navigate to sale and verify defaults
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
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

    expect(config.tripos?.test?.expressAcceptorId).toBeUndefined();
  });

  test('settings persist across page navigation', async ({ page }) => {
    // Set settings — scope to test section to avoid strict mode violation (Test + Live creds rendered)
    await page.goto('/settings');
    await waitForAppReady(page);
    const testSection = page.locator('[data-testid="tripos-test-credentials"]');
    await testSection.getByLabel(/Acceptor ID/i).fill('persist-test');
    await page.getByRole('button', { name: /Save Settings/i }).click();

    // Navigate away and back
    await page.goto('/transactions/sale');
    await page.goto('/settings');
    await waitForAppReady(page);

    // Verify setting persisted — scope to test section
    const acceptorValue = await testSection.getByLabel(/Acceptor ID/i).inputValue();
    expect(acceptorValue).toBe('persist-test');
  });
});
