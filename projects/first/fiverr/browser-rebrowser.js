const { chromium } = require('rebrowser-playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  try {
    console.log('Testing rebrowser-playwright...');

    // First test: bot detection check
    await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/srv/aiox/projects/first/fiverr/bot-test.png', fullPage: true });
    console.log('Bot test screenshot saved');

    // Now try Fiverr
    console.log('Navigating to Fiverr...');
    await page.goto('https://www.fiverr.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(8000);

    const title = await page.title();
    console.log('Title:', title);
    await page.screenshot({ path: '/srv/aiox/projects/first/fiverr/fiverr-rebrowser.png', fullPage: false });

    if (!title.includes('human') && !title.includes('challenge')) {
      console.log('SUCCESS!');
    } else {
      console.log('BLOCKED - likely IP-based detection (datacenter IP)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
