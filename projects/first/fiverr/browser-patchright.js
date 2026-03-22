const { chromium } = require('patchright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to Fiverr with Patchright...');
    await page.goto('https://www.fiverr.com', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for potential challenge to resolve
    await page.waitForTimeout(5000);

    const title = await page.title();
    const url = page.url();
    console.log('Title:', title);
    console.log('URL:', url);

    await page.screenshot({ path: '/srv/aiox/projects/first/fiverr/fiverr-patchright.png', fullPage: false });
    console.log('Screenshot saved');

    // Check if we passed the challenge
    if (title.includes('human') || title.includes('challenge')) {
      console.log('BLOCKED: Still hitting anti-bot challenge');
    } else {
      console.log('SUCCESS: Passed anti-bot detection!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
