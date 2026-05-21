import { getMissingCheckInUsers, getCheckInStats } from '../js/utils/teamStats.js';

describe('teamStats', () => {
  const users = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const date = '2026-05-13';

  test('getMissingCheckInUsers lists users without a report', () => {
    const reports = [{ userId: 1, date }];
    const missing = getMissingCheckInUsers(reports, users, date);
    expect(missing).toHaveLength(2);
    expect(missing.map((u) => u.id)).toEqual([2, 3]);
  });

  test('getCheckInStats counts blockers', () => {
    const reports = [
      { userId: 1, date, blockers: 'CI down' },
      { userId: 2, date, blockers: 'None' },
    ];
    const stats = getCheckInStats(reports, users, date);
    expect(stats.submitted).toBe(2);
    expect(stats.blockers).toBe(1);
  });
});
