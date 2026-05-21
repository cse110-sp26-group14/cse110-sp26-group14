import { test, expect } from '@playwright/test';
import { loginAsDemo, openHash } from './helpers.js';

test.describe('MVP features — sprint, reports, meetings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('header sprint selector switches dashboard sprint', async ({ page }) => {
    await expect(page.locator('#header-sprint-select')).toBeVisible();
    await page.locator('#header-sprint-select').selectOption('3');
    await expect(page.locator('#header-sprint-badge')).toContainText('Sprint 3');
    await expect(page.locator('.view-subtitle').first()).toContainText('Sprint 3');
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
    await page.locator('#avail-add-meeting').click();
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
