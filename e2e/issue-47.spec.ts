import { test, expect } from '@playwright/test';
import { clearTestData, seedConfig, waitForAppReady, TEST_DATA } from './utils/test-data';

test.describe('Issue #47 coverage', () => {
  const getRequestIdFromHeaders = async (page: any): Promise<string> => {
    const headersPre = page.locator('pre', { hasText: /\"tp-request-id\"/ }).first();
    await expect(headersPre).toBeVisible({ timeout: 10000 });

    const text = await headersPre.textContent();
    const match = text?.match(/\"tp-request-id\"\s*:\s*\"([^\"]+)\"/);
    return match?.[1] ?? '';
  };

  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('sale prepopulates all request IDs on load', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const referenceInput = page.getByLabel(/Reference Number/i);
    const ticketInput = page.getByLabel(/Ticket Number/i);

    await expect(referenceInput).toHaveValue(/.+/);
    await expect(ticketInput).toHaveValue(/.+/);
  });

  test('sale regenerate IDs on reset', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const referenceInput = page.getByLabel(/Reference Number/i);
    const ticketInput = page.getByLabel(/Ticket Number/i);

    const initialReference = await referenceInput.inputValue();
    const initialTicket = await ticketInput.inputValue();

    await page.getByRole('button', { name: 'Reset', exact: true }).click();

    await expect(referenceInput).toHaveValue(/.+/, { timeout: 10000 });
    await expect(ticketInput).toHaveValue(/.+/, { timeout: 10000 });

    const nextReference = await referenceInput.inputValue();
    const nextTicket = await ticketInput.inputValue();

    expect(nextReference).not.toEqual(initialReference);
    expect(nextTicket).not.toEqual(initialTicket);
  });

  test('sale supports second submit with regenerated request id', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    await page.getByLabel(/Lane ID/i).fill(TEST_DATA.transaction.laneId);
    await page.getByLabel(/Transaction Amount/i).fill(TEST_DATA.transaction.amount);

    const submit = page.getByRole('button', { name: /Execute Sale/i });

    await submit.click();
    await expect(page.getByRole('button', { name: /Save to History|Saved to History/i })).toBeVisible({
      timeout: 20000,
    });
    const firstRequestId = await getRequestIdFromHeaders(page);
    expect(firstRequestId).toBeTruthy();

    await submit.click();
    await expect(page.getByRole('button', { name: /Save to History|Saved to History/i })).toBeVisible({
      timeout: 20000,
    });
    const secondRequestId = await getRequestIdFromHeaders(page);
    expect(secondRequestId).toBeTruthy();
    expect(secondRequestId).not.toEqual(firstRequestId);
  });

  test('input status requires promptType and formatType for execution', async ({ page }) => {
    await page.goto('/utility/input');
    await waitForAppReady(page);

    await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_DATA.transaction.laneId, { timeout: 10000 });

    const executeInput = page.getByRole('button', { name: /Execute Input Status/i });
    await expect(executeInput).toBeDisabled();

    await page.getByRole('combobox', { name: /Prompt Type/i }).click();
    await expect(page.getByRole('option', { name: /None/i })).toHaveCount(0);
    await page.getByRole('option', { name: /Amount/i }).click();

    await expect(executeInput).toBeDisabled();

    await page.getByRole('combobox', { name: /Format Type/i }).click();
    await page.getByRole('option', { name: /Numeric/i }).click();

    await expect(executeInput).toBeEnabled();
  });

  test('selection status validates form-type-dependent required fields', async ({ page }) => {
    await page.goto('/utility/selection');
    await waitForAppReady(page);

    const executeSelection = page.getByRole('button', { name: /Execute Selection Status/i });
    const lane = page.getByLabel(/Lane ID/i);
    const textInput = page.locator("#text");
    const multiLineInput = page.locator("#multiLineText");
    const optionsInput = page.getByLabel(/Options/i);

    await expect(lane).toHaveValue(TEST_DATA.transaction.laneId, { timeout: 10000 });
    await expect(executeSelection).toBeDisabled();

    await optionsInput.fill('Option A|Option B');
    await expect(executeSelection).toBeDisabled();

    await textInput.fill('Confirm amount');
    await expect(executeSelection).toBeEnabled();

    await page.getByRole('combobox', { name: /Form Type/i }).click();
    await page.getByRole('option', { name: /Multi Line Text/i }).click();

    await expect(textInput).toBeDisabled();
    await expect(multiLineInput).toBeEnabled();

    await multiLineInput.fill('Line 1|Line 2');
    await expect(executeSelection).toBeEnabled();

    await optionsInput.fill('');
    await expect(executeSelection).toBeDisabled();
  });
});
