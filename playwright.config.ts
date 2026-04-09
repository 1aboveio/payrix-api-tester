import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10) : 4,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  maxFailures: process.env.MAX_FAILURES
    ? parseInt(process.env.MAX_FAILURES, 10)
    : process.env.CI ? 3 : 0,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // T1 — Smoke: App loads, navigation works, no crash on load
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // T2 — Auth + Config: Settings persist, credentials resolve, auth state valid
    {
      name: 'auth-config',
      testMatch: /(auth|default-prefill)\.spec\.ts/,
      dependencies: ['smoke'],
      use: { ...devices['Desktop Chrome'] },
    },
    // T3 — Functional: All transactional and feature flows
    {
      name: 'functional',
      testMatch: /(?!smoke|auth|default-prefill).*\.spec\.ts/,
      dependencies: ['auth-config'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
