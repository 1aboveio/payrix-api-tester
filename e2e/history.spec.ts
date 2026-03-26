import { test, expect } from '@playwright/test';
import { clearTestData, waitForAppReady } from './utils/test-data';

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
    await waitForAppReady(page);

    // Verify both seeded entries are visible
    const saleEntryText = page.getByText('POST /api/v1/sale');
    const voidEntryText = page.getByText('POST /api/v1/void/txn-1');
    await expect(saleEntryText.first()).toBeVisible({ timeout: 10000 });
    await expect(voidEntryText.first()).toBeVisible({ timeout: 10000 });

    // Test 1: Delete a single entry by finding its card and clicking Delete
    // Find the card containing "POST /api/v1/sale" and click its delete button
    const saleCard = page.locator('.rounded-xl.border').filter({ has: saleEntryText }).first();
    await expect(saleCard).toBeVisible({ timeout: 10000 });
    
    const deleteButton = saleCard.getByRole('button', { name: 'Delete Local Copy' });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // Wait for the sale entry to disappear (only void should remain from our seeded entries)
    await expect
      .poll(
        async () => {
          const count = await saleEntryText.count();
          // If there are server entries with same text, we check the specific card
          return count === 0 || !(await saleCard.isVisible().catch(() => false));
        },
        { timeout: 10000 }
      )
      .toBe(true);

    // Void entry should still be visible
    await expect(voidEntryText.first()).toBeVisible();

    // Test 2: Clear all remaining history using the page-level button
    // Note: This only clears localStorage; server-side history may persist
    await page.getByRole('button', { name: 'Clear Local History' }).click();

    // Verify local entries are cleared by checking the seeded entries no longer appear
    // (server entries may still exist, so we don't check for empty state)
    await expect
      .poll(
        async () => {
          const voidCount = await voidEntryText.count();
          // After clearing localStorage, the seeded void entry should be gone
          // (though server entries with same text might exist)
          return voidCount === 0;
        },
        { timeout: 10000 }
      )
      .toBe(true);
  });
});
