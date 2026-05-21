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

const STORAGE_KEY = 'se-sitrep-mvp-state';

/**
 * Application store: sprint data, issues, reports, and AI logs.
 */
export class Store {
  /**
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
   * @param {import('../services/authService.js').AuthUser|null} authUser
   */
  setCurrentAuthUser(authUser) {
    this.currentAuthUser = authUser;
  }

  /**
   * @returns {number|null} profile user id for reports/issues
   */
  getCurrentUserId() {
    if (this.currentAuthUser?.profileUserId != null) {
      return Number(this.currentAuthUser.profileUserId);
    }
    return this.state.users[0]?.id ?? null;
  }

  /**
   * @param {string} event
   * @param {Function} callback
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(callback);
  }

  /**
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

  /** @returns {object} */
  getState() {
    return this.state;
  }

  /** @returns {object|undefined} */
  getActiveSprint() {
    return this.state.sprints.find((s) => s.status === 'active');
  }

  /** Sprint shown in dashboard/calendar/backlog (selected or active). */
  getSelectedSprint() {
    if (this.selectedSprintId != null) {
      return this.state.sprints.find(
        (s) => Number(s.id) === Number(this.selectedSprintId),
      ) || this.getActiveSprint();
    }
    return this.getActiveSprint();
  }

  /**
   * @param {number|null} sprintId
   */
  setSelectedSprintId(sprintId) {
    this.selectedSprintId = sprintId;
    this.publish(EVENTS.SPRINT_CHANGED, this.getSelectedSprint());
  }

  /**
   * @param {{ name: string, start: string, end: string, status?: string }} input
   * @returns {object}
   */
  addSprint(input) {
    const maxId = this.state.sprints.reduce((m, s) => Math.max(m, Number(s.id)), 0);
    const id = maxId + 1;
    const status = input.status || 'planned';
    if (status === 'active') {
      this.state.sprints.forEach((s) => {
        if (s.status === 'active') s.status = 'planned';
      });
    }
    const sprint = {
      id,
      name: String(input.name || '').trim() || `Sprint ${id}`,
      start: input.start,
      end: input.end,
      status,
    };
    this.state.sprints.push(sprint);
    this.selectedSprintId = id;
    this.publish(EVENTS.SPRINT_CHANGED, sprint);
    return sprint;
  }

  /** @returns {object[]} */
  getGoogleEvents() {
    return this.googleEvents;
  }

  /**
   * @param {object[]} events
   */
  setGoogleEvents(events) {
    this.googleEvents = events;
  }

  /**
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
   * @param {number} sprintId
   * @returns {object[]}
   */
  getTasksBySprint(sprintId) {
    return this.state.tasks.filter((t) => t.sprintId === sprintId);
  }

  /** @returns {object[]} */
  getIssues() {
    return this.state.issues;
  }

  /** @returns {object[]} */
  getReports() {
    return this.state.reports;
  }

  /** @returns {object[]} */
  getAiLogs() {
    return this.state.aiLogs;
  }

  /** @returns {object[]} */
  getUsers() {
    return this.state.users;
  }

  /** @returns {object[]} */
  getMeetings() {
    return this.state.meetings || [];
  }

  /**
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
   * @param {object} log
   * @returns {object}
   */
  addAiLog(log) {
    this.state.aiLogs.unshift(log);
    this.publish(EVENTS.AI_LOGS_CHANGED, this.state.aiLogs);
    return log;
  }

  /**
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
}
