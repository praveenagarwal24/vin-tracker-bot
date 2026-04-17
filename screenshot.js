const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://vin-tracker-dashboard.vercel.app/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(5000); // let charts/animations settle
  await page.screenshot({ path: 'dashboard.png', fullPage: true });
  await browser.close();
})();
