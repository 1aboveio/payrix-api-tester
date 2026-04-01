import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady, seedConfig, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 2 Functional Tests: Tokens
 * 
 * Simplified to verify page loads without 404.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Tokens - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('/platform/tokens list renders', async ({ page }) => {
    await page.goto('/platform/tokens');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/tokens/create renders', async ({ page }) => {
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/tokens/[id] detail renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');

    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });

    const result = await client.listTokens([], { limit: 1 });
    test.skip(result.data.length === 0, 'No tokens available');

    await page.goto(`/platform/tokens/${result.data[0].id}`);
    await waitForAppReady(page);

    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });
});