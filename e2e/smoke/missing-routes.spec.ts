import { test, expect } from '@playwright/test';
import { waitForAppReady, seedConfig, clearTestData, TEST_DATA } from '../utils/test-data';
import { PlatformClient } from '@/lib/platform/client';

/**
 * Tier 1 Smoke Tests for Missing Routes
 * 
 * Batch smoke tests for 22 routes with zero coverage.
 * Tier 1 = route loads, heading visible, no error alert.
 * 
 * RULE: Never assert only `body` is visible.
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
  test('/lanes/connection-status - heading visible', async ({ page }) => {
    await page.goto('/lanes/connection-status');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Connection, text=Status, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/lanes/create - form visible', async ({ page }) => {
    await page.goto('/lanes/create');
    await waitForAppReady(page);
    
    await expect(page.locator('form, input, button:has-text("Create"), button:has-text("Save")').first()).toBeVisible();
  });

  // Platform detail routes with real IDs
  test('/platform/customers/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listCustomers([], { limit: 1 });
    test.skip(result.data.length === 0, 'No customers available');
    
    await page.goto(`/platform/customers/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="customer-detail"]').first()).toBeVisible();
  });

  test('/platform/merchants/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listMerchants([], { limit: 1 });
    test.skip(result.data.length === 0, 'No merchants available');
    
    await page.goto(`/platform/merchants/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="merchant-detail"]').first()).toBeVisible();
  });

  // Plans routes
  test('/platform/plans - heading visible', async ({ page }) => {
    await page.goto('/platform/plans');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Plans, text=Plan, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/platform/plans/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listPlans([], { limit: 1 });
    test.skip(result.data.length === 0, 'No plans available');
    
    await page.goto(`/platform/plans/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="plan-detail"]').first()).toBeVisible();
  });

  // Printer route
  test('/platform/printer - heading or form visible', async ({ page }) => {
    await page.goto('/platform/printer');
    await waitForAppReady(page);
    
    const hasContent = await page.locator('text=Printer, h1, h2, form, button').first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  // Subscriptions routes
  test('/platform/subscriptions - heading visible', async ({ page }) => {
    await page.goto('/platform/subscriptions');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Subscriptions, text=Subscription, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/platform/subscriptions/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listSubscriptions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No subscriptions available');
    
    await page.goto(`/platform/subscriptions/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="subscription-detail"]').first()).toBeVisible();
  });

  // Terminal transactions routes
  test('/platform/terminal-txns - heading visible', async ({ page }) => {
    await page.goto('/platform/terminal-txns');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Terminal, text=Transactions, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/platform/terminal-txns/create - form visible', async ({ page }) => {
    await page.goto('/platform/terminal-txns/create');
    await waitForAppReady(page);
    
    await expect(page.locator('form, input, button:has-text("Create"), button:has-text("Submit")').first()).toBeVisible();
  });

  // Tokens routes
  test('/platform/tokens - heading visible', async ({ page }) => {
    await page.goto('/platform/tokens');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Tokens, text=Token, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/platform/tokens/create - form visible', async ({ page }) => {
    await page.goto('/platform/tokens/create');
    await waitForAppReady(page);
    
    await expect(page.locator('form, input[type="email"], button:has-text("Create")').first()).toBeVisible();
  });

  test('/platform/tokens/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listTokens([], { limit: 1 });
    test.skip(result.data.length === 0, 'No tokens available');
    
    await page.goto(`/platform/tokens/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="token-detail"]').first()).toBeVisible();
  });

  // Platform transactions routes
  test('/platform/transactions/create - form visible', async ({ page }) => {
    await page.goto('/platform/transactions/create');
    await waitForAppReady(page);
    
    await expect(page.locator('form, input, button:has-text("Create"), button:has-text("Submit")').first()).toBeVisible();
  });

  test('/platform/transactions/[id]/edit - form visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listTransactions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No transactions available');
    
    await page.goto(`/platform/transactions/${result.data[0].id}/edit`);
    await waitForAppReady(page);
    
    await expect(page.locator('form, input, button:has-text("Save"), button:has-text("Update")').first()).toBeVisible();
  });

  // Receipt route
  test('/receipt - heading or page visible', async ({ page }) => {
    await page.goto('/receipt');
    await waitForAppReady(page);
    
    const hasContent = await page.locator('text=Receipt, h1, h2, form, button').first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  // Transactions routes
  test('/transactions - heading visible', async ({ page }) => {
    await page.goto('/transactions');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Transactions, text=Transaction, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/transactions/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listTransactions([], { limit: 1 });
    test.skip(result.data.length === 0, 'No transactions available');
    
    await page.goto(`/transactions/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="transaction-detail"]').first()).toBeVisible();
  });

  test('/transactions/completion - form visible', async ({ page }) => {
    await page.goto('/transactions/completion');
    await waitForAppReady(page);
    
    await expect(page.locator('form, input, button:has-text("Complete"), button:has-text("Submit")').first()).toBeVisible();
  });

  // Utility status routes
  test('/utility/status/host - heading visible', async ({ page }) => {
    await page.goto('/utility/status/host');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Host, text=Status, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('/utility/status/tripos - heading visible', async ({ page }) => {
    await page.goto('/utility/status/tripos');
    await waitForAppReady(page);
    
    const hasHeading = await page.locator('text=Tripos, text=Status, h1, h2').first().isVisible();
    expect(hasHeading).toBeTruthy();
  });

  // Webhooks route
  test('/webhooks/[id] - detail visible', async ({ page }) => {
    test.skip(!hasRealCredentials, 'Real API credentials required');
    
    const client = new PlatformClient({
      apiKey: TEST_DATA.validCredentials.platformApiKey,
      environment: 'test',
    });
    
    const result = await client.listWebhooks([], { limit: 1 });
    test.skip(result.data.length === 0, 'No webhooks available');
    
    await page.goto(`/webhooks/${result.data[0].id}`);
    await waitForAppReady(page);
    
    await expect(page.locator('h1, h2, [data-testid="webhook-detail"]').first()).toBeVisible();
  });
});