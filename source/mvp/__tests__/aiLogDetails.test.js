import { AILogView } from '../js/views/AILogView.js';
import { Store } from '../js/core/store.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

describe('AILogView — suggestion log details', () => {
  test('renderDetail shows parse failure warning when parseFailed', () => {
    const store = new Store(INITIAL_DATA);
    const view = new AILogView(store);
    const html = view.renderDetail({
      id: 99,
      type: 'Suggestion',
      title: 'AI Sprint Tasks Suggested',
      status: 'pending',
      content: 'Review fallback tasks',
      timestamp: '2026-05-13T10:00:00',
      details: {
        input: 'Ship onboarding',
        parseFailed: true,
        parseError: 'invalid JSON',
        source: 'deepseek',
        suggestions: [
          { title: 'Ship onboarding — spike', priority: 'high', due: '2026-05-19', owner: 'Maya Patel' },
        ],
        modelResponsePreview: 'not valid json {{{',
      },
    });
    expect(html).toContain('Parse failed');
    expect(html).toContain('invalid JSON');
    expect(html).toContain('Ship onboarding');
    expect(html).toContain('not valid json');
  });

  test('renderDetail shows success hint when parse succeeded', () => {
    const store = new Store(INITIAL_DATA);
    const view = new AILogView(store);
    const html = view.renderDetail({
      id: 100,
      type: 'Suggestion',
      title: 'AI Sprint Tasks Suggested',
      status: 'pending',
      content: 'Review 2 tasks',
      timestamp: '2026-05-13T11:00:00',
      details: {
        input: 'Bug fixes',
        parseFailed: false,
        source: 'deepseek',
        suggestions: [{ title: 'Fix login', priority: 'high', due: '2026-05-15', owner: 'Alex Chen' }],
      },
    });
    expect(html).toContain('parsed successfully');
    expect(html).not.toContain('Parse failed');
  });
});
