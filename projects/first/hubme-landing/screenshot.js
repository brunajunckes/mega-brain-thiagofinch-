const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3010', { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: '/srv/aiox/projects/first/hubme-landing/preview-hero.png', fullPage: false });
  await page.screenshot({ path: '/srv/aiox/projects/first/hubme-landing/preview-full.png', fullPage: true });
  console.log('Screenshots saved');
  await browser.close();
})();
