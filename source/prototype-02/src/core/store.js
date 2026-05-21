import { EVENTS } from './events.js';
import { loadState, saveState } from '../services/storageService.js';
import { createId } from '../utils/ids.js';
import { currentTimestamp, getISOWeekKey, todayISO } from '../utils/dates.js';

const STORAGE_KEY = 'se-sitrep-state';
const CURRENT_USER_ID = 1;

export class Store {
    constructor(initialState = window.INITIAL_DATA) {
        this.state = this.withDefaults(loadState(STORAGE_KEY, initialState));
        this.subscribers = {};
    }

    withDefaults(state) {
        return {
            ...state,
            availability: state.availability || {},
            availabilityLogs: state.availabilityLogs || [],
            weeklyAvailabilityChecks: state.weeklyAvailabilityChecks || {}
        };
    }

    subscribe(event, callback) {
        if (!this.subscribers[event]) this.subscribers[event] = [];
        this.subscribers[event].push(callback);
    }

    publish(event, data) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => callback(data));
        }
        this.save();
    }

    save() {
        saveState(STORAGE_KEY, this.state);
    }

    getState() { return this.state; }
    getActiveSprint() { return this.state.sprints.find(s => s.status === 'active'); }
    getTasksBySprint(sprintId) { return this.state.tasks.filter(t => t.sprintId === sprintId); }
    getIssues() { return this.state.issues; }
    getReports() { return this.state.reports; }
    getAiLogs() { return this.state.aiLogs; }
    getUsers() { return this.state.users; }
    getAvailabilityLogs() { return this.state.availabilityLogs; }

    addReport(report) {
        const newReport = {
            ...report,
            id: createId(),
            timestamp: currentTimestamp()
        };

        this.state.reports.push(newReport);
        this.publish(EVENTS.REPORTS_CHANGED, this.state.reports);
        return newReport;
    }

    addIssue(issue) {
        const newIssue = {
            ...issue,
            id: createId(),
            created: todayISO()
        };

        this.state.issues.unshift(newIssue);
        this.publish(EVENTS.ISSUES_CHANGED, this.state.issues);
        return newIssue;
    }

    addAiLog(log) {
        this.state.aiLogs.unshift(log);
        this.publish(EVENTS.AI_LOGS_CHANGED, this.state.aiLogs);
        return log;
    }

    needsWeeklyAvailabilityPrompt(date = new Date()) {
        const weekKey = getISOWeekKey(date);
        return this.state.weeklyAvailabilityChecks[weekKey]?.status !== 'submitted';
    }

    submitWeeklyAvailabilityCheck(payload) {
        const timestamp = currentTimestamp();
        const activeSprint = this.getActiveSprint();
        const weekKey = payload.weekKey || getISOWeekKey(payload.submittedFor || new Date());
        const userId = payload.userId || CURRENT_USER_ID;
        const grid = payload.grid || {};
        const mergedAvailability = payload.mergedAvailability || grid;
        const summary = this.summarizeAvailability(mergedAvailability);
        const log = {
            id: createId(),
            userId,
            userName: this.getUsers().find(user => user.id === userId)?.name || 'Unknown',
            sprintId: activeSprint?.id || null,
            sprintName: activeSprint?.name || 'Current Sprint',
            weekKey,
            submittedAt: timestamp,
            summary,
            calendarSync: payload.calendarSync || {
                source: 'local',
                status: 'skipped',
                message: 'Calendar sync not attempted.'
            }
        };

        Object.entries(mergedAvailability).forEach(([date, slots]) => {
            if (!this.state.availability[date]) this.state.availability[date] = {};
            this.state.availability[date][userId] = {
                ...(this.state.availability[date][userId] || {}),
                ...slots
            };
        });

        this.state.weeklyAvailabilityChecks[weekKey] = {
            status: 'submitted',
            submittedAt: timestamp,
            userId,
            sprintId: activeSprint?.id || null
        };
        this.state.availabilityLogs.unshift(log);

        this.publish(EVENTS.AVAILABILITY_CHANGED, this.state.availability);
        this.publish(EVENTS.AVAILABILITY_LOGS_CHANGED, this.state.availabilityLogs);
        return log;
    }

    summarizeAvailability(availabilityByDate) {
        return Object.values(availabilityByDate).reduce((summary, slots) => {
            Object.values(slots).forEach(status => {
                summary[status] = (summary[status] || 0) + 1;
            });
            return summary;
        }, {});
    }
}
