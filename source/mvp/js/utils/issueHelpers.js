/**
 * Defaults for new issues (assignee, due date).
 * @module utils/issueHelpers
 */

import { defaultDueForSprint } from './taskHelpers.js';
import { pickOwnerForTaskTitle, resolveOwnerFromRoster } from './aiAssignment.js';
import { buildTeamContextForAi } from './teamContext.js';

/**
 * Fills in defaults for a new issue: resolves the sprint, derives an assignee
 * (explicit value, else a role-based pick from the roster, else the current
 * user), and defaults the due date, status, severity, and author.
 * @param {import('../core/store.js').Store} store
 * @param {object} input
 * @returns {object}
 */
export function enrichNewIssue(store, input) {
  const sprint = store.getState().sprints.find((s) => s.id === input.sprintId)
    || store.getSelectedSprint()
    || store.getActiveSprint();
  const ctx = buildTeamContextForAi(store.getState(), sprint?.id);

  const assignee = (input.assignee || '').trim()
    || resolveOwnerFromRoster(
      pickOwnerForTaskTitle(input.title || '', ctx.members),
      ctx.members,
    )
    || store.currentAuthUser?.name
    || null;

  const due = input.due || defaultDueForSprint(sprint);

  return {
    ...input,
    sprintId: input.sprintId ?? sprint?.id ?? 2,
    assignee,
    due,
    status: input.status || 'open',
    severity: input.severity || 'medium',
    author: input.author || store.currentAuthUser?.name || 'Team Member',
  };
}