/** Fixed "today" so sprint lifecycle + calendar E2E match seed data (Sprint 2 active). */
export const E2E_TODAY = '2026-05-15';

/** @param {import('@playwright/test').Page} page */
export async function gotoLocalApp(page) {
  await page.goto(`/?dataMode=local&sitrepToday=${E2E_TODAY}`);
}

/** @param {import('@playwright/test').Page} page */
export async function loginAsDemo(page) {
  await gotoLocalApp(page);
  await page.locator('#login-email').fill('maya@team.local');
  await page.locator('#login-password').fill('demo1234');
  await page.locator('#login-form').getByRole('button', { name: 'Log in' }).click();
  await page.locator('#app-shell').waitFor({ state: 'visible' });
  await page.locator('.view-title', { hasText: 'Dashboard' }).waitFor();
}

/** @param {import('@playwright/test').Page} page */
export async function openHash(page, hash) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await page.waitForTimeout(50);
}
