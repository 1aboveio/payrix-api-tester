import { test, expect } from '@playwright/test';

/**
 * Regression tests for Issue #375: Paginate platform transactions and terminal
 * transactions pages to prevent hanging/timeouts.
 *
 * Covers:
 * - Pagination uses offset-based query params (page[offset], page[limit])
 * - Timeout handling with visible error states
 * - Page navigation and page-size changes work correctly
 */

test.describe('Platform Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Register mock BEFORE navigating to ensure it catches the initial load
    await page.route('**/txns**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            details: { page: { current: 1, limit: 10, total: 0 } },
            errors: [],
          },
        }),
      });
    });
    
    // Navigate to transactions page with mock config
    await page.goto('/platform/transactions');
    await page.waitForLoadState('networkidle');
  });

  test('should use offset-based pagination in API requests', async ({ page }) => {
    // Intercept API calls to verify pagination params
    const apiCalls: string[] = [];
    await page.route('**/txns**', async (route, request) => {
      apiCalls.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            details: { page: { current: 1, limit: 10, total: 0 } },
            errors: [],
          },
        }),
      });
    });

    // Wait for API call to complete by checking for the empty state
    await expect(page.locator('text=No transactions found')).toBeVisible();

    // Check that the API was called with offset-based params
    expect(apiCalls.length).toBeGreaterThan(0);
    const url = apiCalls[0];
    expect(url).toContain('page[offset]=');
    expect(url).toContain('page[limit]=');
    expect(url).not.toContain('page[number]=');
  });

  test('should calculate offset correctly for page 2', async ({ page }) => {
    const apiCalls: string[] = [];
    let callCount = 0;
    await page.route('**/txns**', async (route, request) => {
      apiCalls.push(request.url());
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: Array(10).fill({ id: `txn_${callCount}`, status: 1, amount: 1000 }),
            details: { page: { current: 2, limit: 10, total: 25 } },
            errors: [],
          },
        }),
      });
    });

    // Wait for initial load
    await expect(page.locator('text=transactions found')).toBeVisible();

    // Click next page button (second pagination button with ChevronRight)
    const nextButton = page.locator('button[title="Next page"], button:has(svg.lucide-chevron-right)').first();
    await nextButton.click();

    // Wait for page 2 data to load
    await expect(page.locator('text=Page 2 of')).toBeVisible();

    // Check offset for page 2 with limit 10 = offset 10
    const page2Call = apiCalls.find(u => u.includes('page[offset]=10'));
    expect(page2Call).toBeTruthy();
  });

  test('should show error alert when API returns error', async ({ page }) => {
    await page.route('**/txns**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            errors: [{ message: 'Request timeout after 30000ms' }],
          },
        }),
      });
    });

    // Error state should be visible
    await expect(page.locator('text=Error loading transactions')).toBeVisible();
    await expect(page.locator('text=Request timeout after 30000ms')).toBeVisible();
  });

  test('should handle page size changes', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/txns**', async (route, request) => {
      apiCalls.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: Array(25).fill({ id: 'txn_test', status: 1, amount: 1000 }),
            details: { page: { current: 1, limit: 25, total: 100 } },
            errors: [],
          },
        }),
      });
    });

    // Wait for initial load
    await expect(page.locator('text=transactions found')).toBeVisible();

    // Change page size to 25
    await page.click('text=Rows per page:');
    await page.click('text=25');

    // Wait for data to refresh
    await expect(page.locator('text=25 transactions found')).toBeVisible();

    // Check that limit was updated
    const callWith25 = apiCalls.find(u => u.includes('page[limit]=25'));
    expect(callWith25).toBeTruthy();
  });
});

test.describe('Terminal Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Register mock BEFORE navigating to ensure it catches the initial load
    await page.route('**/terminalTxns**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            details: { page: { current: 1, limit: 20, total: 0 } },
            errors: [],
          },
        }),
      });
    });
    
    await page.goto('/platform/terminal-txns');
    await page.waitForLoadState('networkidle');
  });

  test('should use offset-based pagination in API requests', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/terminalTxns**', async (route, request) => {
      apiCalls.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            details: { page: { current: 1, limit: 20, total: 0 } },
            errors: [],
          },
        }),
      });
    });

    // Wait for empty state
    await expect(page.locator('text=No terminal transactions found')).toBeVisible();

    expect(apiCalls.length).toBeGreaterThan(0);
    const url = apiCalls[0];
    expect(url).toContain('page[offset]=');
    expect(url).toContain('page[limit]=');
    expect(url).not.toContain('page[number]=');
  });

  test('should show error state when API fails', async ({ page }) => {
    await page.route('**/terminalTxns**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [],
            errors: [{ message: 'Internal server error' }],
          },
        }),
      });
    });

    // Should show error alert
    await expect(page.locator('text=Error loading terminal transactions')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should handle search with pagination', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/terminalTxns**', async (route, request) => {
      apiCalls.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            data: [{ id: 'search_result', type: 1, total: 1000 }],
            details: { page: { current: 1, limit: 20, total: 1 } },
            errors: [],
          },
        }),
      });
    });

    // Wait for initial load
    await expect(page.locator('text=terminal transaction')).toBeVisible();

    // Perform search
    await page.fill('input[placeholder*="Terminal Txn ID"]', 'test-id');
    await page.click('button[type="submit"]');

    // Wait for search results
    await expect(page.locator('text=1 terminal transaction')).toBeVisible();

    // Verify search was made with pagination params
    const searchCall = apiCalls.find(u => u.includes('page[offset]=0'));
    expect(searchCall).toBeTruthy();
  });
});
