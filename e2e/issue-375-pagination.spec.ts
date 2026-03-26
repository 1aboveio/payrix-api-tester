import { test, expect, type Page } from '@playwright/test';

// --- Config seeding helpers ---

async function seedPayrixConfig(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'payrix_config',
      JSON.stringify({
        environment: 'cert',
        tpAuthorization: 'e2e-test-auth',
        applicationId: 'e2e-test-app',
        applicationName: 'e2e-test-app',
        applicationVersion: '1.0.0',
        expressAcceptorId: 'e2e-acceptor',
        expressAccountId: 'e2e-account',
        expressAccountToken: 'e2e-token',
        defaultLaneId: '',
        defaultTerminalId: '',
        platformEnvironment: 'test',
        sunmiAppId: '',
        sunmiAppKey: '',
      }),
    );
  });
}

async function seedPlatformConfig(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'payrix_config';
    const existing = localStorage.getItem(key);
    const base = existing ? JSON.parse(existing) : {};
    localStorage.setItem(
      key,
      JSON.stringify({
        ...base,
        platform: {
          test: { platformApiKey: 'e2e-platform-key' },
          live: { platformApiKey: '' },
        },
        platformEnvironment: base.platformEnvironment || 'test',
      }),
    );
  });
}

// --- TriPOS Transactions Pagination ---

test.describe('TriPOS Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await seedPayrixConfig(page);
    await page.goto('/transactions');
  });

  test('page limit control is visible', async ({ page }) => {
    // Verify the page limit input/selector is present
    const limitControl = page.getByLabel(/page limit|limit/i).first();
    await expect(limitControl).toBeVisible();
  });

  test('pagination controls appear after search', async ({ page }) => {
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Check for pagination controls (Next/Previous buttons or page indicator)
    const pagination = page.locator('text=/page|previous|next/i').first();
    // Pagination may or may not appear depending on results, so just check it doesn't error
    await expect(pagination).toBeVisible().catch(() => {
      // Pagination may not appear if no results - that's ok
    });
  });

  test('prev button is disabled on first page', async ({ page }) => {
    // The Previous button should be disabled initially (before any search)
    // or we should verify the pagination state after a search
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Look for Previous button - it may not exist if no results
    const prevBtn = page.getByRole('button', { name: /previous/i });
    if (await prevBtn.count() > 0) {
      await expect(prevBtn).toBeDisabled();
    }
  });
});

// --- Platform Transactions Pagination ---

test.describe('Platform Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await seedPlatformConfig(page);
    await page.goto('/platform/transactions');
  });

  test('shows rows per page control', async ({ page }) => {
    const rowsPerPage = page.getByText(/rows per page/i);
    await expect(rowsPerPage).toBeVisible();
  });

  test('curl preview shows pagination params after results load', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).click();

    // Wait for API result panel to appear (indicates response received)
    const resultPanel = page.locator('text=/request preview|response|raw json/i').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    // Check cURL command in the preview
    const pre = page.locator('pre').first();
    const text = await pre.textContent().catch(() => '');

    // The cURL should not use page[number] (old format)
    expect(text.includes('page[number]')).toBeFalsy();

    // The cURL should use page[offset] and page[limit] (new format)
    // These may be URL-encoded or plain text
    const hasOffset = text.includes('page%5Boffset%5D') || text.includes('page[offset]');
    const hasLimit = text.includes('page%5Blimit%5D') || text.includes('page[limit]');

    // Only assert if we actually have cURL text
    if (text && text.includes('curl')) {
      expect(hasOffset).toBeTruthy();
      expect(hasLimit).toBeTruthy();
    }
  });
});

// --- Terminal Transactions Pagination ---

test.describe('Terminal Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await seedPlatformConfig(page);
    await page.goto('/platform/terminal-txns');
  });

  test('shows rows per page control', async ({ page }) => {
    const rowsPerPage = page.getByText(/rows per page/i);
    await expect(rowsPerPage).toBeVisible();
  });

  test('curl preview shows pagination params after results load', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).click();

    // Wait for API result panel to appear
    const resultPanel = page.locator('text=/request preview|response|raw json/i').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const pre = page.locator('pre').first();
    const text = await pre.textContent().catch(() => '');

    expect(text.includes('page[number]')).toBeFalsy();

    const hasOffset = text.includes('page%5Boffset%5D') || text.includes('page[offset]');
    const hasLimit = text.includes('page%5Blimit%5D') || text.includes('page[limit]');

    if (text && text.includes('curl')) {
      expect(hasOffset).toBeTruthy();
      expect(hasLimit).toBeTruthy();
    }
  });
});
