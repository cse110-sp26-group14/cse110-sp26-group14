/**
 * Unified activity feed from reports, issues, tasks, AI logs.
 * @module utils/activityTimeline
 */

/**
 * @typedef {object} ActivityItem
 * @property {'report'|'issue'|'task'|'ai'} kind
 * @property {string} ts
 * @property {string} title
 * @property {string} body
 * @property {string} meta
 */

/**
 * @param {import('../core/store.js').Store} store
 * @param {number} [sprintId]
 * @returns {ActivityItem[]}
 */
export function buildActivityTimeline(store, sprintId) {
  const items = [];
  const sprint = sprintId ?? store.getSelectedSprint()?.id;

  store.getReports().forEach((r) => {
    if (sprint != null && r.sprintId != null && Number(r.sprintId) !== Number(sprint)) return;
    const user = store.getUsers().find((u) => Number(u.id) === Number(r.userId));
    items.push({
      kind: 'report',
      ts: r.timestamp || `${r.date}T12:00:00`,
      title: `Check-in: ${user?.name || 'Member'}`,
      body: `${r.status} — ${(r.progress || '').slice(0, 120)}`,
      meta: r.date,
    });
  });

  store.getIssues().forEach((i) => {
    if (sprint != null && i.sprintId != null && Number(i.sprintId) !== Number(sprint)) return;
    items.push({
      kind: 'issue',
      ts: `${i.created || '2026-01-01'}T09:00:00`,
      title: i.title,
      body: i.description || '',
      meta: `${i.severity} • ${i.status}`,
    });
  });

  store.getState().tasks.forEach((t) => {
    if (sprint != null && t.sprintId != null && Number(t.sprintId) !== Number(sprint)) return;
    if (!t.due) return;
    items.push({
      kind: 'task',
      ts: `${t.due}T08:00:00`,
      title: `Task due: ${t.title}`,
      body: `${t.owner || 'Unassigned'} • ${t.priority}`,
      meta: t.due,
    });
  });

  store.getAiLogs().forEach((l) => {
    items.push({
      kind: 'ai',
      ts: l.timestamp || '',
      title: l.title,
      body: (l.content || '').slice(0, 160),
      meta: `${l.type} • ${l.status}`,
    });
  });

  return items.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
}
