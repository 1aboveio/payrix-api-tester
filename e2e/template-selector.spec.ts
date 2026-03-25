import { test, expect } from '@playwright/test';
import { seedConfig, clearTestData, waitForAppReady, TEST_DATA } from './utils/test-data';
import { saleTemplates } from '../src/lib/payrix/templates';

test.describe('Template Selector', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
    await page.goto('/settings');
    await seedConfig(page, TEST_DATA.validCredentials);
  });

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('all sale templates load in selector', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    // Wait for the select content to be visible
    const selectContent = page.locator('[data-radix-select-viewport]');
    await expect(selectContent).toBeVisible();

    // Check that all templates are present by looking for their text
    for (const tpl of saleTemplates) {
      await expect(page.getByText(tpl.name, { exact: false })).toBeVisible();
    }
  });

  test('template descriptions are visible in dropdown', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    // Wait for dropdown to open
    const selectContent = page.locator('[data-radix-select-viewport]');
    await expect(selectContent).toBeVisible();

    const sample = saleTemplates[0];
    // Check that the template name and description are visible
    await expect(page.getByText(sample.name)).toBeVisible();
    await expect(page.getByText(sample.description)).toBeVisible();
  });

  test('selecting a template pre-fills form fields', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    // Wait for dropdown to open
    const selectContent = page.locator('[data-radix-select-viewport]');
    await expect(selectContent).toBeVisible();

    const sample = saleTemplates.find((tpl) => tpl.fields?.transactionAmount) ?? saleTemplates[0];
    await page.getByText(sample.name, { exact: false }).click();

    if (sample.fields?.transactionAmount) {
      await expect(page.getByLabel(/Transaction Amount/i)).toHaveValue(String(sample.fields.transactionAmount));
    }
  });

  test('template category variants appear in selector', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    // Wait for dropdown to open
    const selectContent = page.locator('[data-radix-select-viewport]');
    await expect(selectContent).toBeVisible();

    await expect(page.getByText('L2S-1')).toBeVisible();
    await expect(page.getByText('DUP-1')).toBeVisible();
  });
});
