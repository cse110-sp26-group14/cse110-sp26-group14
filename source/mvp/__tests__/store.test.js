import { Store } from '../js/core/store.js';
import { EVENTS } from '../js/core/events.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

function freshStore() {
  return new Store(JSON.parse(JSON.stringify(INITIAL_DATA)));
}

describe('Store — sprint & meetings', () => {
  test('getSelectedSprint follows date-based default when not set', () => {
    const store = freshStore();
    store.reconcileSprints('2026-05-15');
    expect(store.getSelectedSprint()?.id).toBe(2);
    expect(store.getSelectedSprint()?.name).toBe('Sprint 2');
  });

  test('setSelectedSprintId switches sprint context', () => {
    const store = freshStore();
    store.setSelectedSprintId(3);
    expect(store.getSelectedSprint()?.name).toBe('Sprint 3');
  });

  test('addMeeting appends to state', () => {
    const store = freshStore();
    const before = store.getMeetings().length;
    store.addMeeting({
      title: 'Retro',
      date: '2026-05-20',
      time: '3:00 PM',
      sprintId: 2,
    });
    expect(store.getMeetings().length).toBe(before + 1);
    expect(store.getMeetings().some((m) => m.title === 'Retro')).toBe(true);
  });

  test('updateAiLogStatus changes log entry', () => {
    const store = freshStore();
    const id = store.getAiLogs()[0].id;
    store.updateAiLogStatus(id, 'pending');
    expect(store.getAiLogs().find((l) => l.id === id)?.status).toBe('pending');
  });

  test('addReport includes notes and sprintId', () => {
    const store = freshStore();
    store.setCurrentAuthUser({ name: 'Maya', profileUserId: 1 });
    const report = store.addReport({
      date: '2026-05-20',
      status: 'In Progress',
      mood: 'Good',
      progress: 'Unit test progress',
      blockers: 'None',
      notes: 'Follow up tomorrow',
      sprintId: 2,
    });
    expect(report.notes).toBe('Follow up tomorrow');
    expect(report.sprintId).toBe(2);
  });

  test('setSelectedSprintId publishes SPRINT_CHANGED', () => {
    const store = freshStore();
    let published = false;
    store.subscribe(EVENTS.SPRINT_CHANGED, () => {
      published = true;
    });
    store.setSelectedSprintId(1);
    expect(published).toBe(true);
  });

  test('addSprint appends sprint and selects it', () => {
    const store = freshStore();
    const before = store.state.sprints.length;
    const sprint = store.addSprint({
      name: 'Sprint 4',
      start: '2026-06-01',
      end: '2026-06-14',
      status: 'planned',
    });
    expect(store.state.sprints.length).toBe(before + 1);
    expect(sprint.name).toBe('Sprint 4');
    expect(store.getSelectedSprint()?.id).toBe(sprint.id);
  });

  test('reconcileSprints activates sprint by date and completes ended ones', () => {
    const store = freshStore();
    store.reconcileSprints('2026-05-20');
    expect(store.state.sprints.find((s) => s.id === 2)?.status).toBe('completed');
    expect(store.getActiveSprint()).toBeUndefined();
    expect(store.getSelectedSprint()?.id).toBe(3);

    store.addSprint({
      name: 'Sprint 4',
      start: '2026-05-18',
      end: '2026-06-14',
      status: 'active',
    });
    store.reconcileSprints('2026-05-20');
    const active = store.state.sprints.filter((s) => s.status === 'active');
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Sprint 4');
    expect(store.state.sprints.find((s) => s.id === 2)?.status).toBe('completed');
  });
});
