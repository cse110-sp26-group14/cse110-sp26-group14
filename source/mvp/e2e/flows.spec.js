import { test, expect } from '@playwright/test';
import { loginAsDemo, openHash } from './helpers.js';

test.describe('Core flows — local mode', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('daily check-in modal saves and shows on dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Daily Check-In' }).click();
    await expect(page.locator('#modal-host')).not.toHaveClass(/hidden/);
    await page.locator('#checkin-progress').fill('E2E: finished API wiring');
    await page.locator('#checkin-form').getByRole('button', { name: 'Submit Check-In' }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);
    await openHash(page, '#dashboard');
    await expect(page.locator('#dashboard-edit-checkin')).toContainText('Edit Check-In', { timeout: 10000 });
    await expect(page.getByText('E2E: finished API wiring')).toBeVisible();
  });

  test('create issue appears in issues list', async ({ page }) => {
    const title = `E2E Issue ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Issue' }).click();
    await page.locator('#issue-title').fill(title);
    await page.locator('#issue-description').fill('Found during automated test');
    await page.getByRole('button', { name: 'Submit Issue' }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);

    await openHash(page, '#issues');
    await expect(page.locator('.issue-title', { hasText: title })).toBeVisible();
  });

  test('add note saves to AI log', async ({ page }) => {
    const title = `E2E Note ${Date.now()}`;
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.locator('#note-title').fill(title);
    await page.locator('#note-content').fill('Automated note body');
    page.once('dialog', (d) => d.accept());
    await page.locator('#note-form').getByRole('button', { name: /save/i }).click();

    await openHash(page, '#ai-log');
    await expect(page.locator('h4', { hasText: title })).toBeVisible();
    await expect(page.locator('#log-detail')).toContainText('Automated note body');
  });

  test('backlog add task shows new row', async ({ page }) => {
    const title = `E2E Task ${Date.now()}`;
    await openHash(page, '#backlog');
    await page.locator('#backlog-add-task').click();
    await page.locator('#task-title').fill(title);
    await page.locator('#task-form').getByRole('button', { name: /add task/i }).click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);
    await expect(page.getByRole('cell', { name: title })).toBeVisible();
  });

  test('mark issue resolved hides resolve button', async ({ page }) => {
    const title = `E2E Resolve ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Issue' }).click();
    await page.locator('#issue-title').fill(title);
    await page.locator('#issue-description').fill('To resolve');
    await page.getByRole('button', { name: 'Submit Issue' }).click();

    await openHash(page, '#issues');
    const card = page.locator('.issue-card', { hasText: title });
    await card.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(card.getByRole('button', { name: 'Mark resolved' })).toHaveCount(0);
    await expect(card.getByText('RESOLVED')).toBeVisible();
  });

  test('availability form opens from quick action', async ({ page }) => {
    await page.getByRole('button', { name: 'Availability Check' }).click();
    await expect(page.locator('#availability-form')).toBeVisible();
    await page.locator('.close-modal').click();
    await expect(page.locator('#modal-host')).toHaveClass(/hidden/);
  });

  test('header search jumps to issues with filter', async ({ page }) => {
    await page.locator('#header-search').fill('staging');
    await page.locator('#header-search').press('Enter');
    await expect(page).toHaveURL(/#issues/);
    await expect(page.locator('#issues-search-input')).toHaveValue('staging');
  });

  test('calendar day click updates sidebar', async ({ page }) => {
    await openHash(page, '#calendar');
    await page.locator('[data-cal-date="2026-05-14"]').click();
    await expect(page.locator('#calendar-sidebar')).toContainText('May 14');
    await expect(page.locator('#calendar-sidebar')).toContainText('Sprint Standup');
  });
});
