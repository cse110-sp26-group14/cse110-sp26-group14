/**
 * Sprint status and default selection from calendar dates (start/end).
 * @module utils/sprintLifecycle
 */

import { todayISO } from './dates.js';

/**
 * Returns whether the given day falls within the inclusive [start, end] sprint window.
 * @param {string} today YYYY-MM-DD
 * @param {string} start
 * @param {string} end
 */
export function isInSprintWindow(today, start, end) {
  return today >= start && today <= end;
}

/**
 * Returns whether the given day is after the sprint's end date.
 * @param {string} today
 * @param {string} end
 */
export function isPastSprintEnd(today, end) {
  return today > end;
}

/**
 * Returns whether the given day is before the sprint's start date.
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
 * Recomputes each sprint's status from the given day, designating the
 * lowest-id in-window sprint as active, and reports whether any status changed.
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
 * Uses the already-computed `status` field on each sprint (set by applySprintLifecycle /
 * reconcileSprints) so that the result stays consistent with whatever date was passed to
 * reconcileSprints — rather than recalculating against the real wall-clock date.
 * @param {Array<{ id: number|string, status?: string }>} sprints
 * @returns {object|undefined}
 */
export function pickDefaultSprint(sprints) {
  if (!sprints?.length) return undefined;

  const sorted = [...sprints].sort((a, b) => Number(a.id) - Number(b.id));

  // 1. Prefer any sprint already marked active
  const active = sorted.find((s) => s.status === 'active');
  if (active) return active;

  // 2. Next best: earliest planned (upcoming) sprint
  const upcoming = sorted.find((s) => s.status === 'planned');
  if (upcoming) return upcoming;

  // 3. All completed — return the most recent one
  return sorted[sorted.length - 1];
}