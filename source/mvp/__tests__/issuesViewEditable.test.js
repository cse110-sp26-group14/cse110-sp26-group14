import { Store } from '../js/core/store.js';
import { IssuesView } from '../js/views/IssuesView.js';

describe('IssuesView inline editing', () => {
  test('renders editable issue controls with escaped values', () => {
    const store = new Store({
      sprints: [{ id: 2, name: 'S2', status: 'active', start: '2026-05-01', end: '2026-05-20' }],
      users: [{ id: 1, name: 'Maya <Lead>', role: 'PM' }],
      tasks: [],
      issues: [{
        id: 1,
        title: '<script>alert(1)</script>',
        severity: 'high',
        status: 'open',
        tags: ['Bug'],
        author: 'Maya',
        assignee: 'Maya <Lead>',
        sprintId: 2,
        created: '2026-05-13',
        description: '<b>broken</b>',
        due: '2026-05-20',
      }],
      reports: [],
      aiLogs: [],
      meetings: [],
      availability: {},
    });

    const html = new IssuesView(store).render();
    expect(html).toContain('data-kind="issue"');
    expect(html).toContain('data-field="title"');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;broken&lt;/b&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
