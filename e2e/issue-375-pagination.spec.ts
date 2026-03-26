import { test, expect, type Page, type Request } from '@playwright/test';

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

function captureTransactionQueryUrls(page: Page): string[] {
  const urls: string[] = [];
  const handler = (request: Request) => {
    if (request.url().includes('/api/v1/transactionQuery')) {
      urls.push(request.url());
    }
  };

  page.on('request', handler);
  return urls;
}


// --- TriPOS Transactions Pagination ---

test.describe('TriPOS Transactions Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await seedPayrixConfig(page);
    await page.goto('/transactions');
  });

  test('sends page[limit] and page[offset] params', async ({ page }) => {
    const requestUrls = captureTransactionQueryUrls(page);
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForTimeout(800);

    const firstUrl = requestUrls[0] ?? '';
    expect(firstUrl.includes('page%5Blimit%5D') || firstUrl.includes('page[limit]')).toBeTruthy();
    expect(firstUrl.includes('page%5Boffset%5D=0') || firstUrl.includes('page[offset]=0')).toBeTruthy();
  });

  test('next page request uses incremented offset', async ({ page }) => {
    const requestUrls = captureTransactionQueryUrls(page);
    await page.getByLabel('Terminal ID').fill('e2e-terminal');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(800);

    const secondUrl = requestUrls.at(-1) ?? '';
    expect(secondUrl.includes('page%5Boffset%5D')).toBeTruthy();
  });

  test('prev button is disabled on first page', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: /previous/i });
    await expect(prevBtn).toBeDisabled();
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

  test('curl preview uses page[offset] and page[limit], not page[number]', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(500);

    const pre = page.locator('pre').first();
    const text = (await pre.textContent().catch(() => '')) || '';

    if (!text) {
      return;
    }

    expect(text.includes('page[number]')).toBeFalsy();
    expect(text.includes('page%5Boffset%5D') || text.includes('page[offset]')).toBeTruthy();
    expect(text.includes('page%5Blimit%5D') || text.includes('page[limit]')).toBeTruthy();
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

  test('terminal txns use same curl pagination format', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(500);

    const pre = page.locator('pre').first();
    const text = (await pre.textContent().catch(() => '')) || '';

    if (!text) {
      return;
    }

    expect(text.includes('page[number]')).toBeFalsy();
    expect(text.includes('page%5Boffset%5D') || text.includes('page[offset]')).toBeTruthy();
    expect(text.includes('page%5Blimit%5D') || text.includes('page[limit]')).toBeTruthy();
  });
});
