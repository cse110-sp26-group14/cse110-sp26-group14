import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Mirrors parse branch in openai.js generateTaskSuggestions (without calling DeepSeek).
 * @param {string} raw
 * @param {string} goals
 * @param {string} fallbackDue
 */
function parseTaskSuggestions(raw, goals, fallbackDue) {
  let tasks = [];
  let parseFailed = false;
  let parseError = null;
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      tasks = parsed;
    } else {
      parseFailed = true;
      parseError = Array.isArray(parsed) ? 'empty array' : 'response was not a JSON array';
    }
  } catch (err) {
    parseFailed = true;
    parseError = err?.message || 'invalid JSON';
  }
  if (parseFailed) {
    tasks = [
      { title: `${goals} — spike`, priority: 'high', due: fallbackDue, owner: null },
      { title: `${goals} — implementation`, priority: 'medium', due: fallbackDue, owner: null },
      { title: `${goals} — QA pass`, priority: 'medium', due: fallbackDue, owner: null },
    ];
  }
  return { tasks, parseFailed, parseError };
}

describe('AI task suggestion JSON parse', () => {
  test('valid JSON array is accepted', () => {
    const raw = JSON.stringify([
      { title: 'Task A', priority: 'high', due: '2026-05-15', owner: 'Maya Patel' },
    ]);
    const out = parseTaskSuggestions(raw, 'Goals', '2026-05-19');
    assert.equal(out.parseFailed, false);
    assert.equal(out.tasks.length, 1);
    assert.equal(out.tasks[0].title, 'Task A');
  });

  test('invalid JSON uses fallback tasks and parseFailed', () => {
    const out = parseTaskSuggestions('not json', 'Ship MVP', '2026-05-19');
    assert.equal(out.parseFailed, true);
    assert.ok(out.parseError);
    assert.equal(out.tasks.length, 3);
    assert.match(out.tasks[0].title, /Ship MVP — spike/);
    assert.equal(out.tasks[0].due, '2026-05-19');
  });

  test('empty array triggers fallback', () => {
    const out = parseTaskSuggestions('[]', 'Goals', '2026-05-19');
    assert.equal(out.parseFailed, true);
    assert.equal(out.parseError, 'empty array');
  });
});
