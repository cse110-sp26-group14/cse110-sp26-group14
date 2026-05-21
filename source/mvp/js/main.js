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
import { AiGoalsForm } from './components/forms/AiGoalsForm.js';
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
import { bindOnce } from './utils/dom.js';
import { showToast, runWithButtonFeedback } from './utils/toast.js';
import { loadHtmlTemplates } from './utils/templateEngine.js';
import { normalizeTasksInStore } from './utils/taskHelpers.js';
import { syncHeaderFromStore as syncHeader } from './services/headerSync.js';

const loginRoot = document.getElementById('login-root');
const appShell = document.getElementById('app-shell');
const store = new Store();
let router;
let modal;
let storeEventsWired = false;
let appShellWired = false;

/**
 * Show login vs app shell.
 * @param {boolean} authed
 */
function toggleShell(authed) {
  loginRoot.classList.toggle('hidden', authed);
  appShell.classList.toggle('hidden', !authed);
  if (!authed) closeMobileNav();
}

/**
 * @param {import('./services/authService.js').AuthUser} user
 */
function updateHeaderUser(user) {
  const initials = user.avatar || '??';
  const nameText = user.name || 'Guest';
  const roleText = user.role || '—';
  ['user-avatar', 'user-avatar-menu'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
  ['user-name', 'user-name-menu'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = nameText;
  });
  ['user-role', 'user-role-menu'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = roleText;
  });
}

function closeUserMenu() {
  const menu = document.getElementById('user-menu');
  const trigger = document.getElementById('user-menu-trigger');
  const panel = document.getElementById('user-menu-panel');
  menu?.classList.remove('user-menu-open');
  trigger?.setAttribute('aria-expanded', 'false');
  panel?.classList.add('hidden');
}

function wireUserMenu() {
  const menu = document.getElementById('user-menu');
  const trigger = document.getElementById('user-menu-trigger');
  const panel = document.getElementById('user-menu-panel');
  if (!menu || !trigger || !panel) return;

  bindOnce(trigger, 'click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('user-menu-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('hidden', !open);
  });

  bindOnce(document, 'click', (e) => {
    if (!menu.contains(e.target)) closeUserMenu();
  });

  bindOnce(document, 'keydown', (e) => {
    if (e.key === 'Escape') closeUserMenu();
  });

  panel.querySelector('a[href="#settings"]')?.addEventListener('click', () => {
    closeUserMenu();
  });
}

function syncHeaderFromStore() {
  syncHeader(store);
}

function onSprintSelectChange() {
  const select = document.getElementById('header-sprint-select');
  if (!select) return;
  const id = Number(select.value);
  store.setSelectedSprintId(Number.isFinite(id) ? id : null);
  syncHeaderFromStore();
  rerenderIfCurrentRoute([
    '#dashboard', '#calendar', '#backlog', '#issues', '#team-availability', '#settings',
  ]);
}

function wireSprintSelector() {
  /* Sprint select is wired via document-level change delegation (see bottom of file). */
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
    store.reconcileSprints();
    if (normalizeTasksInStore(store)) {
      store.publish(EVENTS.TASKS_CHANGED, store.state.tasks);
    }
    syncHeaderFromStore();
  } catch (err) {
    console.error('Failed to load shared data from API', err);
    if (useRemoteData()) {
      const msg = String(err?.message || '');
      if (msg.includes('401') || msg.includes('Login required') || msg.includes('Unauthorized')) {
        await logout();
        showToast('Session expired. Please log in again.', 'warning', 5000);
        showLogin();
        return;
      }
      showToast('Could not load team data. Check API URL and Worker deploy.', 'error', 6000);
    }
  }

  initGoogleCalendar().catch((err) => console.warn('[Calendar]', err));

  if (!modal) {
    modal = new Modal(document.getElementById('modal-host'));
  }
  if (!router) {
    router = new Router(routes, store);
    router.init();
  } else {
    router.handleRoute();
  }

  if (!appShellWired) {
    appShellWired = true;
    wireDailyCheckIn();
    wireCreateIssue();
    wireAvailability();
    wireAddNote();
    wireTaskModal();
    wireAiActions();
    wireHeader();
    wireUserMenu();
    wireSprintSelector();
    wireLogout();
    subscribeToStoreEvents();
  }

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
  const hash = window.location.hash || '#dashboard';
  if (routeHashes.includes(hash) && router) {
    router.handleRoute();
  }
}

function wireDailyCheckIn() {
  bindOnce(document.getElementById('btn-daily-checkin'), 'click', () => {
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

      rerenderIfCurrentRoute(['#dashboard', '#ai-log']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Check-in submitted — saving…',
      successToast: 'Check-in saved.',
    });
  });
}

function wireAvailability() {
  bindOnce(document.getElementById('btn-availability'), 'click', () => {
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
      rerenderIfCurrentRoute(['#team-availability', '#dashboard']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Availability submitted — saving…',
      successToast: 'Availability updated.',
    });
  });
}

function wireAddNote() {
  bindOnce(document.getElementById('btn-add-note'), 'click', () => {
    modal.show('Add Note', NoteForm());
    bindModalForm('note-form', async (formData) => {
      await createNoteRemote(store, {
        title: formData.get('title'),
        content: formData.get('content'),
      });
      rerenderIfCurrentRoute(['#ai-log', '#dashboard']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Note submitted — saving…',
      successToast: 'Note saved to AI Log.',
    });
  });
}

function wireTaskModal() {
  if (window.__sitrepTaskModalWired) return;
  window.__sitrepTaskModalWired = true;
  window.addEventListener('sitrep:open-task-modal', () => {
    modal.show('Add Task', TaskForm(store));
    bindModalForm('task-form', async (formData) => {
      await createTaskRemote(store, {
        title: formData.get('title'),
        priority: formData.get('priority'),
        due: formData.get('due'),
        owner: formData.get('owner') || store.currentAuthUser?.name || 'Team Member',
        sprintId: store.getSelectedSprint()?.id ?? 2,
        status: 'open',
      });
      rerenderIfCurrentRoute(['#backlog', '#dashboard', '#calendar']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Task submitted — saving…',
      successToast: 'Task added to sprint.',
    });
  });
}

let meetingModalWired = false;

function wireMeetingModal() {
  if (meetingModalWired) return;
  meetingModalWired = true;
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
      rerenderIfCurrentRoute(['#calendar', '#dashboard', '#team-availability']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Meeting submitted — saving…',
      successToast: 'Meeting scheduled.',
    });
  });
}

function wireCreateIssue() {
  bindOnce(document.getElementById('btn-create-issue'), 'click', () => {
    modal.show('Create Issue', IssueForm(store));
    bindModalForm('issue-form', async (formData) => {
      const sprintId = store.getSelectedSprint()?.id ?? 2;
      const assignee = formData.get('assignee');
      const due = formData.get('due');
      await createIssueRemote(store, {
        title: formData.get('title'),
        severity: formData.get('severity'),
        status: 'open',
        tags: ['User Reported'],
        author: store.currentAuthUser?.name || 'Team Member',
        assignee,
        due,
        sprintId,
        description: formData.get('description'),
      });

      if (formData.get('createTask')) {
        await createTaskRemote(store, {
          title: formData.get('title'),
          priority: formData.get('severity') === 'critical' || formData.get('severity') === 'high'
            ? 'high'
            : 'medium',
          owner: assignee,
          due,
          sprintId,
          status: 'open',
        });
      }

      rerenderIfCurrentRoute(['#issues', '#dashboard', '#backlog']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Issue submitted — saving…',
      successToast: 'Issue created.',
    });
  });
}

function closeMobileNav() {
  const root = document.getElementById('root');
  const menuBtn = document.getElementById('btn-mobile-menu');
  root?.classList.remove('nav-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-nav-open');
}

function openMobileNav() {
  const root = document.getElementById('root');
  const menuBtn = document.getElementById('btn-mobile-menu');
  root?.classList.add('nav-open');
  menuBtn?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mobile-nav-open');
}

/** Document-level mobile nav (survives pageshow / bfcache re-bootstrap). */
function wireMobileNavDocument() {
  if (document.documentElement.dataset.mobileNavWired === '1') return;
  document.documentElement.dataset.mobileNavWired = '1';

  document.addEventListener('click', (e) => {
    if (appShell?.classList.contains('hidden')) return;

    if (e.target.closest('#btn-mobile-menu')) {
      const root = document.getElementById('root');
      if (root?.classList.contains('nav-open')) closeMobileNav();
      else openMobileNav();
      return;
    }

    if (e.target.closest('#sidebar-backdrop')) {
      closeMobileNav();
      return;
    }

    if (
      e.target.closest('#sidebar-nav .nav-item')
      && document.getElementById('root')?.classList.contains('nav-open')
    ) {
      closeMobileNav();
    }
  });
}

function wireHeader() {
  const search = document.getElementById('header-search');
  bindOnce(search, 'keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = search.value.trim();
      if (!q) return;
      sessionStorage.setItem('sitrep:search', q);
      window.location.hash = '#issues';
  });

  bindOnce(document.getElementById('btn-notifications'), 'click', () => {
    sessionStorage.setItem('sitrep:issues-filter', 'Open');
    window.location.hash = '#issues';
  });
}

/**
 * @param {string} goals
 * @param {HTMLButtonElement|null} aiBtn
 */
async function runAiTaskSuggestions(goals, aiBtn) {
  const authUser = store.currentAuthUser;
  await runWithButtonFeedback(aiBtn, async () => {
    const sprintId = store.getSelectedSprint()?.id ?? 2;
    const result = await suggestSprintTasksRemote(store, goals, sprintId);
    const suggestions = result.suggestions || result.tasks || [];
    mergeAiLogFromApi(store, result.log);
    if (useRemoteData()) await refreshStoreFromApi(store);

    if (result.parseFailed) {
      showToast(
        'AI response could not be parsed. Showing fallback tasks — see AI Log for details.',
        'warning',
        7000,
      );
    }

    modal.show('Review AI task suggestions', AiTaskReviewForm(suggestions, store));
    const form = document.getElementById('ai-task-review-form');
    document.getElementById('ai-review-reject-all')?.addEventListener('click', () => {
      modal.close();
      showToast('Suggestions dismissed.', 'info', 3000);
    }, { once: true });
    form?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const alsoIssues = fd.get('createIssues') === '1';
      const picked = suggestions
        .map((_, i) => (fd.get(`pick-${i}`) ? {
          title: fd.get(`title-${i}`),
          priority: fd.get(`priority-${i}`) || 'medium',
          owner: fd.get(`owner-${i}`) || authUser?.name || 'Team Member',
          due: fd.get(`due-${i}`),
          sprintId,
          status: 'open',
        } : null))
        .filter(Boolean);

      modal.close();
      showToast('Applying selected tasks…', 'info', 2200);

      try {
        for (const t of picked) {
          await createTaskRemote(store, t, { fromAi: true });
          if (alsoIssues && (t.priority === 'critical' || t.priority === 'high')) {
            await createIssueRemote(store, {
              title: t.title,
              severity: t.priority === 'critical' ? 'critical' : 'high',
              assignee: t.owner,
              due: t.due,
              sprintId,
              tags: ['AI Suggested'],
              author: authUser?.name || 'Team Member',
              description: `Tracking issue for AI-suggested task: ${t.title}`,
            });
          }
        }
        if (result.log?.id) {
          await updateAiLogStatusRemote(store, result.log.id, picked.length ? 'applied' : 'rejected');
        }
        if (useRemoteData()) await refreshStoreFromApi(store);
        showToast(
          picked.length
            ? `Added ${picked.length} task(s) to the sprint.`
            : 'No tasks were added.',
          picked.length ? 'success' : 'info',
          4200,
        );
        rerenderIfCurrentRoute(['#dashboard', '#backlog', '#ai-log', '#calendar']);
      } catch (err) {
        showToast(err?.message || 'Could not apply tasks.', 'error', 6000);
      }
    });
  }, {
    busyLabel: 'Generating…',
    pendingToast: false,
    successToast: 'Suggestions ready — review in the dialog.',
    errorToast: false,
  });
}

function wireAiActions() {
  const aiBtn = document.getElementById('btn-ai-suggest');
  bindOnce(aiBtn, 'click', () => {
    modal.show('AI Sprint Task Suggestion', AiGoalsForm());
    document.getElementById('ai-goals-cancel')?.addEventListener('click', () => modal.close(), { once: true });
    bindModalForm('ai-goals-form', async (fd) => {
      const goals = String(fd.get('goals') || '').trim();
      if (!goals) throw new Error('Please describe sprint goals.');
      try {
        await runAiTaskSuggestions(goals, aiBtn);
      } catch {
        /* runWithButtonFeedback already toasted */
      }
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Generating task suggestions…',
      successToast: false,
      submittingLabel: 'Starting…',
    });
  });

  const summaryBtn = document.getElementById('btn-ai-summary');
  bindOnce(summaryBtn, 'click', async () => {
      try {
        await runWithButtonFeedback(summaryBtn, async () => {
          const log = await generateTeamSummaryRemote(store);
          if (useRemoteData()) {
            mergeAiLogFromApi(store, log);
            await refreshStoreFromApi(store);
          } else {
            store.addAiLog(log);
          }
          rerenderIfCurrentRoute(['#dashboard', '#ai-log', '#backlog']);
        }, {
          busyLabel: 'Summarizing…',
          pendingToast: 'Generating team summary…',
          successToast: 'Summary saved to AI Log.',
          errorToast: false,
        });
      } catch (err) {
        const msg = err?.message || '';
        if (msg.includes('401') || msg.includes('Login required')) {
          await logout();
          showToast('Session expired. Please log in again.', 'warning', 5000);
          showLogin();
        }
      }
  });
}

function wireLogout() {
  /* Log out is wired via document-level click delegation (see bottom of file). */
}

function subscribeToStoreEvents() {
  if (storeEventsWired) return;
  storeEventsWired = true;
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
      '#dashboard', '#calendar', '#backlog', '#issues', '#team-availability', '#settings',
    ]);
  });

  store.subscribe(EVENTS.MEETINGS_CHANGED, () => {
    rerenderIfCurrentRoute(['#calendar', '#dashboard', '#team-availability']);
  });
}

/** Reset wiring flags so each full page load re-binds handlers (Playwright / bfcache). */
function resetAppWiringFlags() {
  appShellWired = false;
  storeEventsWired = false;
  delete window.__sitrepTaskModalWired;
  delete document.dataset?.sitrepBound;
}

/** Bootstrap: load HTML partials, then auth + app shell. */
async function bootstrap() {
  resetAppWiringFlags();
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

window.addEventListener('pageshow', () => {
  bootstrap();
});

document.addEventListener('change', (e) => {
  if (e.target?.id === 'header-sprint-select') onSprintSelectChange();
});

document.addEventListener('click', async (e) => {
  if (!e.target.closest('#btn-logout')) return;
  e.preventDefault();
  e.stopPropagation();
  closeUserMenu();
  await logout();
  window.location.hash = '';
  showLogin();
}, true);

wireMeetingModal();
wireMobileNavDocument();
