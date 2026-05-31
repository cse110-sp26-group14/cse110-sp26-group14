/**
 * Central application state with pub/sub and localStorage persistence.
 * @module core/store
 */

import { EVENTS } from './events.js';
import { INITIAL_DATA } from '../data/initialData.js';
import { useRemoteData } from '../config/appConfig.js';
import { loadState, saveState } from '../services/storageService.js';
import { createId } from '../utils/ids.js';
import { currentTimestamp, todayISO } from '../utils/dates.js';
import { defaultDueForSprint } from '../utils/taskHelpers.js';
import { applySprintLifecycle, pickDefaultSprint } from '../utils/sprintLifecycle.js';

const STORAGE_KEY = 'se-sitrep-mvp-state';

/**
 * Application store: sprint data, issues, reports, and AI logs.
 */
export class Store {
  /**
   * Loads persisted state (falling back to a deep clone of the seed),
   * initializes subscribers and auth/selection fields, and sets the
   * data-mode label based on whether remote data is in use.
   * @param {object} [seed] - optional seed instead of INITIAL_DATA
   */
  constructor(seed = INITIAL_DATA) {
    this.state = loadState(STORAGE_KEY, JSON.parse(JSON.stringify(seed)));
    this.subscribers = {};
    this.currentAuthUser = null;
    /** @type {number|null} null = follow active sprint */
    this.selectedSprintId = null;
    /** @type {object[]} cached Google Calendar events */
    this.googleEvents = [];
    this.dataModeLabel = useRemoteData()
      ? '(shared via API)'
      : '(local only — other teammates will not see your issues)';
  }

  /**
   * Sets the currently authenticated user.
   * @param {import('../services/authService.js').AuthUser|null} authUser
   */
  setCurrentAuthUser(authUser) {
    this.currentAuthUser = authUser;
  }

  /**
   * Resolves the profile user id used for reports/issues, preferring the
   * authenticated user's profile id and falling back to the first user.
   * @returns {number|null} profile user id for reports/issues
   */
  getCurrentUserId() {
    if (this.currentAuthUser?.profileUserId != null) {
      return Number(this.currentAuthUser.profileUserId);
    }
    return this.state.users[0]?.id ?? null;
  }

  /**
   * Registers a callback to be invoked when the given event is published.
   * @param {string} event
   * @param {Function} callback
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(callback);
  }

  /**
   * Invokes all callbacks subscribed to the event with the given data, then
   * persists state.
   * @param {string} event
   * @param {*} data
   */
  publish(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => callback(data));
    }
    this.save();
  }

  /** Persist state to localStorage. */
  save() {
    saveState(STORAGE_KEY, this.state);
  }

  /**
   * Returns the full application state object.
   * @returns {object}
   */
  getState() {
    return this.state;
  }

  /**
   * Returns the sprint currently marked as active, if any.
   * @returns {object|undefined}
   */
  getActiveSprint() {
    return this.state.sprints.find((s) => s.status === 'active');
  }

  /**
   * Update sprint statuses from start/end dates (completed / active / planned).
   * @param {string} [today] YYYY-MM-DD
   * @returns {boolean} whether any sprint status changed
   */
  reconcileSprints(today) {
    const changed = applySprintLifecycle(this.state.sprints, today);
    if (changed) {
      this.publish(EVENTS.SPRINT_CHANGED, this.getSelectedSprint());
    }
    return changed;
  }

  /** Sprint shown in dashboard/calendar/backlog (selected or date-based default). */
  getSelectedSprint() {
    if (this.selectedSprintId != null) {
      const manual = this.state.sprints.find(
        (s) => Number(s.id) === Number(this.selectedSprintId),
      );
      if (manual) return manual;
    }
    return this.getActiveSprint() || pickDefaultSprint(this.state.sprints);
  }

  /**
   * Sets the manually selected sprint id (or null to follow the active sprint)
   * and publishes a sprint-changed event.
   * @param {number|null} sprintId
   */
  setSelectedSprintId(sprintId) {
    this.selectedSprintId = sprintId;
    this.publish(EVENTS.SPRINT_CHANGED, this.getSelectedSprint());
  }

  /**
   * Creates a new sprint with a generated id, appends it, reconciles sprint
   * statuses, selects it, and publishes a sprint-changed event.
   * @param {{ name: string, start: string, end: string, status?: string }} input
   * @returns {object}
   */
  addSprint(input) {
    const maxId = this.state.sprints.reduce((m, s) => Math.max(m, Number(s.id)), 0);
    const id = maxId + 1;
    const sprint = {
      id,
      name: String(input.name || '').trim() || `Sprint ${id}`,
      start: input.start,
      end: input.end,
      status: input.status || 'planned',
    };
    this.state.sprints.push(sprint);
    this.reconcileSprints();
    this.selectedSprintId = id;
    this.publish(EVENTS.SPRINT_CHANGED, this.getSelectedSprint());
    return this.state.sprints.find((s) => Number(s.id) === id) || sprint;
  }

  /**
   * Returns the cached Google Calendar events.
   * @returns {object[]}
   */
  getGoogleEvents() {
    return this.googleEvents;
  }

  /**
   * Replaces the cached Google Calendar events.
   * @param {object[]} events
   */
  setGoogleEvents(events) {
    this.googleEvents = events;
  }

  /**
   * Adds a meeting (assigning an id and sprint id when absent) and publishes a
   * meetings-changed event.
   * @param {object} meeting
   * @returns {object}
   */
  addMeeting(meeting) {
    if (!this.state.meetings) this.state.meetings = [];
    const newMeeting = {
      ...meeting,
      id: meeting.id ?? createId(),
      sprintId: meeting.sprintId ?? this.getSelectedSprint()?.id ?? 2,
    };
    this.state.meetings.push(newMeeting);
    this.publish(EVENTS.MEETINGS_CHANGED, this.state.meetings);
    return newMeeting;
  }

  /**
   * Updates the status of the AI log with the given id, publishing an
   * AI-logs-changed event when a matching log is found.
   * @param {number} logId
   * @param {string} status
   */
  updateAiLogStatus(logId, status) {
    const log = this.state.aiLogs.find((l) => l.id === logId);
    if (log) {
      log.status = status;
      this.publish(EVENTS.AI_LOGS_CHANGED, this.state.aiLogs);
    }
  }

  /**
   * Returns the tasks belonging to the given sprint.
   * @param {number} sprintId
   * @returns {object[]}
   */
  getTasksBySprint(sprintId) {
    return this.state.tasks.filter((t) => t.sprintId === sprintId);
  }

  /**
   * Returns all issues.
   * @returns {object[]}
   */
  getIssues() {
    return this.state.issues;
  }

  /**
   * Returns all reports.
   * @returns {object[]}
   */
  getReports() {
    return this.state.reports;
  }

  /**
   * Returns all AI logs.
   * @returns {object[]}
   */
  getAiLogs() {
    return this.state.aiLogs;
  }

  /**
   * Returns all users.
   * @returns {object[]}
   */
  getUsers() {
    return this.state.users;
  }

  /**
   * Returns all meetings (an empty array when none exist).
   * @returns {object[]}
   */
  getMeetings() {
    return this.state.meetings || [];
  }

  /**
   * Adds a report (filling in id, user, date, timestamp, status, and sprint
   * defaults), publishes a reports-changed event, and creates a linked blocker
   * issue when the report records a non-"None" blocker.
   * @param {object} report
   * @returns {object}
   */
  addReport(report) {
    const newReport = {
      ...report,
      id: createId(),
      userId: report.userId ?? this.getCurrentUserId(),
      date: report.date ?? todayISO(),
      timestamp: currentTimestamp(),
      status: report.status || 'In Progress',
      notes: report.notes || '',
      sprintId: report.sprintId ?? this.getSelectedSprint()?.id ?? this.getActiveSprint()?.id,
    };

    this.state.reports.push(newReport);
    this.publish(EVENTS.REPORTS_CHANGED, this.state.reports);

    if (newReport.blockers && newReport.blockers !== 'None') {
      this.addIssue({
        title: `Blocker: ${newReport.blockers}`,
        severity: 'high',
        status: 'open',
        tags: ['Check-In Blocker'],
        author: this.currentAuthUser?.name || 'Team Member',
        assignee: null,
        sprintId: this.getActiveSprint()?.id ?? 2,
        description: newReport.progress || '',
      });
    }

    return newReport;
  }

  /**
   * Adds an issue (filling in id, created date, due date, and assignee
   * defaults) to the front of the list and publishes an issues-changed event.
   * @param {object} issue
   * @returns {object}
   */
  addIssue(issue) {
    const sprint = this.state.sprints.find((s) => s.id === issue.sprintId)
      || this.getSelectedSprint()
      || this.getActiveSprint();
    const newIssue = {
      ...issue,
      id: createId(),
      created: issue.created || todayISO(),
      due: issue.due || defaultDueForSprint(sprint),
      assignee: issue.assignee ?? this.currentAuthUser?.name ?? null,
    };

    this.state.issues.unshift(newIssue);
    this.publish(EVENTS.ISSUES_CHANGED, this.state.issues);
    return newIssue;
  }

  /**
   * Adds an AI log to the front of the list and publishes an AI-logs-changed
   * event.
   * @param {object} log
   * @returns {object}
   */
  addAiLog(log) {
    this.state.aiLogs.unshift(log);
    this.publish(EVENTS.AI_LOGS_CHANGED, this.state.aiLogs);
    return log;
  }

  /**
   * Applies a patch to the issue with the given id, publishing an
   * issues-changed event; returns the updated issue or null if not found.
   * @param {number} issueId
   * @param {object} patch
   * @returns {object|null}
   */
  updateIssue(issueId, patch) {
    const issue = this.state.issues.find((i) => Number(i.id) === Number(issueId));
    if (!issue) return null;
    Object.assign(issue, patch);
    this.publish(EVENTS.ISSUES_CHANGED, this.state.issues);
    return issue;
  }

  /**
   * Applies a patch to the task with the given id, publishing a tasks-changed
   * event; returns the updated task or null if not found.
   * @param {number} taskId
   * @param {object} patch
   * @returns {object|null}
   */
  updateTask(taskId, patch) {
    const task = this.state.tasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) return null;
    Object.assign(task, patch);
    this.publish(EVENTS.TASKS_CHANGED, this.state.tasks);
    return task;
  }

  /**
   * Applies a patch to the report with the given id, publishing a
   * reports-changed event; returns the updated report or null if not found.
   * @param {number} reportId
   * @param {object} patch
   * @returns {object|null}
   */
  updateReport(reportId, patch) {
    const report = this.state.reports.find((r) => Number(r.id) === Number(reportId));
    if (!report) return null;
    Object.assign(report, patch);
    this.publish(EVENTS.REPORTS_CHANGED, this.state.reports);
    return report;
  }

  /**
   * Applies a patch to the AI log with the given id, publishing an
   * AI-logs-changed event; returns the updated log or null if not found.
   * @param {number} logId
   * @param {object} patch
   * @returns {object|null}
   */
  updateAiLog(logId, patch) {
    const log = this.state.aiLogs.find((l) => Number(l.id) === Number(logId));
    if (!log) return null;
    Object.assign(log, patch);
    this.publish(EVENTS.AI_LOGS_CHANGED, this.state.aiLogs);
    return log;
  }

  /**
   * Marks the issue with the given id as resolved, publishing an
   * issues-changed event when a matching issue is found.
   * @param {number} issueId
   */
  resolveIssue(issueId) {
    const issue = this.state.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.status = 'resolved';
      this.publish(EVENTS.ISSUES_CHANGED, this.state.issues);
    }
  }

  /**
   * Adds a task (filling in id, sprint, status, owner, and due-date defaults)
   * and publishes a tasks-changed event.
   * @param {object} task
   * @returns {object}
   */
  addTask(task) {
    const sprint = this.state.sprints.find((s) => s.id === task.sprintId)
      || this.getSelectedSprint()
      || this.getActiveSprint();
    const newTask = {
      ...task,
      id: createId(),
      sprintId: task.sprintId ?? sprint?.id,
      status: task.status || 'open',
      owner: task.owner || this.currentAuthUser?.name || null,
      due: task.due || defaultDueForSprint(sprint),
    };
    this.state.tasks.push(newTask);
    this.publish(EVENTS.TASKS_CHANGED, this.state.tasks);
    return newTask;
  }

  /**
   * Update one task in-place (from server response or optimistic update).
   * @param {object} updatedTask
   */
  patchTask(updatedTask) {
    const idx = this.state.tasks.findIndex((t) => Number(t.id) === Number(updatedTask.id));
    if (idx >= 0) {
      this.state.tasks[idx] = { ...this.state.tasks[idx], ...updatedTask };
    } else {
      this.state.tasks.push(updatedTask);
    }
    this.publish(EVENTS.TASKS_CHANGED, this.state.tasks);
  }

  /**
   * Replace the full task list (used by live sync).
   * @param {object[]} tasks
   */
  setTasks(tasks) {
    this.state.tasks = tasks;
    this.publish(EVENTS.TASKS_CHANGED, tasks);
  }

  /**
   * Replace the user list (used by live sync).
   * @param {object[]} users
   */
  setUsers(users) {
    this.state.users = users;
    this.save();
  }
}