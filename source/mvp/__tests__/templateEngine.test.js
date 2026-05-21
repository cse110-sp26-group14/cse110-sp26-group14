import { escapeHtml, fillTemplate, renderTemplate } from '../js/utils/templateEngine.js';

describe('templateEngine', () => {
  test('escapeHtml escapes special characters', () => {
    expect(escapeHtml('<script>&"')).toBe('&lt;script&gt;&amp;&quot;');
  });

  test('fillTemplate replaces placeholders', () => {
    const html = fillTemplate('<p>{{name}}</p>', { name: 'Alex' });
    expect(html).toBe('<p>Alex</p>');
  });

  test('fillTemplate escapes by default', () => {
    const html = fillTemplate('<p>{{x}}</p>', { x: '<b>' });
    expect(html).toBe('<p>&lt;b&gt;</p>');
  });

  test('renderTemplate reads tpl-form-daily-checkin', () => {
    const html = renderTemplate('tpl-form-daily-checkin');
    expect(html).toContain('id="checkin-form"');
    expect(html).toContain('name="notes"');
  });
});
