/**
 * Defaults for new sprint tasks (due date, owner, AI tags).
 * @module utils/taskHelpers
 */

import { buildTeamContextForAi } from './teamContext.js';
import { resolveOwnerFromRoster, pickOwnerForTaskTitle } from './aiAssignment.js';
/**
 * Default due date: sprint end, or ~1 week from today.
 * @param {object} [sprint]
 * @returns {string} YYYY-MM-DD
 */
export function defaultDueForSprint(sprint) {
  if (sprint?.end) return sprint.end;
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Fill missing owner, due, and AI metadata before save.
 * @param {import('../core/store.js').Store} store
 * @param {object} input
 * @param {{ fromAi?: boolean }} [opts]
 * @returns {object}
 */
export function enrichNewTask(store, input, opts = {}) {
  const sprint = store.getState().sprints.find((s) => s.id === input.sprintId)
    || store.getSelectedSprint()
    || store.getActiveSprint();

  const ctx = buildTeamContextForAi(store.getState(), input.sprintId ?? sprint?.id);
  const owner = resolveOwnerFromRoster(
    (input.owner || '').trim() || pickOwnerForTaskTitle(input.title || '', ctx.members),
    ctx.members,
  ) || store.currentAuthUser?.name || 'Unassigned';

  const due = input.due || defaultDueForSprint(sprint);

  const tags = [...(input.tags || [])];
  if (opts.fromAi && !tags.includes('AI Suggested')) {
    tags.push('AI Suggested');
  }

  return {
    ...input,
    sprintId: input.sprintId ?? sprint?.id ?? 2,
    owner,
    due,
    status: input.status || 'open',
    priority: input.priority || 'medium',
    tags: tags.length ? tags : undefined,
    source: opts.fromAi ? 'ai' : input.source,
  };
}

/**
 * Tasks in the selected sprint with no due date (for calendar sidebar).
 * @param {import('../core/store.js').Store} store
 * @param {number} [sprintId]
 * @returns {object[]}
 */
export function getSprintTasksWithoutDue(store, sprintId) {
  const sid = sprintId ?? store.getSelectedSprint()?.id;
  return store.getState().tasks.filter(
    (t) => (!sid || t.sprintId === sid) && !t.due && t.status !== 'done' && t.status !== 'resolved',
  );
}

/**
 * Backfill missing due/owner on loaded tasks so calendar & activity show them.
 * @param {import('../core/store.js').Store} store
 * @returns {boolean} whether any task was updated
 */
export function normalizeTasksInStore(store) {
  const sprints = store.getState().sprints;
  let changed = false;
  store.getState().tasks.forEach((t) => {
    if (!t.due) {
      const sprint = sprints.find((s) => s.id === t.sprintId);
      t.due = defaultDueForSprint(sprint);
      changed = true;
    }
    if (!t.owner) {
      t.owner = store.currentAuthUser?.name || store.getUsers()[0]?.name || 'Unassigned';
      changed = true;
    }
  });
  return changed;
}
