import { EVENTS } from './events.js';
import { loadState, saveState } from '../services/storageService.js';
import { createId } from '../utils/ids.js';
import { currentTimestamp, todayISO } from '../utils/dates.js';

const STORAGE_KEY = 'se-sitrep-state';

export class Store {
    constructor(initialState = window.INITIAL_DATA) {
        this.state = loadState(STORAGE_KEY, initialState);
        this.subscribers = {};
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
}
