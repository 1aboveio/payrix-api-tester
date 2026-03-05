/**
 * E2E Test Data Utilities
 * Deterministic fixtures for isolated, idempotent tests
 */

import type { Page } from '@playwright/test';

export const TEST_DATA = {
  validCredentials: {
    acceptorId: process.env.TEST_ACCEPTOR_ID || 'test-acceptor',
    accountId: process.env.TEST_ACCOUNT_ID || 'test-account',
    accountToken: process.env.TEST_ACCOUNT_TOKEN || 'test-token',
  },
  
  invalidCredentials: {
    acceptorId: 'invalid-acceptor',
    accountId: 'invalid-account', 
    accountToken: 'invalid-token',
  },
  
  transaction: {
    laneId: '12345',
    terminalId: 'TERM-001',
    amount: '10.00',
    referenceNumber: `REF-${Date.now()}`,
  },
  
  endpoints: {
    dev: 'https://payrix-api-tester-dev-903828198190.us-central1.run.app',
    prod: 'https://payrix-api-tester-prod-903828198190.us-central1.run.app',
  },
} as const;

/**
 * Generate unique test identifiers
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Seed localStorage with test configuration
 */
export async function seedConfig(page: Page, config: typeof TEST_DATA.validCredentials): Promise<void> {
  await page.evaluate((cfg: typeof TEST_DATA.validCredentials) => {
    const CONFIG_KEY = 'payrix_config';
    const existing = localStorage.getItem(CONFIG_KEY);
    const baseConfig = existing ? JSON.parse(existing) : {};
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      ...baseConfig,
      expressAcceptorId: cfg.acceptorId,
      expressAccountId: cfg.accountId,
      expressAccountToken: cfg.accountToken,
      environment: 'cert',
    }));
  }, config);
}

/**
 * Clear test data from localStorage
 */
export async function clearTestData(page: Page): Promise<void> {
  // Navigate to app origin first to avoid SecurityError on about:blank
  const url = page.url();
  if (!url || url === 'about:blank') {
    await page.goto('/');
  }
  await page.evaluate(() => {
    localStorage.removeItem('payrix_config');
    localStorage.removeItem('printer_settings');
  });
}

/**
 * Wait for app to be hydrated
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
}
