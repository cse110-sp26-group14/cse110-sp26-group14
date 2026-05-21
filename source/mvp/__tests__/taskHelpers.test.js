import { defaultDueForSprint, enrichNewTask, normalizeTasksInStore } from '../js/utils/taskHelpers.js';
import { Store } from '../js/core/store.js';

describe('taskHelpers', () => {
  test('defaultDueForSprint uses sprint end', () => {
    expect(defaultDueForSprint({ end: '2026-05-20' })).toBe('2026-05-20');
  });

  test('enrichNewTask fills owner and due', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-01', end: '2026-05-20' }],
      users: [{ id: 1, name: 'Alex Chen' }],
      tasks: [],
      issues: [],
      reports: [],
      aiLogs: [],
      meetings: [],
      availability: {},
    });
    store.setCurrentAuthUser({ name: 'Maya Patel' });
    const task = enrichNewTask(store, { title: 'Spike', sprintId: 2, owner: 'Maya Patel' }, { fromAi: true });
    expect(task.due).toBe('2026-05-20');
    expect(task.owner).toBe('Maya Patel');
    expect(task.tags).toContain('AI Suggested');
    expect(task.source).toBe('ai');
  });

  test('normalizeTasksInStore backfills missing due', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-01', end: '2026-05-20' }],
      users: [{ id: 1, name: 'Alex Chen' }],
      tasks: [{ id: 1, title: 'Old task', sprintId: 2, priority: 'medium', status: 'open' }],
      issues: [],
      reports: [],
      aiLogs: [],
      meetings: [],
      availability: {},
    });
    expect(normalizeTasksInStore(store)).toBe(true);
    expect(store.getState().tasks[0].due).toBe('2026-05-20');
    expect(store.getState().tasks[0].owner).toBe('Alex Chen');
  });
});
