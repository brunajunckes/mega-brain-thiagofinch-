const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to Fiverr...');
    await page.goto('https://www.fiverr.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Title:', await page.title());
    console.log('URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: '/srv/aiox/projects/first/fiverr/fiverr-test.png', fullPage: false });
    console.log('Screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
