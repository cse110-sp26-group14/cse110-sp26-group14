/**
 * Per-day team context for calendar sidebar.
 * @module utils/calendarDayContext
 */

/**
 * @typedef {object} DayTeamContext
 * @property {object[]} reports
 * @property {object[]} tasks
 * @property {object[]} issues
 * @property {{ user: object, report?: object, tasks: object[] }[]} byUser
 */

/**
 * Gathers the team context for a single day: the reports, tasks, and notable
 * issues for that date (optionally filtered by sprint), plus a per-user
 * breakdown pairing each user with their report and owned tasks.
 * @param {import('../core/store.js').Store} store
 * @param {string} iso - YYYY-MM-DD
 * @param {number} [sprintId]
 * @returns {DayTeamContext}
 */
export function getDayTeamContext(store, iso, sprintId) {
  const users = store.getUsers();
  const reports = store.getReports().filter((r) => {
    if (r.date !== iso) return false;
    if (sprintId != null && r.sprintId != null && Number(r.sprintId) !== Number(sprintId)) {
      return false;
    }
    return true;
  });
  const tasks = store.getState().tasks.filter((t) => {
    if (t.due !== iso) return false;
    if (sprintId != null && t.sprintId != null && Number(t.sprintId) !== Number(sprintId)) {
      return false;
    }
    return true;
  });
  const issues = store.getIssues().filter(
    (i) => i.created === iso || (i.status === 'open' && (i.severity === 'high' || i.severity === 'critical')),
  );

  const byUser = users.map((u) => {
    const report = reports.find((r) => Number(r.userId) === Number(u.id));
    const userTasks = tasks.filter((t) => t.owner === u.name);
    return { user: u, report, tasks: userTasks };
  });

  return { reports, tasks, issues, byUser };
}