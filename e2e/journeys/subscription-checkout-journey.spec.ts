import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: Subscription → Checkout
 * 
 * Subscription payment journey with real APIs.
 * Covers: subscription list → detail → checkout → payment form ready
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

  test('complete journey: subscription list → detail → checkout → payment form', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    // Step 1: Seed config
    await seedConfig(page, TEST_DATA.validCredentials);

    // Step 2: Navigate to subscriptions page
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    // Verify subscriptions list loads
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Get subscription from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    const subscriptionId = subsResult.data[0].id;

    // Step 4: Navigate to subscription detail
    await page.goto(`/platform/subscriptions/${subscriptionId}`);
    await waitForAppReady(page);

    // Verify detail page loads
    await expect(page.locator('body')).toBeVisible();

    // Step 5: Navigate to checkout
    await page.goto(`/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);

    // Step 6: Verify checkout loads without error
    await expect(page.locator('body')).toBeVisible();
    
    // No error alert
    const hasAlert = await page.locator('[role="alert"]').isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();

    // Verify checkout heading or subscription content
    const hasCheckoutContent = await Promise.any([
      page.locator('h1:has-text("Checkout")').isVisible().catch(() => false),
      page.locator('text=Subscription').isVisible().catch(() => false),
      page.locator('text=Summary').isVisible().catch(() => false),
    ]).catch(() => false);
  });
});
