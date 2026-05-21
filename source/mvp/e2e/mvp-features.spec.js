import { test, expect } from '@playwright/test';
import { loginAsDemo, openHash } from './helpers.js';

test.describe('MVP features — sprint, reports, meetings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('settings can add a new sprint to the list', async ({ page }) => {
    await openHash(page, '#settings');
    await expect(page.locator('#sprint-add-form')).toBeVisible();
    await page.locator('#sprint-add-name').fill('Sprint E2E');
    await page.locator('#sprint-add-start').fill('2026-06-01');
    await page.locator('#sprint-add-end').fill('2026-06-14');
    await page.locator('#sprint-add-status').selectOption('planned');
    await page.locator('#sprint-add-form').getByRole('button', { name: 'Add sprint' }).click();
    await expect(page.locator('.sprint-list')).toContainText('Sprint E2E');
    await expect(page.locator('#header-sprint-select option:checked')).toContainText('Sprint E2E');
  });

  test('header sprint selector switches dashboard sprint', async ({ page }) => {
    await expect(page.locator('#header-sprint-select')).toBeVisible();
    await openHash(page, '#dashboard');
    const sprintSelect = page.locator('#header-sprint-select');
    await sprintSelect.selectOption('3');
    await expect(sprintSelect).toHaveValue('3');
    await expect(page.locator('#app')).toContainText(/Real-time overview of Sprint 3/, { timeout: 10000 });
  });

  test('check-in notes field saves and appears on Reports tab', async ({ page }) => {
    const note = `E2E note ${Date.now()}`;
    await page.getByRole('button', { name: 'Daily Check-In' }).click();
    await page.locator('#checkin-notes').fill(note);
    await page.locator('#checkin-progress').fill('E2E progress with notes');
    await page.locator('#checkin-form').getByRole('button', { name: 'Submit Check-In' }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);

    await openHash(page, '#issues');
    await page.getByRole('button', { name: 'Reports' }).click();
    await expect(page.locator('.reports-list')).toContainText(note);
    await expect(page.locator('.reports-list')).toContainText('E2E progress with notes');
  });

  test('issues Activity tab shows unified timeline', async ({ page }) => {
    await openHash(page, '#issues');
    await page.getByRole('button', { name: 'Activity' }).click();
    await expect(page.locator('.activity-list .activity-card').first()).toBeVisible();
  });

  test('create issue with tracking task adds backlog row', async ({ page }) => {
    const title = `E2E Issue+Task ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Issue' }).click();
    await page.locator('#issue-title').fill(title);
    await page.locator('#issue-description').fill('Issue with linked task');
    await page.locator('input[name="createTask"]').check();
    await page.getByRole('button', { name: 'Submit Issue' }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);

    await openHash(page, '#backlog');
    await expect(page.getByRole('cell', { name: title })).toBeVisible();
  });

  test('availability can schedule meeting on calendar', async ({ page }) => {
    const title = `E2E Meeting ${Date.now()}`;
    await openHash(page, '#team-availability');
    await page.locator('#avail-add-meeting').waitFor({ state: 'visible' });
    await page.locator('#avail-add-meeting').click();
    await expect(page.locator('#modal-host')).not.toHaveClass(/hidden/);
    await expect(page.locator('#meeting-form')).toBeVisible();
    await page.locator('#meeting-title').fill(title);
    await page.locator('#meeting-date').fill('2026-05-15');
    await page.locator('#meeting-time').fill('2:00 PM');
    await page.locator('#meeting-form').getByRole('button', { name: /add to sprint calendar/i }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);

    await openHash(page, '#calendar');
    await page.locator('[data-cal-date="2026-05-15"]').click();
    await expect(page.locator('#calendar-sidebar')).toContainText(title);
  });

  test('calendar shows sprint deadline chip on sprint end date', async ({ page }) => {
    await openHash(page, '#calendar');
    const endCell = page.locator('[data-cal-date="2026-05-19"]');
    await expect(endCell).toContainText('Sprint ends');
  });
});
