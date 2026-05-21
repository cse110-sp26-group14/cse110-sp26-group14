import { Store } from './core/store.js';
import { Router } from './core/router.js';
import { EVENTS } from './core/events.js';
import { routes } from './routes.js';
import { Modal } from './components/Modal.js';
import { DailyCheckInForm } from './components/forms/DailyCheckInForm.js';
import { IssueForm } from './components/forms/IssueForm.js';
import { AvailabilityCheckForm, parseAvailabilityForm } from './components/forms/AvailabilityCheckForm.js';
import { createSummaryLogForReport } from './services/aiLogService.js';
import { syncAvailabilityWithGoogleCalendar } from './services/googleCalendarService.js';
import { todayISO } from './utils/dates.js';

const store = new Store();
const router = new Router(routes, store);
const modal = new Modal(document.getElementById('modal-host'));

function rerenderIfCurrentRoute(routeHashes) {
    if (routeHashes.includes(window.location.hash)) {
        router.handleRoute();
    }
}

function wireDailyCheckIn() {
    document.getElementById('btn-daily-checkin').addEventListener('click', () => {
        modal.show('Daily Check-In', DailyCheckInForm());

        document.getElementById('checkin-form').addEventListener('submit', event => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const report = store.addReport({
                userId: 1,
                date: todayISO(),
                mood: formData.get('mood'),
                progress: formData.get('progress'),
                blockers: formData.get('blockers') || 'None'
            });

            const summaryLog = createSummaryLogForReport(report);
            if (summaryLog) {
                store.addAiLog(summaryLog);
            }

            modal.close();
            alert('Check-in submitted!');
        });
    });
}

function wireCreateIssue() {
    document.getElementById('btn-create-issue').addEventListener('click', () => {
        modal.show('Create Issue', IssueForm());

        document.getElementById('issue-form').addEventListener('submit', event => {
            event.preventDefault();
            const formData = new FormData(event.target);

            store.addIssue({
                title: formData.get('title'),
                severity: formData.get('severity'),
                status: 'open',
                tags: ['User Reported'],
                author: 'Maya Patel',
                assignee: null,
                sprintId: 2,
                description: formData.get('description')
            });

            modal.close();
        });
    });
}

function wireAvailabilityCheck() {
    document.getElementById('btn-availability').addEventListener('click', () => {
        openAvailabilityCheck();
    });
}

function openAvailabilityCheck() {
    modal.show('Weekly Availability Check', AvailabilityCheckForm());

    document.getElementById('availability-check-form').addEventListener('submit', async event => {
        event.preventDefault();
        const { grid, weekKey } = parseAvailabilityForm(event.target);
        const syncResult = await syncAvailabilityWithGoogleCalendar(grid);

        store.submitWeeklyAvailabilityCheck({
            userId: 1,
            weekKey,
            grid,
            mergedAvailability: syncResult.availability,
            calendarSync: syncResult.sync
        });

        modal.close();
        rerenderIfCurrentRoute(['#team-availability', '#dashboard']);
        alert('Availability check submitted!');
    });
}

function subscribeToStoreEvents() {
    store.subscribe(EVENTS.AI_LOGS_CHANGED, () => {
        rerenderIfCurrentRoute(['#ai-log']);
    });

    store.subscribe(EVENTS.ISSUES_CHANGED, () => {
        rerenderIfCurrentRoute(['#issues', '#dashboard']);
    });

    store.subscribe(EVENTS.AVAILABILITY_CHANGED, () => {
        rerenderIfCurrentRoute(['#team-availability', '#dashboard']);
    });
}

function maybePromptForWeeklyAvailability() {
    if (store.needsWeeklyAvailabilityPrompt()) {
        setTimeout(() => openAvailabilityCheck(), 0);
    }
}

wireDailyCheckIn();
wireCreateIssue();
wireAvailabilityCheck();
subscribeToStoreEvents();
router.init();
maybePromptForWeeklyAvailability();
