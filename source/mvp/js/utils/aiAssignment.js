/**
 * Local AI suggestion defaults: owner/due from team context (roles, capacity).
 * @module utils/aiAssignment
 */

import { defaultDueForSprint } from './taskHelpers.js';

/** Role keyword → preferred roles (substring match on user.role). */
const ROLE_HINTS = [
  { keys: ['api', 'backend', 'schema', 'database', 'server'], roles: ['backend', 'engineer'] },
  { keys: ['ui', 'frontend', 'oauth', 'react', 'css'], roles: ['frontend'] },
  { keys: ['test', 'qa', 'e2e', 'flaky'], roles: ['qa', 'test'] },
  { keys: ['doc', 'onboarding', 'readme'], roles: ['doc', 'documentation'] },
  { keys: ['design', 'review', 'ux'], roles: ['frontend', 'manager', 'design'] },
  { keys: ['deploy', 'staging', 'ci', 'pipeline'], roles: ['backend', 'devops', 'engineer'] },
];

/**
 * @param {string} title
 * @param {import('./teamContext.js').TeamMemberContext[]} members
 * @returns {string|null} member name
 */
export function pickOwnerForTaskTitle(title, members) {
  if (!members?.length) return null;
  const lower = title.toLowerCase();
  const scored = members.map((m) => {
    let score = 0;
    if (m.assumedAvailable) score += 2;
    if (m.capacity === 'high') score += 3;
    else if (m.capacity === 'medium') score += 1;
    if (m.freeRatio >= 0.6) score += 2;
    ROLE_HINTS.forEach(({ keys, roles }) => {
      if (keys.some((k) => lower.includes(k)) && roles.some((r) => m.role.toLowerCase().includes(r))) {
        score += 5;
      }
    });
    if (m.capacity === 'low') score -= 4;
    return { name: m.name, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].name : members[0].name;
}

/**
 * @param {string} ownerName
 * @param {import('./teamContext.js').TeamMemberContext[]} members
 * @returns {string}
 */
export function resolveOwnerFromRoster(ownerName, members) {
  const trimmed = (ownerName || '').trim();
  if (!trimmed) return members[0]?.name || 'Unassigned';
  const exact = members.find((m) => m.name === trimmed);
  if (exact) return exact.name;
  const partial = members.find(
    (m) => m.name.toLowerCase().includes(trimmed.toLowerCase())
      || trimmed.toLowerCase().includes(m.name.toLowerCase()),
  );
  return partial?.name || trimmed;
}

/**
 * Apply owner/due defaults to AI suggestions using team context.
 * @param {object[]} suggestions
 * @param {import('./teamContext.js').TeamContext} teamContext
 * @returns {object[]}
 */
export function applyAiTaskSuggestions(suggestions, teamContext) {
  const members = teamContext.members || [];
  const defaultDue = defaultDueForSprint(teamContext.sprint);
  return suggestions.map((s) => {
    const owner = resolveOwnerFromRoster(
      s.owner || pickOwnerForTaskTitle(s.title || '', members),
      members,
    );
    return {
      ...s,
      owner,
      due: s.due || defaultDue,
      priority: s.priority || 'medium',
    };
  });
}
