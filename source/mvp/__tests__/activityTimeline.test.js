import { buildActivityTimeline } from '../js/utils/activityTimeline.js';
import { Store } from '../js/core/store.js';

describe('activityTimeline', () => {
  test('buildActivityTimeline merges reports and issues', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-01', end: '2026-05-20' }],
      users: [{ id: 1, name: 'A' }],
      reports: [{
        id: 1, userId: 1, sprintId: 2, date: '2026-05-13', status: 'In Progress',
        progress: 'Done API', timestamp: '2026-05-13T10:00:00',
      }],
      issues: [{
        id: 1, title: 'Bug', sprintId: 2, created: '2026-05-12', severity: 'high', status: 'open',
      }],
      tasks: [{ id: 1, title: 'Task', sprintId: 2, due: '2026-05-14', owner: 'A', priority: 'high' }],
      aiLogs: [],
      meetings: [],
      availability: {},
    });

    const items = buildActivityTimeline(store, 2);
    expect(items.some((i) => i.kind === 'report')).toBe(true);
    expect(items.some((i) => i.kind === 'issue')).toBe(true);
    expect(items.some((i) => i.kind === 'task')).toBe(true);
  });

  test('buildActivityTimeline includes tasks without due date', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-01', end: '2026-05-20' }],
      users: [{ id: 1, name: 'A' }],
      reports: [],
      issues: [],
      tasks: [{ id: 1, title: 'Undated', sprintId: 2, owner: 'A', priority: 'medium' }],
      aiLogs: [],
      meetings: [],
      availability: {},
    });
    const items = buildActivityTimeline(store, 2);
    expect(items.some((i) => i.kind === 'task' && i.title.includes('Undated'))).toBe(true);
  });
});
