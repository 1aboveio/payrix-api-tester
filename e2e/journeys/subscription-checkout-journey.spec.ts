import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 3 Journey Test: Subscription → Detail → Checkout
 *
 * Validates the full subscription payment journey including
 * billing summary, payment methods, and checkout flows.
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

  test('complete journey: subscription list → detail (billing summary + payment methods) → checkout', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    const subscriptionId = subsResult.data[0].id;

    // Step 1: Subscription list
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();

    // Step 2: Subscription detail
    await page.goto(`/platform/subscriptions/${subscriptionId}`);
    await waitForAppReady(page);

    // Verify info card with billing summary
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Subscription Info' })).toBeVisible();
    await expect(page.getByText('Billing Summary')).toBeVisible();
    await expect(page.getByText('Total Periods')).toBeVisible();
    await expect(page.getByText('Next Due')).toBeVisible();

    // Verify payment methods card
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Payment Methods' })).toBeVisible();

    // Verify edit form and payment history
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Subscription Details' })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Payment History' })).toBeVisible();

    // Step 3: Navigate to checkout (Pay & Subscribe)
    await page.goto(`/platform/checkout?subscriptionId=${subscriptionId}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('journey: subscription detail → add new payment (token mode)', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

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

    // Verify "Add New Payment" button exists
    await expect(page.getByRole('link', { name: /Add New Payment/i })).toBeVisible();

    // Navigate to add payment (token mode checkout)
    await page.goto(`/platform/checkout?subscriptionId=${subscriptionId}&mode=token`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
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
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Plan Info' })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Plan Details' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });

  test('journey: create subscription page loads with plan picker', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real Payrix API credentials required');

    await seedConfig(page, TEST_DATA.validCredentials);

    await page.goto('/platform/subscriptions/create');
    await waitForAppReady(page);

    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Create Subscription' })).toBeVisible();
    await expect(page.locator('label:has-text("Plan")').first()).toBeVisible();

    // Wait for plans to load into the dropdown
    await page.waitForTimeout(3000);

    // Click the plan dropdown to verify it has options
    await page.locator('label:has-text("Plan")').first().click();
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
  });
});
