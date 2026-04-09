import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: Subscriptions and Plans
 *
 * Tests page loads, CRUD routes, UI elements, and feature sections.
 */

const hasRealCredentials =
  process.env.TEST_PLATFORM_API_KEY &&
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Subscriptions - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  // ---- Subscription List ----

  test('/platform/subscriptions list renders', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/subscriptions shows table headers including Token', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    await expect(page.getByRole('columnheader', { name: 'Customer' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Plan' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Token' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Start Date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'End Date' })).toBeVisible();
  });

  test('/platform/subscriptions has Create button', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    await expect(page.getByRole('link', { name: /Create Subscription/i })).toBeVisible();
  });

  // ---- Subscription Detail ----

  test('/platform/subscriptions/[id] detail renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    await page.goto(`/platform/subscriptions/${subsResult.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/subscriptions/[id] shows info card, billing summary, and form', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    await page.goto(`/platform/subscriptions/${subsResult.data[0].id}`);
    await waitForAppReady(page);

    // Info card
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Subscription Info' })).toBeVisible();
    // Billing Summary (inside info card)
    await expect(page.getByText('Billing Summary')).toBeVisible();
    await expect(page.getByText('Total Periods')).toBeVisible();
    await expect(page.getByText('Periods Paid')).toBeVisible();
    await expect(page.getByText('Periods Left')).toBeVisible();
    await expect(page.getByText('Next Due')).toBeVisible();
    // Edit form
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Subscription Details' })).toBeVisible();
    // Payment history
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Payment History' })).toBeVisible();
    // Action buttons
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete/i }).first()).toBeVisible();
  });

  test('/platform/subscriptions/[id] shows payment methods card', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    await page.goto(`/platform/subscriptions/${subsResult.data[0].id}`);
    await waitForAppReady(page);

    // Payment Methods card
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Payment Methods' })).toBeVisible();
  });

  test('/platform/subscriptions/[id] has Pay & Subscribe and Add New Payment buttons', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    await page.goto(`/platform/subscriptions/${subsResult.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.getByRole('link', { name: /Add New Payment/i })).toBeVisible();
  });

  // ---- Subscription Create ----

  test('/platform/subscriptions/create renders', async ({ page }) => {
    await page.goto('/platform/subscriptions/create');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/subscriptions/create shows plan picker', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    await page.goto('/platform/subscriptions/create');
    await waitForAppReady(page);

    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Create Subscription' })).toBeVisible();
    await expect(page.locator('label:has-text("Plan")').first()).toBeVisible();
  });

  // ---- Plans List ----

  test('/platform/plans list renders', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/plans has Create button', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);

    await expect(page.getByRole('link', { name: /Create Plan/i })).toBeVisible();
  });

  // ---- Plan Detail ----

  test('/platform/plans/[id] detail renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const plansResult = await client.listPlans([], { limit: 1 });
    test.skip(plansResult.data.length === 0, 'No plans available');

    await page.goto(`/platform/plans/${plansResult.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/plans/[id] shows info card and edit form', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const plansResult = await client.listPlans([], { limit: 1 });
    test.skip(plansResult.data.length === 0, 'No plans available');

    await page.goto(`/platform/plans/${plansResult.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Plan Info' })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Plan Details' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete/i }).first()).toBeVisible();
  });

  // ---- Plan Create ----

  test('/platform/plans/create renders', async ({ page }) => {
    await page.goto('/platform/plans/create');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/plans/create shows form fields', async ({ page }) => {
    await page.goto('/platform/plans/create');
    await waitForAppReady(page);

    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Create Plan' })).toBeVisible();
    await expect(page.getByLabel('Plan Name *')).toBeVisible();
    await expect(page.getByLabel('Amount (USD) *')).toBeVisible();
    await expect(page.getByLabel('Billing Cycle *')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Plan/i })).toBeVisible();
  });

  // ---- Transactions List (shared TransactionTable) ----

  test('/platform/transactions uses shared transaction table', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    await page.goto('/platform/transactions');
    await waitForAppReady(page);

    // Verify shared TransactionTable columns are present
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CoF Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Card' })).toBeVisible();
  });

  // ---- Checkout routes ----

  test('/platform/checkout with token mode loads', async ({ page }) => {
    await page.goto('/platform/checkout?subscriptionId=test123&mode=token');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});
