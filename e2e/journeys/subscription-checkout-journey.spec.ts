import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: Subscription → Detail → Checkout
 *
 * Validates the full subscription payment journey.
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

    // Verify detail page elements
    await expect(page.getByText('Subscription Info')).toBeVisible();
    await expect(page.getByText('Payment History')).toBeVisible();

    // Navigate to checkout
    await page.goto(`/platform/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Verify checkout page loaded (should show heading or error, not 404)
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('journey: plan list → plan detail → back to plans', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const plansResult = await client.listPlans([], { limit: 1 });
    test.skip(plansResult.data.length === 0, 'No plans available');

    // Plans list
    await page.goto('/platform/plans');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Plan detail (editable)
    await page.goto(`/platform/plans/${plansResult.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.getByText('Plan Info')).toBeVisible();
    await expect(page.getByText('Plan Details')).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });

  test('journey: create subscription page loads with plan picker', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/platform/subscriptions/create');
    await waitForAppReady(page);

    await expect(page.getByText('Create Subscription')).toBeVisible();
    await expect(page.getByLabel('Plan *')).toBeVisible();

    // Wait for plans to load into the dropdown
    await page.waitForTimeout(3000);

    // Click the plan dropdown to verify it has options
    await page.getByLabel('Plan *').click();
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
  });
});
