const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000');
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
      platformApiKey: 'test',
      platformEnvironment: 'test'
    }));
  });
  
  await page.goto('http://localhost:3000/platform/alerts');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/webhook-ui/alerts-page.png', fullPage: true });
  console.log('Saved alerts-page.png');
  
  await page.goto('http://localhost:3000/platform/webhooks/monitor');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/webhook-ui/webhooks-monitor-page.png', fullPage: true });
  console.log('Saved webhooks-monitor-page.png');
  
  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
