import { test, expect } from '@playwright/test';
import { clearTestData } from './utils/test-data';

const historySeed = [
  {
    id: 'hist-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    endpoint: '/api/v1/sale',
    method: 'POST',
    requestHeaders: { 'Content-Type': 'application/json' },
    request: { transactionAmount: '10.00', laneId: '12345' },
    response: { transactionId: 'txn-1', transactionAmount: '10.00', status: 'Approved' },
    status: 200,
    statusText: 'OK',
  },
  {
    id: 'hist-2',
    timestamp: '2026-01-01T00:01:00.000Z',
    endpoint: '/api/v1/void/txn-1',
    method: 'POST',
    requestHeaders: { 'Content-Type': 'application/json' },
    request: { transactionId: 'txn-1' },
    response: { transactionId: 'txn-1', status: 'Voided' },
    status: 200,
    statusText: 'OK',
  },
];

async function seedHistory(page: Parameters<typeof test>[0]['page']) {
  await page.addInitScript((entries) => {
    localStorage.setItem('payrix_history', JSON.stringify(entries));
  }, historySeed);
}

test.describe('History', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await seedHistory(page);
  });

  test('shows history entries after multiple operations', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByText('POST /api/v1/sale').first()).toBeVisible();
    await expect(page.getByText('POST /api/v1/void/txn-1').first()).toBeVisible();
  });

  test('history entries show transaction details', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByText('txn-1').first()).toBeVisible();
    await expect(page.getByText('10.00').first()).toBeVisible();
    await expect(page.getByText('Approved').first()).toBeVisible();
  });

  test('refresh keeps seeded history entries visible', async ({ page }) => {
    await page.goto('/history');
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('POST /api/v1/sale').first()).toBeVisible();
  });

  test('delete and clear history controls work', async ({ page }) => {
    await page.goto('/history');

    // Verify both seeded entries are visible
    await expect(page.getByText('POST /api/v1/sale')).toBeVisible();
    await expect(page.getByText('POST /api/v1/void/txn-1')).toBeVisible();

    // Test 1: Delete a single entry — this happens immediately (no dialog)
    const deleteButtons = page.getByRole('button', { name: 'Delete Local Copy' });
    await expect(deleteButtons.first()).toBeVisible();
    await deleteButtons.first().click();

    // Wait for the first entry to disappear
    await expect(page.getByText('POST /api/v1/sale')).not.toBeVisible();

    // One entry should still remain
    await expect(page.getByText('POST /api/v1/void/txn-1')).toBeVisible();

    // Test 2: Clear all remaining history using the page-level button
    await page.getByRole('button', { name: 'Clear Local History' }).click();

    // Wait for React state to update after clearing — use poll to verify
    // the empty state text becomes visible
    await expect
      .poll(async () => {
        return page.getByText('No history entries yet.').isVisible();
      })
      .toBe(true);
  });
});

