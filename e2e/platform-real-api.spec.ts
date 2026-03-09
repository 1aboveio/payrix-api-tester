import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { waitForAppReady } from './utils/test-data';

type SearchFilter = { field: string; operator: string; value: string | number | boolean };

interface PlatformRecord {
  id: string;
  merchant?: string;
  login?: string;
  name?: string;
  email?: string;
  number?: string;
}

function readPlatformApiKey(): string {
  if (process.env.TEST_PLATFORM_API_KEY?.trim()) {
    return process.env.TEST_PLATFORM_API_KEY.trim();
  }

  const keyPath = join(homedir(), '.openclaw', 'credentials', 'payrix_api_key');
  if (!existsSync(keyPath)) return '';

  try {
    const content = readFileSync(keyPath, 'utf8').trim();
    return content;
  } catch {
    return '';
  }
}

function getPlatformBaseUrl(): string {
  const env = process.env.TEST_PLATFORM_ENV === 'prod' ? 'prod' : 'test';
  return env === 'prod' ? 'https://api.payrix.com' : 'https://test-api.payrix.com';
}

function buildSearchHeader(filters: SearchFilter[]): string {
  return filters
    .map((filter) => `${filter.field}[${filter.operator}]=${encodeURIComponent(String(filter.value))}`)
    .join(';');
}

async function platformApiRequest(
  request: APIRequestContext,
  apiKey: string,
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  options?: { body?: unknown; filters?: SearchFilter[]; pageLimit?: number }
) {
  const url = new URL(`${getPlatformBaseUrl()}${endpoint}`);
  if (options?.pageLimit) {
    url.searchParams.set('page[number]', '1');
    url.searchParams.set('page[limit]', String(options.pageLimit));
  }

  const headers: Record<string, string> = {
    APIKEY: apiKey,
    'Content-Type': 'application/json',
  };
  if (options?.filters?.length) {
    headers.search = buildSearchHeader(options.filters);
  }

  const response = await request.fetch(url.toString(), {
    method,
    headers,
    data: options?.body,
  });

  const json = await response.json().catch(() => ({}));
  return { response, json };
}

async function findPlatformRecord(
  request: APIRequestContext,
  apiKey: string,
  endpoint: '/customers' | '/invoices',
  predicate: (record: PlatformRecord) => boolean
) {
  const lookup = await platformApiRequest(request, apiKey, 'GET', endpoint, {
    pageLimit: 100,
  });
  const records = (lookup.json?.response?.data ?? []) as PlatformRecord[];
  return records.find(predicate);
}

async function seedPlatformConfig(page: Page, apiKey: string) {
  await page.goto('/');
  await page.evaluate((key: string) => {
    const configKey = 'payrix_config';
    const existing = localStorage.getItem(configKey);
    const base = existing ? JSON.parse(existing) : {};
    localStorage.setItem(
      configKey,
      JSON.stringify({
        ...base,
        platformApiKey: key,
        platformEnvironment: 'test',
      })
    );
  }, apiKey);
}

test.describe.serial('Platform real API coverage', () => {
  const apiKey = readPlatformApiKey();
  const runRealApi = Boolean(apiKey);
  let realApiAvailable = runRealApi;
  let unavailableReason = '';

  let merchantId = '';
  let merchantName = '';
  let login = '';

  let createdCustomerId = '';
  let createdInvoiceId = '';
  let createdCustomerEmail = '';
  let createdInvoiceNumber = '';

  test.beforeAll(async ({ request }) => {
    if (!runRealApi) return;

    try {
      const customerList = await platformApiRequest(request, apiKey, 'GET', '/customers', { pageLimit: 5 });
      const customers = (customerList.json?.response?.data ?? []) as PlatformRecord[];
      const customer = customers.find((item) => item.login && item.merchant);

      if (customer?.merchant) {
        merchantId = customer.merchant;
        login = customer.login || '';
      }

      if (merchantId) {
        const merchantDetail = await platformApiRequest(request, apiKey, 'GET', `/merchants/${merchantId}`);
        const merchant = (merchantDetail.json?.response?.data ?? [])[0] as PlatformRecord | undefined;
        merchantName = merchant?.name || merchantId;
        if (!login && merchant?.login) {
          login = merchant.login;
        }
      }

      if (!merchantId) {
        const merchantList = await platformApiRequest(request, apiKey, 'GET', '/merchants', { pageLimit: 5 });
        const merchant = ((merchantList.json?.response?.data ?? []) as PlatformRecord[]).find((item) => item.id);
        merchantId = merchant?.id || '';
        merchantName = merchant?.name || merchantId;
        login = merchant?.login || '';
      }
    } catch (error) {
      realApiAvailable = false;
      unavailableReason = error instanceof Error ? error.message : 'Platform API unavailable';
    }
  });

  test.afterAll(async ({ request }) => {
    if (!runRealApi) return;

    if (createdInvoiceId) {
      await platformApiRequest(request, apiKey, 'DELETE', `/invoices/${createdInvoiceId}`);
    } else if (createdInvoiceNumber) {
      const invoice = await findPlatformRecord(request, apiKey, '/invoices', (record) => record.number === createdInvoiceNumber);
      if (invoice?.id) {
        await platformApiRequest(request, apiKey, 'DELETE', `/invoices/${invoice.id}`);
      }
    }

    if (createdCustomerId) {
      await platformApiRequest(request, apiKey, 'DELETE', `/customers/${createdCustomerId}`);
    } else if (createdCustomerEmail) {
      const customer = await findPlatformRecord(request, apiKey, '/customers', (record) => record.email === createdCustomerEmail);
      if (customer?.id) {
        await platformApiRequest(request, apiKey, 'DELETE', `/customers/${customer.id}`);
      }
    }
  });

  test('covers module switcher, merchants, customers, invoices, and history with real API', async ({ page, request }) => {
    test.skip(!runRealApi, 'Set TEST_PLATFORM_API_KEY or ~/.openclaw/credentials/payrix_api_key to run real API coverage.');
    test.skip(!realApiAvailable, unavailableReason || 'Platform API is unreachable from this environment.');
    test.skip(!merchantId || !merchantName || !login, 'Unable to resolve merchant/login context from real API data.');

    await seedPlatformConfig(page, apiKey);

    await page.goto('/platform/invoices');
    await waitForAppReady(page);
    await expect(page.getByRole('main').getByText('Invoices', { exact: true })).toBeVisible();

    const moduleSwitch = page.locator('[data-slot="sidebar"]').getByRole('combobox').first();
    await moduleSwitch.click();
    await page.getByRole('option', { name: 'TriPOS Cloud' }).click();
    await expect(page).toHaveURL(/\/transactions\/sale/);
    await expect(page.getByRole('button', { name: /Execute Sale/i })).toBeVisible();

    await page.locator('[data-slot="sidebar"]').getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Payrix Platform' }).click();
    await expect(page).toHaveURL(/\/platform\/invoices/);

    await page.goto('/platform/merchants');
    await waitForAppReady(page);
    await expect(page.getByRole('main').getByText('Merchants', { exact: true })).toBeVisible();

    const testId = `e2e-${Date.now()}`;
    createdCustomerEmail = `${testId}@example.com`;
    createdInvoiceNumber = `INV-${Date.now()}`;

    await page.goto('/platform/customers/create');
    await waitForAppReady(page);
    await page.getByLabel(/Login ID/i).fill(login);
    await page.getByLabel(/Merchant ID/i).fill(merchantId);
    await page.getByLabel(/First Name/i).fill('E2E');
    await page.getByLabel(/Last Name/i).fill('Customer');
    await page.getByLabel(/Email/i).fill(createdCustomerEmail);
    await page.getByRole('button', { name: /^Create Customer$/i }).click();
    await expect(page).toHaveURL(/\/platform\/customers$/);

    // Note: Payrix API doesn't support searching by email field directly
    // So we list all customers and find the one with matching email
    const customerLookup = await platformApiRequest(request, apiKey, 'GET', '/customers', {
      pageLimit: 50,
    });
    const allCustomers = (customerLookup.json?.response?.data ?? []) as PlatformRecord[];
    const customer = allCustomers.find((c) => c.email === createdCustomerEmail);
    expect(customer?.id).toBeTruthy();
    if (!customer?.id) {
      throw new Error('Customer creation lookup failed');
    }
    createdCustomerId = customer.id;

    await page.goto('/platform/invoices/create');
    await waitForAppReady(page);
    await page.getByLabel(/Login ID/i).fill(login);
    await page.getByTestId('invoice-merchant-select').click();
    await expect(page.getByTestId('invoice-merchant-options')).toBeVisible();
    await expect(page.getByTestId(`invoice-merchant-option-${merchantId}`)).toBeVisible();
    await page.getByTestId(`invoice-merchant-option-${merchantId}`).click();
    await page.getByLabel(/Invoice Number/i).fill(createdInvoiceNumber);
    await page.getByLabel(/^Title$/i).fill(`Invoice ${testId}`);
    await page.getByRole('button', { name: /^Create Invoice$/i }).click();
    await expect(page).toHaveURL(/\/platform\/invoices$/);

    const invoice = await findPlatformRecord(request, apiKey, '/invoices', (record) => record.number === createdInvoiceNumber);
    expect(invoice?.id).toBeTruthy();
    if (!invoice?.id) {
      throw new Error('Invoice creation lookup failed');
    }
    createdInvoiceId = invoice.id;

    await page.goto(`/platform/invoices/${createdInvoiceId}`);
    await waitForAppReady(page);
    await expect(page.getByText(createdInvoiceNumber)).toBeVisible();

    await page.goto('/history');
    await waitForAppReady(page);
    await expect(page.getByText('/customers')).toBeVisible();
    await expect(page.getByText('/invoices')).toBeVisible();
  });
});
