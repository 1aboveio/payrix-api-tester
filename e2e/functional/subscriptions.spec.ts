import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: Subscriptions and Plans
 * 
 * Simplified to verify page loads without 404.
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

  test('/platform/subscriptions list renders', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

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

  test('/platform/plans list renders', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

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
});