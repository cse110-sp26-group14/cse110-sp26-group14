import { buildTeamSummary, suggestSprintTasks, suggestSprintTasksRemote } from '../js/services/aiSummaryService.js';

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

  test('suggestSprintTasksRemote local mode returns pending log for review', async () => {
    const result = await suggestSprintTasksRemote('Ship MVP', 2);
    expect(result.log.status).toBe('pending');
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.log.details.suggestions).toBeDefined();
  });
});
