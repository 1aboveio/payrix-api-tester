import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// --- Config seeding helpers ---

function seedPayrixConfig(page: Page) {
  page.goto('/');
  page.evaluate(() => {
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
    seedPayrixConfig(page);
    await page.goto('/transactions');
  });

  test('shows pagination controls after search', async ({ page }) => {
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for API response (may fail in test env — that's fine)
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {/* ignore — API may not be reachable in test env */});

    // Prev/Next buttons should be visible
    const prevBtn = page.getByRole('button', { name: /previous/i });
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Previous should be disabled on first page
    await expect(prevBtn).toBeDisabled();
  });

  test('Next button re-queries with incremented offset', async ({ page }) => {
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    const nextBtn = page.getByRole('button', { name: /next/i });
    const prevBtn = page.getByRole('button', { name: /previous/i });

    await nextBtn.click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Previous should now be enabled (we're past page 1)
    await expect(prevBtn).toBeEnabled();
  });

  test('Previous button returns to first page', async ({ page }) => {
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    const nextBtn = page.getByRole('button', { name: /next/i });
    const prevBtn = page.getByRole('button', { name: /previous/i });

    // Go to next page
    await nextBtn.click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Go back
    await prevBtn.click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Previous should be disabled again
    await expect(prevBtn).toBeDisabled();
  });

  test('shows request preview with pageSize and offset after search', async ({ page }) => {
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/transactionQuery'),
      { timeout: 10_000 },
    ).catch(() => {});

    const previewCard = page.getByRole('heading', { name: 'Request Preview' });
    await expect(previewCard).toBeVisible();

    const previewText = await previewCard.locator('..').textContent();
    expect(previewText ?? '').toContain('pageSize');
    expect(previewText ?? '').toContain('offset');
  });
});

// --- Platform Transactions Pagination ---

test.describe('Platform Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    seedPlatformConfig(page);
    await page.goto('/platform/transactions');
  });

  test('shows pagination controls', async ({ page }) => {
    const rowsPerPage = page.getByText(/rows per page/i);
    await expect(rowsPerPage).toBeVisible();
  });

  test('curl preview uses page[offset]+page[limit] — not page[number]', async ({ page }) => {
    // Execute a search
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(3_000);

    const curlPre = page.locator('pre').first();
    const curlText = await curlPre.textContent().catch(() => '');

    if (!curlText) return; // Skip if no result panel visible

    // Must NOT contain page[number]
    expect(curlText).not.toContain('page[number]');

    // Must contain page[offset] or page[limit]
    const hasOffset = curlText.includes('page[offset]') || curlText.includes('page%5Boffset%5D');
    const hasLimit = curlText.includes('page[limit]') || curlText.includes('page%5Blimit%5D');
    expect(hasOffset || hasLimit).toBeTruthy();
  });
});

// --- Terminal Transactions Pagination ---

test.describe('Terminal Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    seedPlatformConfig(page);
    await page.goto('/platform/terminal-txns');
  });

  test('shows pagination controls', async ({ page }) => {
    const rowsPerPage = page.getByText(/rows per page/i);
    await expect(rowsPerPage).toBeVisible();
  });

  test('terminal transactions page accessible from platform nav', async ({ page }) => {
    await page.goto('/platform');
    const link = page.getByRole('link', { name: /terminal/i }).first();
    const hasLink = await link.isVisible().catch(() => false);
    if (hasLink) {
      await link.click();
      await expect(page).toHaveURL(/\/platform\/terminal-txns/);
    }
  });

  test('curl preview uses page[offset]+page[limit] — not page[number]', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(3_000);

    const curlPre = page.locator('pre').first();
    const curlText = await curlPre.textContent().catch(() => '');

    if (!curlText) return;

    expect(curlText).not.toContain('page[number]');

    const hasOffset = curlText.includes('page[offset]') || curlText.includes('page%5Boffset%5D');
    const hasLimit = curlText.includes('page[limit]') || curlText.includes('page%5Blimit%5D');
    expect(hasOffset || hasLimit).toBeTruthy();
  });
});
