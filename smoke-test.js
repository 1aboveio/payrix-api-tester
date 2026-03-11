const { chromium } = require('playwright');

const DEV_URL = 'https://payrix-api-tester-dev-903828198190.us-central1.run.app';
const API_KEY = '5425f11495f1a029c7ffc1ad4da0516a';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Set localStorage with config
  await page.goto(DEV_URL);
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
  
  console.log('=== STEP 1: Open Transaction/Sale page ===');
  // Try the TriPOS side - Sale page
  await page.goto(`${DEV_URL}/tripos/sale`);
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'step1-sale-page.png', fullPage: true });
  console.log('Sale page screenshot saved');
  
  // Try to fill and submit a sale
  // Look for Lane ID or Terminal ID fields
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} inputs on sale page`);
  
  // Try clicking Execute/Sale button
  const saleButton = page.locator('button').filter({ hasText: /Sale|Execute|Run/ }).first();
  if (await saleButton.isVisible()) {
    await saleButton.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'step2-after-sale.png', fullPage: true });
    console.log('Sale executed');
  }
  
  // Step 2: Check webhook monitor
  console.log('\n=== STEP 2: Check Webhook Monitor ===');
  await page.goto(`${DEV_URL}/platform/webhooks/monitor`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step3-monitor.png', fullPage: true });
  console.log('Monitor screenshot saved');
  
  await browser.close();
  console.log('\nDone! Screenshots saved.');
}

main().catch(console.error);
