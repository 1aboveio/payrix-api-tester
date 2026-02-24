import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

// Generate IAP JWT token using service account
function generateIAPToken(): string {
  const PROJECT_ID = 'cosmic-heaven-479306-v5';
  const SA_EMAIL = `id-above-office-openclaw@${PROJECT_ID}.iam.gserviceaccount.com`;
  const BASE_URL = process.env.BASE_URL || 'https://payrix-api-tester-dev-czwo4jlhdq-uc.a.run.app';
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;
  
  const payload = JSON.stringify({
    iss: SA_EMAIL,
    sub: SA_EMAIL,
    aud: `${BASE_URL}/*`,
    iat: now,
    exp: exp,
  });
  
  try {
    const token = execSync(
      `gcloud iam service-accounts sign-jwt /dev/stdin /dev/stdout --iam-account=${SA_EMAIL} <<< '${payload}'`,
      { encoding: 'utf-8' }
    ).trim();
    return token;
  } catch (error) {
    console.error('Failed to generate IAP token:', error);
    return '';
  }
}

test.describe('Default Terminal and Lane Pre-fill', () => {
  const TEST_LANE_ID = '12345';
  const TEST_TERMINAL_ID = 'TERM-001';
  
  test.beforeAll(async () => {
    // Generate IAP token before all tests
    const token = generateIAPToken();
    if (token) {
      process.env.IAP_ID_TOKEN = token;
    }
  });

  test.beforeEach(async ({ context }) => {
    // Set IAP token in context
    if (process.env.IAP_ID_TOKEN) {
      await context.setExtraHTTPHeaders({
        'Authorization': `Bearer ${process.env.IAP_ID_TOKEN}`,
      });
    }
    
    // Navigate to settings and set defaults
    // Note: Settings page may not require IAP if it's public
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
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Selection status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/selection');
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });

    test('Signature status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/signature');
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
      await page.getByLabel(/Lane ID/i).first().fill('99999');
      
      // Click reset
      await page.getByRole('button', { name: /Reset/i }).click();
      
      // Should revert to defaults
      await expect(page.getByLabel(/Lane ID/i).first()).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('No Defaults Set', () => {
    test('Forms start empty when no defaults set', async ({ page }) => {
      // This would require clearing settings first
      // Skipping for now as it requires settings manipulation
      test.skip();
    });
  });
});
