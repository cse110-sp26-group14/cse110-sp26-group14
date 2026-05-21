import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTeamContextForAi, formatTeamContextForPrompt } from '../src/teamContext.js';

describe('teamContext (worker)', () => {
  test('assumes available when no check-in', () => {
    const state = {
      sprints: [{ id: 2, name: 'S2', start: '2026-05-01', end: '2026-05-20', status: 'active' }],
      users: [{ id: 1, name: 'A', role: 'Backend', availability: {} }],
      reports: [],
      availability: {},
    };
    const ctx = buildTeamContextForAi(state, 2);
    assert.equal(ctx.members[0].assumedAvailable, true);
    assert.match(formatTeamContextForPrompt(ctx), /ASSUME HAS TIME/);
  });

  test('blocked check-in lowers capacity', () => {
    const state = {
      sprints: [{ id: 2, name: 'S2', start: '2026-05-01', end: '2026-05-20', status: 'active' }],
      users: [{ id: 2, name: 'Alex', role: 'Frontend', availability: {} }],
      reports: [{
        userId: 2,
        sprintId: 2,
        date: '2026-05-13',
        status: 'Blocked',
        blockers: 'CI',
        progress: 'OAuth',
        timestamp: '2026-05-13T12:00:00Z',
      }],
      availability: {},
    };
    const m = buildTeamContextForAi(state, 2).members[0];
    assert.equal(m.capacity, 'low');
  });
});
