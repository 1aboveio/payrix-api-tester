import { test, expect } from '@playwright/test';
import { seedConfig, clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';

test.describe('Default Terminal and Lane Pre-fill', () => {
  test.beforeEach(async ({ page }) => {
    // Seed config with defaults instead of filling via UI — dual-cred sections
    // (Test + Live) mean getByLabel(/Default Lane ID/i) matches 2 elements
    await clearTestData(page);
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
    await page.reload();
    await waitForAppReady(page);

    // Verify seed applied correctly
    await expect.poll(async () => {
      return page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
        return cfg.tripos?.test?.defaultLaneId ?? '';
      });
    }).toBe(TEST_DATA.transaction.laneId);
  });

  test.describe('Transaction Forms', () => {
    test('Sale form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/sale');
      await waitForAppReady(page);
      await expect(page.locator('#laneId')).toHaveValue(TEST_DATA.transaction.laneId, { timeout: 10000 });
    });

    test('Authorization form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/authorization');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('BIN Query form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/bin-query');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Force form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/force');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Refund form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/refund');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Query form pre-fills terminalId', async ({ page }) => {
      await page.goto('/transactions/query');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Terminal ID/i).first()).toHaveValue(TEST_DATA.transaction.terminalId);
    });
  });

  test.describe('Reversal Forms', () => {
    test('Cancel form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/cancel');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Credit form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/credit');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });
  });

  test.describe('Utility Forms', () => {
    test('Input status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/input');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Selection status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/selection');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Signature status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/signature');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Display form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/display');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });

    test('Idle form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/idle');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_DATA.transaction.laneId);
    });
  });

  test.describe('Reset Button Behavior', () => {
    test('Reset button reverts to defaults', async ({ page }) => {
      await page.goto('/transactions/sale');
      await waitForAppReady(page);

      // Change value
      await page.locator('#laneId').fill('99999');

      // Click reset
      await page.getByRole('button', { name: 'Reset', exact: true }).click();

      // Should revert to defaults
      await expect(page.locator('#laneId')).toHaveValue(TEST_DATA.transaction.laneId);
    });
  });

  test.describe('No Defaults Set', () => {
    test.beforeEach(async ({ page }) => {
      // Clear config so lane/terminal defaults are empty
      await clearTestData(page);
      await page.goto('/settings');
      await waitForAppReady(page);

      // Verify config is empty
      await expect.poll(async () => {
        return page.evaluate(() => {
          const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
          return cfg.tripos?.test?.defaultLaneId ?? '';
        });
      }).toBe('');
    });

    test('Forms start empty when no defaults set', async ({ page }) => {
      await page.goto('/transactions/sale');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue('');
    });
  });
});
