import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: Subscriptions and Plans
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

  test('/platform/subscriptions list renders with table shell', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);

    // Verify table shell visible
    await expect(page.locator('table, [role="table"], .table, tbody, thead').first()).toBeVisible();
  });

  test('/platform/subscriptions/[id] — detail renders with subscription info and Pay button', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    // Get real subscription from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const subsResult = await client.listSubscriptions([], { limit: 1 });
    test.skip(subsResult.data.length === 0, 'No subscriptions available');

    const subscriptionId = subsResult.data[0].id;

    await page.goto(`/platform/subscriptions/${subscriptionId}`);
    await waitForAppReady(page);

    // Verify subscription ID visible
    await expect(page.locator(`text=${subscriptionId}`).first()).toBeVisible();
    
    // Verify plan or status visible
    const hasPlanOrStatus = await page.locator('text=plan, text=status, text=active, text=pending').first().isVisible().catch(() => false);
    expect(hasPlanOrStatus).toBeTruthy();
    
    // Verify Pay button visible
    await expect(page.locator('button:has-text("Pay")').first()).toBeVisible();
  });

  test('/platform/plans list renders with table shell', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);

    // Verify table shell visible
    await expect(page.locator('table, [role="table"], .table, tbody, thead').first()).toBeVisible();
  });

  test('/platform/plans/[id] — detail renders with plan info', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    // Get real plan from API
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const plansResult = await client.listPlans([], { limit: 1 });
    test.skip(plansResult.data.length === 0, 'No plans available');

    const planId = plansResult.data[0].id;

    await page.goto(`/platform/plans/${planId}`);
    await waitForAppReady(page);

    // Verify plan ID or name visible
    await expect(page.locator(`text=${planId}`).first()).toBeVisible();
    
    // Verify amount or billing cycle visible
    const hasAmountOrCycle = await page.locator('text=amount, text=$, text=billing, text=cycle, text=month, text=year').first().isVisible().catch(() => false);
    expect(hasAmountOrCycle).toBeTruthy();
  });
});
