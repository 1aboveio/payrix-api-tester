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

    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(saleTemplates.length);
  });

  test('template descriptions are visible in dropdown', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    const sample = saleTemplates[0];
    await expect(page.getByRole('option', { name: new RegExp(sample.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toContainText(sample.description);
  });

  test('selecting a template pre-fills form fields', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    const sample = saleTemplates.find((tpl) => tpl.fields?.transactionAmount) ?? saleTemplates[0];
    await page.getByRole('option', { name: new RegExp(sample.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();

    if (sample.fields?.transactionAmount) {
      await expect(page.getByLabel(/Transaction Amount/i)).toHaveValue(String(sample.fields.transactionAmount));
    }
  });

  test('template category variants appear in selector', async ({ page }) => {
    await page.goto('/transactions/sale');
    await waitForAppReady(page);

    const trigger = page.getByTestId('template-trigger');
    await trigger.click();

    await expect(page.getByRole('option', { name: /L2S-1/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /DUP-1/i })).toBeVisible();
  });
});
