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
  putAvailability,
  putUserProfile,
} from './apiClient.js';
import { todayISO } from '../utils/dates.js';

/**
 * @param {import('../core/store.js').Store} store
 * @returns {Promise<void>}
 */
export async function refreshStoreFromApi(store) {
  if (!useRemoteData()) return;
  const state = await fetchAppState();
  store.state = state;
  store.save();
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
  if (!useRemoteData()) {
    return store.addIssue(issue);
  }

  const created = await postIssue(issue);
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
      sprintId: store.getActiveSprint()?.id ?? 2,
      description: payload.progress || '',
    });
  }
  return created;
}

/**
 * @param {import('../core/store.js').Store} store
 * @param {object} taskInput
 */
export async function createTaskRemote(store, taskInput) {
  if (!useRemoteData()) {
    return store.addTask({
      ...taskInput,
      owner: taskInput.owner ?? store.currentAuthUser?.name,
    });
  }
  const created = await postTask({
    ...taskInput,
    owner: taskInput.owner ?? store.currentAuthUser?.name,
    sprintId: taskInput.sprintId ?? store.getActiveSprint()?.id ?? 2,
  });
  store.state.tasks.push(created);
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
  return created;
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
export function mergeTasksFromApi(store, tasks) {
  if (!tasks?.length) return;
  tasks.forEach((t) => {
    if (!store.state.tasks.some((x) => x.id === t.id)) {
      store.state.tasks.push(t);
    }
  });
  store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
}
