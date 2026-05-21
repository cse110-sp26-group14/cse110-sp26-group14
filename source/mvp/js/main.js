/**
 * SE SitRep MVP — application entry (ES modules).
 * @module main
 */

import { Store } from './core/store.js';
import { Router } from './core/router.js';
import { EVENTS } from './core/events.js';
import { routes } from './routes.js';
import { Modal } from './components/Modal.js';
import { DailyCheckInForm } from './components/forms/DailyCheckInForm.js';
import { IssueForm } from './components/forms/IssueForm.js';
import { AvailabilityForm } from './components/forms/AvailabilityForm.js';
import { TaskForm } from './components/forms/TaskForm.js';
import { NoteForm } from './components/forms/NoteForm.js';
import { createSummaryLogForReport } from './services/aiLogService.js';
import { generateTeamSummaryRemote, suggestSprintTasksRemote } from './services/aiSummaryService.js';
import {
  mergeAiLogFromApi,
  mergeTasksFromApi,
  createNoteRemote,
} from './services/dataSyncService.js';
import {
  ensureDemoAccount,
  getSessionUser,
  logout,
} from './services/authService.js';
import {
  createIssueRemote,
  createReportRemote,
  createTaskRemote,
  saveAvailabilityRemote,
  hydrateStoreFromApi,
  refreshStoreFromApi,
} from './services/dataSyncService.js';
import { initGoogleCalendar } from './services/googleCalendarService.js';
import { useRemoteData } from './config/appConfig.js';
import { mountLoginPage } from './views/LoginView.js';
import { bindModalForm } from './utils/modalForm.js';

const loginRoot = document.getElementById('login-root');
const appShell = document.getElementById('app-shell');
const store = new Store();
let router;
let modal;

/**
 * Show login vs app shell.
 * @param {boolean} authed
 */
function toggleShell(authed) {
  loginRoot.classList.toggle('hidden', authed);
  appShell.classList.toggle('hidden', !authed);
}

/**
 * @param {import('./services/authService.js').AuthUser} user
 */
function updateHeaderUser(user) {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const role = document.getElementById('user-role');
  if (avatar) avatar.textContent = user.avatar || '??';
  if (name) name.textContent = user.name;
  if (role) role.textContent = user.role;
}

function syncHeaderFromStore() {
  const sprint = store.getActiveSprint();
  const badge = document.getElementById('header-sprint-badge');
  if (badge && sprint) {
    badge.innerHTML = `<span class="dot"></span> ${sprint.name}: ${sprint.start} – ${sprint.end}`;
  }
}

/**
 * Start authenticated app (router, modals, actions).
 */
async function startApp(authUser) {
  store.setCurrentAuthUser(authUser);
  updateHeaderUser(authUser);
  toggleShell(true);

  try {
    await hydrateStoreFromApi(store);
    syncHeaderFromStore();
  } catch (err) {
    console.error('Failed to load shared data from API', err);
    if (useRemoteData()) {
      alert('Could not load team data from API. Check apiBaseUrl and backend.');
    }
  }

  initGoogleCalendar().catch((err) => console.warn('[Calendar]', err));

  router = new Router(routes, store);
  modal = new Modal(document.getElementById('modal-host'));

  wireDailyCheckIn();
  wireCreateIssue();
  wireAvailability();
  wireAddNote();
  wireTaskModal(authUser);
  wireAiActions(authUser);
  wireHeader();
  wireLogout();
  subscribeToStoreEvents();
  router.init();

  if (!window.location.hash || window.location.hash === '#login') {
    window.location.hash = '#dashboard';
  }
}

/**
 * Show login screen.
 */
function showLogin() {
  toggleShell(false);
  mountLoginPage(loginRoot, {
    onSuccess: (user) => startApp(user),
  });
}

function rerenderIfCurrentRoute(routeHashes) {
  if (routeHashes.includes(window.location.hash)) {
    router.handleRoute();
  }
}

function wireDailyCheckIn() {
  document.getElementById('btn-daily-checkin').addEventListener('click', () => {
    modal.show('Daily Check-In', DailyCheckInForm());
    bindModalForm('checkin-form', async (formData) => {
      const report = await createReportRemote(store, {
        status: formData.get('status'),
        mood: formData.get('mood'),
        progress: formData.get('progress'),
        blockers: formData.get('blockers') || 'None',
      });

      if (!useRemoteData()) {
        const summaryLog = createSummaryLogForReport(report);
        if (summaryLog) store.addAiLog(summaryLog);
      }

      modal.close();
      rerenderIfCurrentRoute(['#dashboard', '#ai-log']);
    });
  });
}

function wireAvailability() {
  document.getElementById('btn-availability')?.addEventListener('click', () => {
    const date = new Date().toISOString().slice(0, 10);
    const uid = store.getCurrentUserId();
    const existing = store.getState().availability?.[date]?.[uid]
      || store.getUsers().find((u) => Number(u.id) === Number(uid))?.availability
      || {};

    modal.show('Update Availability', AvailabilityForm(existing, date));
    bindModalForm('availability-form', async (formData) => {
      const slots = {};
      for (const [key, val] of formData.entries()) {
        if (key.startsWith('slot-')) slots[key.replace('slot-', '')] = val;
      }
      await saveAvailabilityRemote(store, formData.get('date') || date, slots);
      modal.close();
      rerenderIfCurrentRoute(['#team-availability', '#dashboard']);
    });
  });
}

function wireAddNote() {
  document.getElementById('btn-add-note')?.addEventListener('click', () => {
    modal.show('Add Note', NoteForm());
    bindModalForm('note-form', async (formData) => {
      await createNoteRemote(store, {
        title: formData.get('title'),
        content: formData.get('content'),
      });
      modal.close();
      alert('Note saved to AI Log.');
      rerenderIfCurrentRoute(['#ai-log', '#dashboard']);
    });
  });
}

/**
 * @param {import('./services/authService.js').AuthUser} authUser
 */
function wireTaskModal(authUser) {
  window.addEventListener('sitrep:open-task-modal', () => {
    modal.show('Add Task', TaskForm());
    bindModalForm('task-form', async (formData) => {
      await createTaskRemote(store, {
        title: formData.get('title'),
        priority: formData.get('priority'),
        due: formData.get('due') || null,
        owner: authUser.name,
        sprintId: store.getActiveSprint()?.id ?? 2,
        status: 'open',
      });
      modal.close();
      rerenderIfCurrentRoute(['#backlog', '#dashboard', '#calendar']);
    });
  });
}

function wireCreateIssue() {
  document.getElementById('btn-create-issue').addEventListener('click', () => {
    modal.show('Create Issue', IssueForm());
    bindModalForm('issue-form', async (formData) => {
      await createIssueRemote(store, {
        title: formData.get('title'),
        severity: formData.get('severity'),
        status: 'open',
        tags: ['User Reported'],
        author: store.currentAuthUser?.name || 'Team Member',
        assignee: null,
        sprintId: store.getActiveSprint()?.id ?? 2,
        description: formData.get('description'),
      });

      modal.close();
      rerenderIfCurrentRoute(['#issues', '#dashboard']);
    });
  });
}

function wireHeader() {
  const search = document.getElementById('header-search');
  if (search) {
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = search.value.trim();
      if (!q) return;
      sessionStorage.setItem('sitrep:search', q);
      window.location.hash = '#issues';
    });
  }

  document.getElementById('btn-notifications')?.addEventListener('click', () => {
    sessionStorage.setItem('sitrep:issues-filter', 'Open');
    window.location.hash = '#issues';
  });
}

/**
 * @param {import('./services/authService.js').AuthUser} authUser
 */
function wireAiActions(authUser) {
  const aiBtn = document.getElementById('btn-ai-suggest');
  if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
      if (!authUser.isAdmin) {
        alert('AI Sprint Task Suggestion is for admins only.');
        return;
      }
      const goals = window.prompt('Describe sprint goals or deadlines:', 'MVP delivery and bug fixes');
      if (goals === null) return;

      try {
        const sprintId = store.getActiveSprint()?.id ?? 2;
        const result = await suggestSprintTasksRemote(goals, sprintId);
        if (!useRemoteData()) {
          result.tasks.forEach((s) => {
            store.addTask({
              title: s.title,
              priority: s.priority,
              owner: authUser.name,
              sprintId,
            });
          });
        } else {
          mergeTasksFromApi(store, result.tasks);
        }
        mergeAiLogFromApi(store, result.log);
        if (useRemoteData()) await refreshStoreFromApi(store);
        alert(`Added ${result.tasks.length} suggested tasks to the sprint.`);
        rerenderIfCurrentRoute(['#dashboard', '#backlog', '#ai-log', '#calendar']);
      } catch (err) {
        alert(err.message || 'AI task suggestion failed.');
      }
    });
  }

  const summaryBtn = document.getElementById('btn-ai-summary');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', async () => {
      try {
        const log = await generateTeamSummaryRemote(store);
        if (useRemoteData()) {
          mergeAiLogFromApi(store, log);
          await refreshStoreFromApi(store);
        } else {
          store.addAiLog(log);
        }
        alert('AI team summary generated and saved to AI Log.');
        rerenderIfCurrentRoute(['#dashboard', '#ai-log', '#backlog']);
      } catch (err) {
        alert(err.message || 'AI summary failed. Set DEEPSEEK_API_KEY on the backend (Render).');
      }
    });
  }
}

function wireLogout() {
  const btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', async () => {
      await logout();
      window.location.hash = '';
      showLogin();
    });
  }
}

function subscribeToStoreEvents() {
  store.subscribe(EVENTS.AI_LOGS_CHANGED, () => {
    rerenderIfCurrentRoute(['#ai-log', '#dashboard']);
  });

  store.subscribe(EVENTS.ISSUES_CHANGED, () => {
    rerenderIfCurrentRoute(['#issues', '#dashboard']);
  });

  store.subscribe(EVENTS.REPORTS_CHANGED, () => {
    rerenderIfCurrentRoute(['#dashboard', '#backlog']);
  });

  store.subscribe(EVENTS.TASKS_CHANGED, () => {
    rerenderIfCurrentRoute(['#backlog', '#dashboard', '#calendar']);
  });
}

/** Bootstrap */
async function init() {
  ensureDemoAccount();
  const session = await getSessionUser();
  if (session) {
    await startApp(session);
  } else {
    showLogin();
  }
}

init();
