const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto('https://vin-tracker-dashboard.vercel.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForLoadState('load', { timeout: 60000 });
    await page.waitForTimeout(8000); // let charts/animations settle

    await page.screenshot({ path: 'dashboard.png', fullPage: true });
    console.log('Screenshot saved successfully');
  } finally {
    await browser.close();
  }
}

(async () => {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      await takeScreenshot();
      process.exit(0);
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === maxAttempts) {
        console.error('All attempts failed');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
})();
