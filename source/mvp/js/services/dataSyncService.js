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
  patchReport,
  postTask,
  patchInlineTask,
  postSprint,
  postMeeting,
  postAiLog,
  patchAiLog,
  putAvailability,
  putUserProfile,
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
 * @param {number} issueId
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
export async function updateIssueRemote(store, issueId, patch) {
  if (!useRemoteData()) {
    return store.updateIssue(issueId, patch);
  }
  const updated = await patchIssue(issueId, patch);
  return store.updateIssue(issueId, updated);
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
 * @param {number} reportId
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
export async function updateReportRemote(store, reportId, patch) {
  if (!useRemoteData()) {
    return store.updateReport(reportId, patch);
  }
  const updated = await patchReport(reportId, patch);
  return store.updateReport(reportId, updated);
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
  return updateAiLogRemote(store, logId, { status });
}

export async function createTaskRemote(store, taskInput, opts = {}) {
  const payload = enrichNewTask(store, taskInput, opts);
  if (!useRemoteData()) {
    return store.addTask(payload);
  }
  const created = await postTask(payload);
  store.state.tasks.push(created);
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
  return created;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {number} taskId
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
export async function updateInlineTaskRemote(store, taskId, patch) {
  if (!useRemoteData()) {
    return store.updateTask(taskId, patch);
  }
  const updated = await patchInlineTask(taskId, patch);
  return store.updateTask(taskId, updated);
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {number} logId
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
export async function updateAiLogRemote(store, logId, patch) {
  if (!useRemoteData()) {
    return store.updateAiLog(logId, patch);
  }
  const { log } = await patchAiLog(logId, patch);
  return store.updateAiLog(logId, log);
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
