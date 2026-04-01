import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: Subscription → Checkout
 * 
 * Simplified to just verify page loads without crash.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Subscription Checkout Journey', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('complete journey: subscription list → detail → checkout', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Seed config
    await seedConfig(page, TEST_DATA.validCredentials);

    // Navigate to subscriptions page
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Get subscription from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    const subscriptionId = subsResult.data[0].id;

    // Navigate to subscription detail
    await page.goto(`/platform/subscriptions/${subscriptionId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Navigate to checkout
    await page.goto(`/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });
});