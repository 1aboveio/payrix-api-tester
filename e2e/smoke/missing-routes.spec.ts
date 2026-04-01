import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 1 Smoke Tests for Missing Routes
 * 
 * Simplified to verify page loads without 404.
 */

const hasRealCredentials = 
  process.env.TEST_PLATFORM_API_KEY && 
  process.env.TEST_PLATFORM_API_KEY !== 'test-platform-api-key';

test.describe('Missing Routes - Tier 1 Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedConfig(page, TEST_DATA.validCredentials);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  // Lanes routes
  test('/lanes/connection-status renders', async ({ page }) => {
    await page.goto('/lanes/connection-status');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/lanes/create renders', async ({ page }) => {
    await page.goto('/lanes/create');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Platform detail routes with real IDs
  test('/platform/customers/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listCustomers([], { limit: 1 });
    test.skip(result.data.length === 0, 'No customers available');
    
    await page.goto(`/platform/customers/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/platform/merchants/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listMerchants([], { limit: 1 });
    test.skip(result.data.length === 0, 'No merchants available');
    
    await page.goto(`/platform/merchants/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  // Plans routes
  test('/platform/plans renders', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/plans/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listPlans([], { limit: 1 });
    test.skip(result.data.length === 0, 'No plans available');
    
    await page.goto(`/platform/plans/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  // Printer route
  test('/platform/printer renders', async ({ page }) => {
    await page.goto('/platform/printer');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Subscriptions routes
  test('/platform/subscriptions renders', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/subscriptions/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listSubscriptions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No subscriptions available');
    
    await page.goto(`/platform/subscriptions/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  // Terminal transactions routes
  test('/platform/terminal-txns renders', async ({ page }) => {
    await page.goto('/platform/terminal-txns');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/terminal-txns/create renders', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Tokens routes
  test('/platform/tokens renders', async ({ page }) => {
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

  test('/platform/tokens/[id] renders', async ({ page }) => {
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
  });

  // Platform transactions routes
  test('/platform/transactions/create renders', async ({ page }) => {
    await page.goto('/platform/transactions/create');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/platform/transactions/[id]/edit renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listTransactions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No transactions available');
    
    await page.goto(`/platform/transactions/${result.data[0].id}/edit`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  // Receipt route
  test('/receipt renders', async ({ page }) => {
    await page.goto('/receipt');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Transactions routes
  test('/transactions renders', async ({ page }) => {
    await page.goto('/transactions');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/transactions/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listTransactions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No transactions available');
    
    await page.goto(`/transactions/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/transactions/completion renders', async ({ page }) => {
    await page.goto('/transactions/completion');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Utility status routes
  test('/utility/status/host renders', async ({ page }) => {
    await page.goto('/utility/status/host');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  test('/utility/status/tripos renders', async ({ page }) => {
    await page.goto('/utility/status/tripos');
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).not.toContain('404');
  });

  // Webhooks route
  test('/webhooks/[id] renders', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listWebhooks([], { limit: 1 });
    test.skip(result.data.length === 0, 'No webhooks available');
    
    await page.goto(`/webhooks/${result.data[0].id}`);
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });
});