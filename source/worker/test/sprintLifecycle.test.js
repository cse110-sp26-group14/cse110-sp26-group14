import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applySprintLifecycle } from '../src/sprintLifecycle.js';

describe('sprintLifecycle (worker)', () => {
  it('completes ended sprint and activates next by date', () => {
    const sprints = [
      { id: 2, start: '2026-05-12', end: '2026-05-19', status: 'active' },
      { id: 3, start: '2026-05-22', end: '2026-05-29', status: 'planned' },
    ];
    applySprintLifecycle(sprints, '2026-05-23');
    assert.equal(sprints.find((s) => s.id === 2)?.status, 'completed');
    assert.equal(sprints.find((s) => s.id === 3)?.status, 'active');
  });
});
