import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/test-data';

test.describe('Default Terminal and Lane Pre-fill', () => {
  const TEST_LANE_ID = '12345';
  const TEST_TERMINAL_ID = 'TERM-001';

  test.beforeEach(async ({ page }) => {
    // Navigate to settings and set defaults
    await page.goto('/settings');
    await page.getByLabel(/Default Lane ID/i).fill(TEST_LANE_ID);
    await page.getByLabel(/Default Terminal ID/i).fill(TEST_TERMINAL_ID);
    await page.getByRole('button', { name: /Save/i }).click();
  });

  test.describe('Transaction Forms', () => {
    test('Sale form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/sale');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Authorization form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/authorization');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('BIN Query form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/bin-query');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Force form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/force');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Refund form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/refund');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Query form pre-fills terminalId', async ({ page }) => {
      await page.goto('/transactions/query');
      await expect(page.getByLabel(/Terminal ID/i).first()).toHaveValue(TEST_TERMINAL_ID);
    });
  });

  test.describe('Reversal Forms', () => {
    test('Cancel form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/cancel');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Credit form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/credit');
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
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Idle form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/idle');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('Reset Button Behavior', () => {
    test('Reset button reverts to defaults', async ({ page }) => {
      await page.goto('/transactions/sale');

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
      // Clear defaults
      await page.goto('/settings');
      await page.getByLabel(/Default Lane ID/i).clear();
      await page.getByLabel(/Default Terminal ID/i).clear();
      await page.getByRole('button', { name: /Save/i }).click();
    });

    test('Forms start empty when no defaults set', async ({ page }) => {
      await page.goto('/transactions/sale');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue('');
    });
  });
});
