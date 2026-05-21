import { buildTeamSummary, suggestSprintTasks, suggestSprintTasksRemote } from '../js/services/aiSummaryService.js';
import { Store } from '../js/core/store.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

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

  test('suggestSprintTasks assigns owners from team context', () => {
    const ctx = { sprint: INITIAL_DATA.sprints[1], members: [], principles: '' };
    ctx.members = [
      { name: 'Jordan Lee', role: 'Backend', assumedAvailable: true, capacity: 'high', freeRatio: 1 },
      { name: 'Priya Shah', role: 'QA / Testing', assumedAvailable: true, capacity: 'high', freeRatio: 1 },
    ];
    const tasks = suggestSprintTasks('Ship MVP', ctx);
    expect(tasks.length).toBeGreaterThanOrEqual(3);
    expect(tasks.every((t) => t.owner && t.due)).toBe(true);
  });

  test('suggestSprintTasksRemote local mode returns pending log with teamContext', async () => {
    const store = new Store(INITIAL_DATA);
    const result = await suggestSprintTasksRemote(store, 'Ship MVP', 2);
    expect(result.log.status).toBe('pending');
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions[0].owner).toBeTruthy();
    expect(result.log.details.teamContext).toBeDefined();
    expect(result.parseFailed).toBe(false);
    expect(result.log.details.parseFailed).toBe(false);
    expect(result.log.details.source).toBe('local');
  });
});
