import { enrichNewIssue } from '../js/utils/issueHelpers.js';
import { Store } from '../js/core/store.js';

describe('issueHelpers', () => {
  test('enrichNewIssue sets assignee and due', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-12', end: '2026-05-19' }],
      users: [{ id: 1, name: 'Maya Patel', role: 'Project Manager' }],
      tasks: [],
      issues: [],
      reports: [],
      aiLogs: [],
      meetings: [],
      availability: {},
    });
    store.setCurrentAuthUser({ name: 'Maya Patel' });
    const issue = enrichNewIssue(store, {
      title: 'Fix flaky E2E test',
      severity: 'high',
      sprintId: 2,
      description: 'Checkout flow',
    });
    expect(issue.assignee).toBeTruthy();
    expect(issue.due).toBe('2026-05-19');
  });
});
