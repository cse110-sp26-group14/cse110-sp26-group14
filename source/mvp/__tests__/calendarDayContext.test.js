import { getDayTeamContext } from '../js/utils/calendarDayContext.js';
import { Store } from '../js/core/store.js';

describe('calendarDayContext', () => {
  test('getDayTeamContext returns per-user report and tasks', () => {
    const store = new Store({
      sprints: [{ id: 2, status: 'active' }],
      users: [
        { id: 1, name: 'Maya' },
        { id: 2, name: 'Alex' },
      ],
      reports: [{
        id: 1, userId: 1, sprintId: 2, date: '2026-05-13', status: 'In Progress',
        progress: 'API', blockers: 'None', mood: 'Good',
      }],
      tasks: [{ id: 1, title: 'Ship', owner: 'Maya', sprintId: 2, due: '2026-05-13' }],
      issues: [],
      aiLogs: [],
      meetings: [],
      availability: {},
    });

    const ctx = getDayTeamContext(store, '2026-05-13', 2);
    expect(ctx.reports).toHaveLength(1);
    expect(ctx.byUser.find((r) => r.user.name === 'Maya')?.report).toBeTruthy();
    expect(ctx.byUser.find((r) => r.user.name === 'Alex')?.report).toBeFalsy();
  });
});
