import { test, expect } from '@playwright/test';
import { loginAsDemo, openHash } from './helpers.js';

test.describe('Smoke — auth & navigation', () => {
  test('wrong password shows error on login form', async ({ page }) => {
    await page.goto('/?dataMode=api&apiBaseUrl=https://cse110-sp26-group14.onrender.com');
    await page.locator('#login-email').fill('maya@team.local');
    await page.locator('#login-password').fill('wrong-password');
    await page.locator('#login-form').getByRole('button', { name: 'Log in' }).click();
    await expect(page.locator('#auth-error')).toContainText(/invalid email or password/i);
    await expect(page.locator('#auth-error')).toHaveClass(/auth-error-visible/);
    await expect(page.locator('#app-shell')).toHaveClass(/hidden/);
  });

  test('shows login screen before auth', async ({ page }) => {
    await page.goto('/?dataMode=local');
    await expect(page.locator('#login-root')).toBeVisible();
    await expect(page.locator('#app-shell')).toHaveClass(/hidden/);
    await expect(page.getByText('Demo:')).toBeVisible();
  });

  test('demo login opens dashboard with user header', async ({ page }) => {
    await loginAsDemo(page);
    await expect(page.locator('#user-name')).toHaveText('Maya Patel');
    await expect(page.locator('#header-sprint-badge')).toContainText('Sprint 2');
    await expect(page.locator('#header-sprint-select')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daily Check-In' })).toBeVisible();
  });

  test('sidebar navigates to main views', async ({ page }) => {
    await loginAsDemo(page);

    const views = [
      ['#calendar', 'Sprint Calendar'],
      ['#backlog', 'Backlog'],
      ['#issues', 'Issues & Reports'],
      ['#team-availability', 'Team Availability'],
      ['#ai-log', 'AI Log'],
      ['#settings', 'Settings'],
      ['#dashboard', 'Dashboard'],
    ];

    for (const [hash, title] of views) {
      await openHash(page, hash);
      await expect(page.locator('.view-title').first()).toHaveText(title);
    }
  });

  test('log out returns to login', async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.locator('#login-root')).toBeVisible();
    await expect(page.locator('#app-shell')).toHaveClass(/hidden/);
  });
});
