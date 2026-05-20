import { buildTeamSummary, suggestSprintTasks } from '../js/services/aiSummaryService.js';

describe('aiSummaryService', () => {
  test('buildTeamSummary counts blockers and missing check-ins', () => {
    const users = [{ id: 1 }, { id: 2 }];
    const reports = [
      { userId: 1, date: new Date().toISOString().slice(0, 10), status: 'Blocked', blockers: 'CI failing' },
    ];
    const result = buildTeamSummary(reports, users, 2);
    expect(result.blockers.length).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.content).toMatch(/blocker/i);
  });

  test('suggestSprintTasks returns tasks from goals', () => {
    const tasks = suggestSprintTasks('Ship MVP');
    expect(tasks.length).toBeGreaterThanOrEqual(3);
    expect(tasks[0].title).toContain('Ship MVP');
  });
});
