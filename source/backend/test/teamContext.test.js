import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTeamContextForAi, formatTeamContextForPrompt } from '../lib/teamContext.js';

describe('teamContext (backend)', () => {
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
});
