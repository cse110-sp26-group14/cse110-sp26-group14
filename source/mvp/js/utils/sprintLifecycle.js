/**
 * Sprint status and default selection from calendar dates (start/end).
 * @module utils/sprintLifecycle
 */

import { todayISO } from './dates.js';

/**
 * @param {string} today YYYY-MM-DD
 * @param {string} start
 * @param {string} end
 */
export function isInSprintWindow(today, start, end) {
  return today >= start && today <= end;
}

/**
 * @param {string} today
 * @param {string} end
 */
export function isPastSprintEnd(today, end) {
  return today > end;
}

/**
 * @param {string} today
 * @param {string} start
 */
export function isBeforeSprintStart(today, start) {
  return today < start;
}

/**
 * Derive status from dates. At most one sprint is `active` (lowest id among in-window).
 * @param {{ id: number|string, start: string, end: string, status?: string }} sprint
 * @param {string} today
 * @param {number|string|null} activeId
 * @returns {'completed'|'active'|'planned'}
 */
export function deriveSprintStatus(sprint, today, activeId) {
  if (isPastSprintEnd(today, sprint.end)) return 'completed';
  if (isBeforeSprintStart(today, sprint.start)) return 'planned';
  return Number(sprint.id) === Number(activeId) ? 'active' : 'planned';
}

/**
 * @param {Array<{ id: number|string, start: string, end: string, status?: string }>} sprints
 * @param {string} [today]
 * @returns {boolean} whether any status changed
 */
export function applySprintLifecycle(sprints, today = todayISO()) {
  const sorted = [...sprints].sort((a, b) => Number(a.id) - Number(b.id));
  const inWindow = sorted.filter((s) => isInSprintWindow(today, s.start, s.end));
  const activeId = inWindow.length > 0 ? inWindow[0].id : null;

  let changed = false;
  for (const s of sprints) {
    const next = deriveSprintStatus(s, today, activeId);
    if (s.status !== next) {
      s.status = next;
      changed = true;
    }
  }
  return changed;
}

/**
 * Default sprint when user has not chosen one in the header (creation order = ascending id).
 * @param {Array<{ id: number|string, start: string, end: string, status?: string, name?: string }>} sprints
 * @param {string} [today]
 * @returns {object|undefined}
 */
export function pickDefaultSprint(sprints, today = todayISO()) {
  if (!sprints?.length) return undefined;

  const sorted = [...sprints].sort((a, b) => Number(a.id) - Number(b.id));
  const inWindow = sorted.filter((s) => isInSprintWindow(today, s.start, s.end));
  const activeId = inWindow.length > 0 ? inWindow[0].id : null;
  const statusOf = (s) => deriveSprintStatus(s, today, activeId);

  const active = sorted.find((s) => statusOf(s) === 'active');
  if (active) return active;

  const started = sorted.filter(
    (s) => !isBeforeSprintStart(today, s.start) && statusOf(s) !== 'completed',
  );
  if (started.length) return started[0];

  const upcoming = sorted.find((s) => isBeforeSprintStart(today, s.start));
  if (upcoming) return upcoming;

  return sorted[sorted.length - 1];
}
