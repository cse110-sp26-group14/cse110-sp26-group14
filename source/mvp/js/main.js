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
import { MeetingForm } from './components/forms/MeetingForm.js';
import { AiTaskReviewForm } from './components/forms/AiTaskReviewForm.js';
import { createSummaryLogForReport } from './services/aiLogService.js';
import { generateTeamSummaryRemote, suggestSprintTasksRemote } from './services/aiSummaryService.js';
import {
  mergeAiLogFromApi,
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
  createMeetingRemote,
  updateAiLogStatusRemote,
  saveAvailabilityRemote,
  hydrateStoreFromApi,
  refreshStoreFromApi,
} from './services/dataSyncService.js';
import { initGoogleCalendar } from './services/googleCalendarService.js';
import { useRemoteData } from './config/appConfig.js';
import { mountLoginPage } from './views/LoginView.js';
import { bindModalForm } from './utils/modalForm.js';
import { loadHtmlTemplates } from './utils/templateEngine.js';

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
  const sprint = store.getSelectedSprint();
  const badge = document.getElementById('header-sprint-badge');
  if (badge && sprint) {
    badge.innerHTML = `<span class="dot"></span> ${sprint.name}: ${sprint.start} – ${sprint.end}`;
  }
  const select = document.getElementById('header-sprint-select');
  if (select && store.getState().sprints?.length) {
    const current = store.getSelectedSprint()?.id ?? '';
    select.innerHTML = store.getState().sprints.map((s) => `
      <option value="${s.id}" ${Number(s.id) === Number(current) ? 'selected' : ''}>${s.name} (${s.status})</option>
    `).join('');
  }
}

function wireSprintSelector() {
  const select = document.getElementById('header-sprint-select');
  if (!select) return;
  select.addEventListener('change', () => {
    const id = Number(select.value);
    store.setSelectedSprintId(Number.isFinite(id) ? id : null);
    syncHeaderFromStore();
    rerenderIfCurrentRoute([
      '#dashboard', '#calendar', '#backlog', '#issues', '#team-availability',
    ]);
  });
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
      const msg = String(err?.message || '');
      if (msg.includes('401') || msg.includes('Login required') || msg.includes('Unauthorized')) {
        await logout();
        alert('Session expired or invalid. Please log in again.');
        showLogin();
        return;
      }
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
  wireSprintSelector();
  wireMeetingModal();
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
        notes: formData.get('notes') || '',
        sprintId: store.getSelectedSprint()?.id,
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
        sprintId: store.getSelectedSprint()?.id ?? 2,
        status: 'open',
      });
      modal.close();
      rerenderIfCurrentRoute(['#backlog', '#dashboard', '#calendar']);
    });
  });
}

function wireMeetingModal() {
  window.addEventListener('sitrep:open-meeting-modal', (e) => {
    const detail = e.detail || {};
    const date = detail.date || new Date().toISOString().slice(0, 10);
    const time = detail.time || '10:00 AM';
    modal.show('Schedule meeting', MeetingForm(date, time));
    bindModalForm('meeting-form', async (formData) => {
      await createMeetingRemote(store, {
        title: formData.get('title'),
        date: formData.get('date'),
        time: formData.get('time'),
        format: formData.get('format'),
        goal: formData.get('goal') || '',
        sprintId: store.getSelectedSprint()?.id ?? 2,
      });
      modal.close();
      rerenderIfCurrentRoute(['#calendar', '#dashboard', '#team-availability']);
    });
  });
}

function wireCreateIssue() {
  document.getElementById('btn-create-issue').addEventListener('click', () => {
    modal.show('Create Issue', IssueForm());
    bindModalForm('issue-form', async (formData) => {
      const sprintId = store.getSelectedSprint()?.id ?? 2;
      await createIssueRemote(store, {
        title: formData.get('title'),
        severity: formData.get('severity'),
        status: 'open',
        tags: ['User Reported'],
        author: store.currentAuthUser?.name || 'Team Member',
        assignee: null,
        sprintId,
        description: formData.get('description'),
      });

      if (formData.get('createTask')) {
        await createTaskRemote(store, {
          title: formData.get('title'),
          priority: formData.get('severity') === 'critical' || formData.get('severity') === 'high'
            ? 'high'
            : 'medium',
          owner: store.currentAuthUser?.name,
          sprintId,
          status: 'open',
        });
      }

      modal.close();
      rerenderIfCurrentRoute(['#issues', '#dashboard', '#backlog']);
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
        const sprintId = store.getSelectedSprint()?.id ?? 2;
        const result = await suggestSprintTasksRemote(goals, sprintId);
        const suggestions = result.suggestions || result.tasks || [];
        mergeAiLogFromApi(store, result.log);
        if (useRemoteData()) await refreshStoreFromApi(store);

        modal.show('Review AI task suggestions', AiTaskReviewForm(suggestions));
        const form = document.getElementById('ai-task-review-form');
        document.getElementById('ai-review-reject-all')?.addEventListener('click', () => {
          modal.close();
        });
        form?.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const fd = new FormData(form);
          const picked = suggestions
            .map((_, i) => (fd.get(`pick-${i}`) ? {
              title: fd.get(`title-${i}`),
              priority: fd.get(`priority-${i}`) || 'medium',
            } : null))
            .filter(Boolean);
          for (const t of picked) {
            await createTaskRemote(store, {
              ...t,
              owner: authUser.name,
              sprintId,
              status: 'open',
            });
          }
          if (result.log?.id) {
            await updateAiLogStatusRemote(store, result.log.id, picked.length ? 'applied' : 'rejected');
          }
          modal.close();
          if (useRemoteData()) await refreshStoreFromApi(store);
          alert(picked.length
            ? `Added ${picked.length} task(s) to the sprint.`
            : 'No tasks were added.');
          rerenderIfCurrentRoute(['#dashboard', '#backlog', '#ai-log', '#calendar']);
        });
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
        const msg = err.message || '';
        if (msg.includes('401') || msg.includes('Login required')) {
          await logout();
          alert('Session expired. Please log in again, then retry AI Team Summary.');
          showLogin();
          return;
        }
        alert(msg || 'AI summary failed. Set DEEPSEEK_API_KEY on the backend (Render).');
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

  store.subscribe(EVENTS.SPRINT_CHANGED, () => {
    syncHeaderFromStore();
    rerenderIfCurrentRoute([
      '#dashboard', '#calendar', '#backlog', '#issues', '#team-availability',
    ]);
  });

  store.subscribe(EVENTS.MEETINGS_CHANGED, () => {
    rerenderIfCurrentRoute(['#calendar', '#dashboard', '#team-availability']);
  });
}

/** Bootstrap: load HTML partials, then auth + app shell. */
async function init() {
  try {
    await loadHtmlTemplates();
  } catch (err) {
    console.error('[SitRep] Template load failed', err);
  }
  ensureDemoAccount();
  const session = await getSessionUser();
  if (session) {
    await startApp(session);
  } else {
    showLogin();
  }
}

init();
