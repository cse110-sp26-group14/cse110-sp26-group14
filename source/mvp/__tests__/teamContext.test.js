import { buildTeamContextForAi, summarizeAvailabilitySlots } from '../js/utils/teamContext.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

describe('teamContext', () => {
  test('summarizeAvailabilitySlots assumes full day when empty', () => {
    const s = summarizeAvailabilitySlots({});
    expect(s.hasData).toBe(false);
    expect(s.freeRatio).toBe(1);
  });

  test('buildTeamContextForAi marks missing check-in as assumed available', () => {
    const state = {
      ...INITIAL_DATA,
      reports: INITIAL_DATA.reports.filter((r) => Number(r.userId) !== 5),
    };
    const ctx = buildTeamContextForAi(state, 2);
    const sam = ctx.members.find((m) => m.name === 'Sam Rivera');
    expect(sam.assumedAvailable).toBe(true);
    expect(sam.hasCheckIn).toBe(false);
    expect(sam.capacity).toBe('high');
  });

  test('buildTeamContextForAi uses check-in blockers for capacity', () => {
    const state = {
      ...INITIAL_DATA,
      reports: [
        {
          id: 99,
          userId: 2,
          sprintId: 2,
          date: '2026-05-13',
          status: 'Blocked',
          blockers: 'Staging',
          progress: 'OAuth',
          timestamp: '2026-05-13T12:00:00',
        },
      ],
    };
    const alex = buildTeamContextForAi(state, 2).members.find((m) => m.name === 'Alex Chen');
    expect(alex.hasCheckIn).toBe(true);
    expect(alex.capacity).toBe('low');
  });
});
