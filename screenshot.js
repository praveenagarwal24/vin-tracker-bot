const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://vin-tracker-dashboard.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait for animations
  await page.screenshot({ path: 'dashboard.png' });
  await browser.close();
})();
