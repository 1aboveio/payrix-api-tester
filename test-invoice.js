const { chromium } = require('playwright');

const DEV_URL = 'https://payrix-api-tester-dev-903828198190.us-central1.run.app';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // FIRST: Go to settings and confirm API key is saved
  console.log('=== STEP 0: Check Settings ===');
  await page.goto(`${DEV_URL}/settings`);
  await page.waitForTimeout(2000);
  
  // Check if Platform API Key field has value
  const settingsContent = await page.content();
  console.log('Settings page loaded');
  
  await page.screenshot({ path: 'step0-settings.png', fullPage: true });
  
  // Set localStorage with config
  await page.evaluate(() => {
    localStorage.setItem('payrix-config', JSON.stringify({
      environment: 'test',
      expressAcceptorId: 'test',
      expressAccountId: 'test',
      expressAccountToken: 'test',
      applicationId: 'test',
      applicationName: 'test',
      applicationVersion: '1.0',
      tpAuthorization: 'test',
      defaultLaneId: 'test',
      defaultTerminalId: 'test',
      platformApiKey: '5425f11495f1a029c7ffc1ad4da0516a',
      platformEnvironment: 'test'
    }));
  });
  console.log('LocalStorage set');
  
  // Now go to invoice create
  console.log('\n=== STEP 1: Go to Invoice Create ===');
  await page.goto(`${DEV_URL}/platform/invoices/create`);
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'step1-form.png', fullPage: true });
  console.log('Form screenshot saved');
  
  // Fill Login ID
  await page.getByLabel('Login ID').fill('t1_log_6927fb9719a2e103bd075a9');
  
  // Click merchant dropdown
  await page.getByLabel('Merchant').click();
  await page.waitForTimeout(2000);
  
  const merchantOptions = await page.locator('div[role="option"]').count();
  console.log(`Merchant options after clicking: ${merchantOptions}`);
  
  await page.screenshot({ path: 'step2-merchants.png', fullPage: true });
  
  if (merchantOptions > 0) {
    await page.locator('div[role="option"]').first().click();
    await page.waitForTimeout(500);
    
    await page.getByLabel('Title').fill('Test Invoice');
    await page.getByLabel('Message').fill('Webhook test');
    
    // Fill line item
    const itemInputs = await page.locator('input').all();
    console.log(`Total inputs: ${itemInputs.length}`);
    
    await page.screenshot({ path: 'step3-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: 'Create Invoice' }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'step4-after-create.png', fullPage: true });
  }
  
  // Check invoices list
  await page.goto(`${DEV_URL}/platform/invoices`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step5-invoices.png', fullPage: true });
  
  // Check webhook monitor
  await page.goto(`${DEV_URL}/platform/webhooks/monitor`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step6-monitor.png', fullPage: true });
  
  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
