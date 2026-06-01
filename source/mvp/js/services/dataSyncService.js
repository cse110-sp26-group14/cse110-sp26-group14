/**
 * Loads/saves app state from API when configured (team-shared data).
 * @module services/dataSyncService
 */

import { EVENTS } from '../core/events.js';
import { useRemoteData } from '../config/appConfig.js';
import {
  fetchAppState,
  postIssue,
  postReport,
  patchIssue,
  postTask,
  postSprint,
  postMeeting,
  postAiLog,
  patchAiLog,
  putAvailability,
  putUserProfile,
  patchTask,
  postSubtask,
  completeSubtask,
  fetchActiveUsers,
} from './apiClient.js';
import { createNoteLog } from './aiLogService.js';
import { todayISO } from '../utils/dates.js';
import { enrichNewTask, normalizeTasksInStore } from '../utils/taskHelpers.js';
import { enrichNewIssue } from '../utils/issueHelpers.js';

/**
 * @param {import('../core/store.js').Store} store
 * @returns {Promise<void>}
 */
export async function refreshStoreFromApi(store) {
  if (!useRemoteData()) return;
  const state = await fetchAppState();
  store.state = state;
  store.reconcileSprints();
  if (normalizeTasksInStore(store)) {
    store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
  } else {
    store.save();
  }
}

/**
 * @param {import('../core/store.js').Store} store
 * @returns {Promise<void>}
 */
export async function hydrateStoreFromApi(store) {
  return refreshStoreFromApi(store);
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object} issue
 * @returns {Promise<object>}
 */
export async function createIssueRemote(store, issue) {
  const payload = enrichNewIssue(store, issue);
  if (!useRemoteData()) {
    return store.addIssue(payload);
  }

  const created = await postIssue(payload);
  store.state.issues.unshift(created);
  store.publish(EVENTS.ISSUES_CHANGED, store.state.issues);
  return created;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {number} issueId
 */
export async function resolveIssueRemote(store, issueId) {
  if (!useRemoteData()) {
    store.resolveIssue(issueId);
    return;
  }
  const updated = await patchIssue(issueId, { status: 'resolved' });
  const issue = store.state.issues.find((i) => i.id === issueId);
  if (issue) {
    issue.status = updated.status;
    store.publish(EVENTS.ISSUES_CHANGED, store.state.issues);
  }
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object} reportInput
 * @returns {Promise<object>}
 */
export async function createReportRemote(store, reportInput) {
  if (!useRemoteData()) {
    return store.addReport(reportInput);
  }

  const payload = {
    ...reportInput,
    userId: reportInput.userId ?? store.getCurrentUserId(),
    date: reportInput.date ?? todayISO(),
  };
  const created = await postReport(payload);
  store.state.reports.push(created);
  store.publish(EVENTS.REPORTS_CHANGED, store.state.reports);

  if (payload.blockers && payload.blockers !== 'None') {
    await createIssueRemote(store, {
      title: `Blocker: ${payload.blockers}`,
      severity: 'high',
      status: 'open',
      tags: ['Check-In Blocker'],
      author: store.currentAuthUser?.name || 'Team Member',
      assignee: null,
      sprintId: store.getSelectedSprint()?.id ?? 2,
      description: payload.progress || '',
    });
  }
  return created;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object} taskInput
 */
/**
 * @param {import('../core/store.js').Store} store
 * @param {object} meetingInput
 */
export async function createMeetingRemote(store, meetingInput) {
  const sprintId = meetingInput.sprintId ?? store.getSelectedSprint()?.id ?? 2;
  const payload = { ...meetingInput, sprintId };
  if (!useRemoteData()) {
    return store.addMeeting(payload);
  }
  const created = await postMeeting(payload);
  if (!store.state.meetings) store.state.meetings = [];
  store.state.meetings.push(created);
  store.publish(EVENTS.MEETINGS_CHANGED, store.state.meetings);
  return created;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {number} logId
 * @param {string} status
 */
export async function updateAiLogStatusRemote(store, logId, status) {
  if (!useRemoteData()) {
    store.updateAiLogStatus(logId, status);
    return;
  }
  const { log } = await patchAiLog(logId, { status });
  const entry = store.state.aiLogs.find((l) => l.id === logId);
  if (entry) {
    entry.status = log.status;
    store.publish(EVENTS.AI_LOGS_CHANGED, store.state.aiLogs);
  }
}

export async function createTaskRemote(store, taskInput, opts = {}) {
  const payload = enrichNewTask(store, taskInput, opts);
  if (!useRemoteData()) {
    return store.addTask(payload);
  }
  const created = await postTask(payload);
  const merged = { ...payload, ...created };
  store.state.tasks.push(merged);
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
  return merged;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {string} date
 * @param {object} slots
 */
export async function saveAvailabilityRemote(store, date, slots) {
  if (!useRemoteData()) {
    if (!store.state.availability) store.state.availability = {};
    if (!store.state.availability[date]) store.state.availability[date] = {};
    const uid = store.getCurrentUserId();
    store.state.availability[date][uid] = slots;
    const user = store.state.users.find((u) => u.id === uid);
    if (user) user.availability = slots;
    store.save();
    return;
  }

  const result = await putAvailability({
    date,
    userId: store.getCurrentUserId(),
    slots,
  });
  if (result.availability) {
    store.state.availability = result.availability;
    store.save();
  }
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {{ name?: string, role?: string }} fields
 */
export async function updateProfileRemote(store, fields) {
  if (!useRemoteData()) {
    if (store.currentAuthUser) {
      if (fields.name) store.currentAuthUser.name = fields.name;
      if (fields.role) store.currentAuthUser.role = fields.role;
    }
    return;
  }
  const { user } = await putUserProfile(fields);
  store.setCurrentAuthUser(user);
  await refreshStoreFromApi(store);
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object} log
 */
export function mergeAiLogFromApi(store, log) {
  if (!log) return;
  if (!store.state.aiLogs.some((l) => l.id === log.id)) {
    store.state.aiLogs.unshift(log);
    store.publish(EVENTS.AI_LOGS_CHANGED, store.state.aiLogs);
  }
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object[]} tasks
 */
/**
 * @param {import('../core/store.js').Store} store
 * @param {{ title: string, content: string }} note
 */
export async function createNoteRemote(store, note) {
  const author = store.currentAuthUser?.name || 'Team';
  if (!useRemoteData()) {
    const log = createNoteLog(note.title, note.content, author);
    store.addAiLog(log);
    return log;
  }

  const { log } = await postAiLog({
    type: 'Note',
    title: note.title,
    content: note.content,
    details: { input: 'Manual note', reviewer: author },
  });
  mergeAiLogFromApi(store, log);
  return log;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {{ name: string, start: string, end: string, status?: string }} input
 * @returns {Promise<object>}
 */
export async function createSprintRemote(store, input) {
  if (!input.name?.trim() || !input.start || !input.end) {
    throw new Error('Sprint name, start date, and end date are required.');
  }
  if (input.end < input.start) {
    throw new Error('End date must be on or after start date.');
  }
  if (!useRemoteData()) {
    return store.addSprint(input);
  }
  const created = await postSprint({
    name: input.name.trim(),
    start: input.start,
    end: input.end,
    status: input.status || 'planned',
  });
  await refreshStoreFromApi(store);
  store.setSelectedSprintId(created.id);
  return created;
}

export function mergeTasksFromApi(store, tasks) {
  if (!tasks?.length) return;
  tasks.forEach((t) => {
    if (!store.state.tasks.some((x) => x.id === t.id)) {
      store.state.tasks.push(t);
    }
  });
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
}

/**
 * Update a task on the server. Handles 409 conflicts by showing the user
 * the server version instead of silently overwriting.
 * @param {import('../core/store.js').Store} store
 * @param {number} taskId
 * @param {object} patch
 * @param {string|null} [expectedUpdatedAt]
 * @returns {Promise<{ ok: boolean, task?: object, conflict?: boolean, serverTask?: object }>}
 */
export async function updateTaskRemote(store, taskId, patch, expectedUpdatedAt = null) {
  if (!useRemoteData()) {
    store.patchTask({ id: taskId, ...patch });
    return { ok: true, task: patch };
  }
  try {
    const updated = await patchTask(taskId, { ...patch, expectedUpdatedAt });
    store.patchTask(updated);
    return { ok: true, task: updated };
  } catch (err) {
    if (err.conflict) {
      return { ok: false, conflict: true, serverTask: err.body?.serverTask || null };
    }
    throw err;
  }
}

/**
 * Create a sub-task under a parent task. If 2+ assignees on a new task,
 * call this once per assignee.
 * @param {import('../core/store.js').Store} store
 * @param {number} parentId
 * @param {object} input
 * @returns {Promise<object>}
 */
export async function createSubtaskRemote(store, parentId, input) {
  if (!useRemoteData()) {
    const sub = store.addTask({ ...input, parentTaskId: parentId, source: 'subtask' });
    return sub;
  }
  const sub = await postSubtask(parentId, input);
  store.state.tasks.push(sub);
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
  return sub;
}

/**
 * Mark a sub-task complete. Server enforces that only the assigned person can do this.
 * When all sub-tasks are complete the parent is automatically flagged for review.
 * @param {import('../core/store.js').Store} store
 * @param {number} subtaskId
 * @returns {Promise<object>}
 */
export async function completeSubtaskRemote(store, subtaskId) {
  if (!useRemoteData()) {
    store.patchTask({ id: subtaskId, status: 'resolved' });
    return store.state.tasks.find((t) => t.id === subtaskId);
  }
  const updated = await completeSubtask(subtaskId);
  store.patchTask(updated);
  await refreshStoreFromApi(store);
  return updated;
}

// ─── Live Polling ────────────────────────────────────────────────────────────

const POLL_MS = 10_000;
let _pollTimer = null;
let _lastTasksHash = '';
let _lastUsersHash = '';

function _hashTasks(tasks) {
  return JSON.stringify((tasks || []).map((t) => `${t.id}:${t.status}:${t.updatedAt}`));
}

function _hashUsers(users) {
  return JSON.stringify((users || []).map((u) => `${u.id}:${u.isOnline}`));
}

function _showSyncBanner(msg) {
  const existing = document.getElementById('sitrep-sync-banner');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'sitrep-sync-banner';
  el.textContent = `🔄 ${msg}`;
  el.style.cssText = [
    'position:fixed', 'bottom:1.5rem', 'left:50%', 'transform:translateX(-50%)',
    'background:#1d4ed8', 'color:white', 'padding:0.6rem 1.4rem',
    'border-radius:999px', 'font-size:0.875rem', 'font-weight:500',
    'z-index:9999', 'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

/**
 * Start polling the API every 10s and refresh the store when data changes.
 * Call once after the app shell is authenticated.
 * @param {import('../core/store.js').Store} store
 * @param {{ handleRoute: () => void }} router
 */
export function startLiveSync(store, router) {
  if (!useRemoteData()) return;
  if (_pollTimer) clearInterval(_pollTimer);

  _lastTasksHash = _hashTasks(store.state.tasks);
  _lastUsersHash = _hashUsers(store.state.users);

  _pollTimer = setInterval(async () => {
    try {
      const state = await fetchAppState();
      let changed = false;

      const newTasksHash = _hashTasks(state.tasks);
      if (newTasksHash !== _lastTasksHash) {
        store.setTasks(state.tasks || []);
        _showSyncBanner('Tasks updated by a team member.');
        changed = true;
      }
      _lastTasksHash = newTasksHash;

      const newUsersHash = _hashUsers(state.users);
      if (newUsersHash !== _lastUsersHash) {
        store.setUsers(state.users || []);
        changed = true;
      }
      _lastUsersHash = newUsersHash;

      if (changed && router) {
        const hash = window.location.hash || '#dashboard';
        if (['#backlog', '#dashboard', '#team-availability'].includes(hash)) {
          router.handleRoute();
        }
      }
    } catch (err) {
      console.warn('[LiveSync] Poll failed:', err.message);
    }
  }, POLL_MS);
}

/**
 * Stop live polling (e.g. on logout).
 */
export function stopLiveSync() {
  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = null;
}
