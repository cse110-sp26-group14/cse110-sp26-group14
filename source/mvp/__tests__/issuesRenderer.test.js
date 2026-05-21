import { renderReportCard, renderActivityCard } from '../js/views/renderers/issuesRenderer.js';

describe('issuesRenderer', () => {
  test('renderReportCard escapes blocker HTML', () => {
    const html = renderReportCard(
      {
        date: '2026-05-13',
        status: 'Blocked',
        mood: 'Stressed',
        progress: 'Work',
        blockers: '<script>x</script>',
        notes: '',
      },
      'Alex',
      () => '<span class="badge">X</span>',
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('renderActivityCard shows kind and title', () => {
    const html = renderActivityCard({
      kind: 'issue',
      ts: '2026-05-13T10:00:00',
      title: 'Staging down',
      body: '502 errors',
      meta: 'critical • open',
    });
    expect(html).toContain('issue');
    expect(html).toContain('Staging down');
  });
});
