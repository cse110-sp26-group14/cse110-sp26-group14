import { Store } from '../js/core/store.js';
import { EVENTS } from '../js/core/events.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

function freshStore() {
  return new Store(JSON.parse(JSON.stringify(INITIAL_DATA)));
}

describe('Store — sprint & meetings', () => {
  test('getSelectedSprint follows active sprint when not set', () => {
    const store = freshStore();
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
});
