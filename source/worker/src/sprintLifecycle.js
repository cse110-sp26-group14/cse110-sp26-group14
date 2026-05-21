/**
 * Sprint status from calendar dates (mirrors mvp/js/utils/sprintLifecycle.js).
 * @module sprintLifecycle
 */

function isInSprintWindow(today, start, end) {
  return today >= start && today <= end;
}

function isPastSprintEnd(today, end) {
  return today > end;
}

function isBeforeSprintStart(today, start) {
  return today < start;
}

function deriveSprintStatus(sprint, today, activeId) {
  if (isPastSprintEnd(today, sprint.end)) return 'completed';
  if (isBeforeSprintStart(today, sprint.start)) return 'planned';
  return Number(sprint.id) === Number(activeId) ? 'active' : 'planned';
}

/**
 * @param {Array<{ id: number, start: string, end: string, status?: string }>} sprints
 * @param {string} today YYYY-MM-DD
 * @returns {boolean}
 */
export function applySprintLifecycle(sprints, today) {
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
 * @param {D1Database} db
 * @param {string} [today]
 */
export async function syncSprintStatusesInDb(db, today = new Date().toISOString().split('T')[0]) {
  const { results } = await db.prepare(
    'SELECT id, start_date AS start, end_date AS end, status FROM sprints ORDER BY id',
  ).all();
  const sprints = results || [];
  const changed = applySprintLifecycle(sprints, today);
  if (changed) {
    for (const s of sprints) {
      await db.prepare('UPDATE sprints SET status = ? WHERE id = ?').bind(s.status, s.id).run();
    }
  }
  return changed;
}
