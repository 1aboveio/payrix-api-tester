import { test, expect } from '@playwright/test';
import { seedConfig, clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';

test.describe('Default Terminal and Lane Pre-fill', () => {
  // seedConfig sets defaultLaneId: '12345', defaultTerminalId: 'TERM-001' in tripos.test
  const TEST_LANE_ID = TEST_DATA.transaction.laneId;
  const TEST_TERMINAL_ID = TEST_DATA.transaction.terminalId;

  test.beforeEach(async ({ page }) => {
    // Use seedConfig to set defaults via localStorage — dual-cred UI (Test + Live sections)
    // makes getByLabel(/Default Lane ID/i) ambiguous (matches 2 elements).
    await clearTestData(page);
    await page.goto('/settings');
    await waitForAppReady(page);
    await seedConfig(page, TEST_DATA.validCredentials);
    await page.reload();
    await waitForAppReady(page);

    // Verify seed applied
    await expect.poll(async () => {
      return page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
        return cfg.tripos?.test?.defaultLaneId ?? '';
      });
    }).toBe(TEST_LANE_ID);
  });

  test.describe('Transaction Forms', () => {
    test('Sale form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/sale');
      await waitForAppReady(page);
      await expect(page.locator('#laneId')).toHaveValue(TEST_LANE_ID, { timeout: 10000 });
    });

    test('Authorization form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/authorization');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('BIN Query form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/bin-query');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Force form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/force');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Refund form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/refund');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Query form pre-fills terminalId', async ({ page }) => {
      await page.goto('/transactions/query');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Terminal ID/i).first()).toHaveValue(TEST_TERMINAL_ID);
    });
  });

  test.describe('Reversal Forms', () => {
    test('Cancel form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/cancel');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Credit form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/credit');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('Utility Forms', () => {
    test('Input status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/input');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Selection status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/selection');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Signature status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/signature');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Display form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/display');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Idle form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/idle');
      await waitForAppReady(page);
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('Reset Button Behavior', () => {
    test('Reset button reverts to defaults', async ({ page }) => {
      await page.goto('/transactions/sale');
      await waitForAppReady(page);

      // Change values
      await page.locator('#laneId').fill('99999');

      // Click reset
      await page.getByRole('button', { name: 'Reset', exact: true }).click();

      // Should revert to defaults
      await expect(page.locator('#laneId')).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('No Defaults Set', () => {
    test.beforeEach(async ({ page }) => {
      // Seed empty defaults directly via localStorage
      await page.goto('/settings');
      await waitForAppReady(page);
      await page.evaluate(() => {
        const cfg = JSON.parse(localStorage.getItem('payrix_config') || '{}');
        if (cfg.tripos?.test) {
          cfg.tripos.test.defaultLaneId = '';
          cfg.tripos.test.defaultTerminalId = '';
        }
        if (cfg.tripos?.live) {
          cfg.tripos.live.defaultLaneId = '';
          cfg.tripos.live.defaultTerminalId = '';
        }
        localStorage.setItem('payrix_config', JSON.stringify(cfg));
      });
      await page.reload();
      await waitForAppReady(page);

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
