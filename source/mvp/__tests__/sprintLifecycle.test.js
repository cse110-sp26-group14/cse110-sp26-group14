import {
  applySprintLifecycle,
  pickDefaultSprint,
  deriveSprintStatus,
} from '../js/utils/sprintLifecycle.js';

const SPRINTS = [
  { id: 1, name: 'Sprint 1', start: '2026-05-01', end: '2026-05-08', status: 'completed' },
  { id: 2, name: 'Sprint 2', start: '2026-05-12', end: '2026-05-19', status: 'active' },
  { id: 3, name: 'Sprint 3', start: '2026-05-22', end: '2026-05-29', status: 'planned' },
];

describe('sprintLifecycle', () => {
  test('marks past end date as completed', () => {
    const sprints = JSON.parse(JSON.stringify(SPRINTS));
    applySprintLifecycle(sprints, '2026-05-20');
    expect(sprints.find((s) => s.id === 2)?.status).toBe('completed');
    expect(sprints.find((s) => s.id === 3)?.status).toBe('planned');
  });

  test('activates sprint in date window (lowest id if overlap)', () => {
    const sprints = [
      { id: 2, start: '2026-05-12', end: '2026-05-19', status: 'planned' },
      { id: 3, start: '2026-05-15', end: '2026-05-25', status: 'planned' },
    ];
    applySprintLifecycle(sprints, '2026-05-16');
    expect(sprints.find((s) => s.id === 2)?.status).toBe('active');
    expect(sprints.find((s) => s.id === 3)?.status).toBe('planned');
  });

  test('after sprint ends, next in-window sprint becomes active', () => {
    const sprints = JSON.parse(JSON.stringify(SPRINTS));
    applySprintLifecycle(sprints, '2026-05-23');
    expect(sprints.find((s) => s.id === 2)?.status).toBe('completed');
    expect(sprints.find((s) => s.id === 3)?.status).toBe('active');
  });

  test('pickDefaultSprint prefers active, then earliest started, then upcoming', () => {
    const sprints = JSON.parse(JSON.stringify(SPRINTS));
    applySprintLifecycle(sprints, '2026-05-16');
    expect(pickDefaultSprint(sprints, '2026-05-16')?.id).toBe(2);

    applySprintLifecycle(sprints, '2026-05-20');
    expect(pickDefaultSprint(sprints, '2026-05-20')?.id).toBe(3);

    applySprintLifecycle(sprints, '2026-05-23');
    expect(pickDefaultSprint(sprints, '2026-05-23')?.id).toBe(3);
  });

  test('deriveSprintStatus on end date is still active', () => {
    expect(deriveSprintStatus(
      { id: 2, start: '2026-05-12', end: '2026-05-19' },
      '2026-05-19',
      2,
    )).toBe('active');
    expect(deriveSprintStatus(
      { id: 2, start: '2026-05-12', end: '2026-05-19' },
      '2026-05-20',
      null,
    )).toBe('completed');
  });
});
