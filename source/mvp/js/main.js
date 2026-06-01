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
import { TaskForm, mountTaskForm } from './components/forms/TaskForm.js';
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
  createSubtaskRemote,
  updateTaskRemote,
  completeSubtaskRemote,
  startLiveSync,
  stopLiveSync,
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
 * Updates the header (and user-menu) avatar, name, and role elements to reflect
 * the given user.
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

/**
 * Closes the user menu, collapsing its trigger and hiding its panel.
 * @returns {void}
 */
function closeUserMenu() {
  const menu = document.getElementById('user-menu');
  const trigger = document.getElementById('user-menu-trigger');
  const panel = document.getElementById('user-menu-panel');
  menu?.classList.remove('user-menu-open');
  trigger?.setAttribute('aria-expanded', 'false');
  panel?.classList.add('hidden');
}

/**
 * Wires the user menu: toggling on trigger click, and closing on outside click
 * or Escape, plus closing when the Settings link is followed.
 * @returns {void}
 */
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

/**
 * Syncs the header sprint badge/selector from the store.
 * @returns {void}
 */
function syncHeaderFromStore() {
  syncHeader(store);
}

/**
 * Handles a change to the header sprint selector: updates the selected sprint,
 * re-syncs the header, and re-renders the current route when relevant.
 * @returns {void}
 */
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

/**
 * Placeholder for sprint-selector wiring; the selector is handled via
 * document-level change delegation (see bottom of file).
 * @returns {void}
 */
function wireSprintSelector() {
  /* Sprint select is wired via document-level change delegation (see bottom of file). */
}

/**
 * Start authenticated app (router, modals, actions).
 * @param {import('./services/authService.js').AuthUser} authUser
 * @returns {Promise<void>}
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
    wireSubtaskEvents();
    wireTaskDetail();
    wireAiActions();
    wireHeader();
    wireUserMenu();
    wireSprintSelector();
    wireLogout();
    subscribeToStoreEvents();
  }

  startLiveSync(store, router);

  if (!window.location.hash || window.location.hash === '#login') {
    window.location.hash = '#dashboard';
  }
}

/**
 * Show login screen.
 * @returns {void}
 */
function showLogin() {
  toggleShell(false);
  mountLoginPage(loginRoot, {
    onSuccess: (user) => startApp(user),
  });
}

/**
 * Re-renders the current route via the router when its hash is in the provided
 * list (and the router exists).
 * @param {string[]} routeHashes
 * @returns {void}
 */
function rerenderIfCurrentRoute(routeHashes) {
  const hash = window.location.hash || '#dashboard';
  if (routeHashes.includes(hash) && router) {
    router.handleRoute();
  }
}

/**
 * Wires the daily check-in button to open the check-in modal and submit a new
 * report (also creating a local AI summary log in local mode).
 * @returns {void}
 */
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

/**
 * Wires the availability button to open the availability modal (pre-filled with
 * the user's existing slots) and save the updated slots.
 * @returns {void}
 */
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

/**
 * Wires the add-note button to open the note modal and save a new team note to
 * the AI Log.
 * @returns {void}
 */
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

/**
 * Wires the open-task-modal event (once) to show the task form and create a new
 * task, auto-creating one sub-task per assignee when two or more are assigned.
 * @returns {void}
 */
function wireTaskModal() {
  if (window.__sitrepTaskModalWired) return;
  window.__sitrepTaskModalWired = true;
  window.addEventListener('sitrep:open-task-modal', () => {
    modal.show('Add New Task', TaskForm(store));
    const modalContainer = document.querySelector('.modal-body') || document.querySelector('#modal-content') || document.body;
    mountTaskForm(modalContainer, store, () => modal.close());
    bindModalForm('task-form', async (formData) => {
      const assignees = formData.getAll('assignees').filter(Boolean);
      const sprintId = Number(formData.get('sprintId')) || store.getSelectedSprint()?.id || 2;
      const task = await createTaskRemote(store, {
        title: formData.get('title'),
        priority: formData.get('priority'),
        due: formData.get('due'),
        description: formData.get('description') || '',
        type: formData.get('type') || 'feature',
        assignees,
        owner: assignees[0] || store.currentAuthUser?.name || 'Team Member',
        sprintId,
        status: 'open',
      });

      // If 2+ assignees, auto-create one sub-task per person
      if (assignees.length >= 2 && task?.id) {
        for (const [i, person] of assignees.entries()) {
          await createSubtaskRemote(store, task.id, {
            title: `${formData.get('title')} — Part ${i + 1} (${person})`,
            assignees: [person],
            owner: person,
            priority: formData.get('priority'),
            due: formData.get('due'),
            status: 'open',
          });
        }
        showToast(`Task created with ${assignees.length} sub-tasks, one per assignee.`, 'success', 4000);
      }

      rerenderIfCurrentRoute(['#backlog', '#dashboard', '#calendar']);
    }, {
      onClose: () => modal.close(),
      pendingToast: 'Task submitted — saving…',
      successToast: assignees => assignees?.length >= 2 ? false : 'Task added to sprint.',
    });
  });
}

/** Wire task detail modal (click on a backlog row). */
function wireTaskDetail() {
  if (window.__sitrepTaskDetailWired) return;
  window.__sitrepTaskDetailWired = true;

  window.addEventListener('sitrep:open-task-detail', (e) => {
    const { taskId } = e.detail || {};
    const task = store.getState().tasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) return;

    const sprints = store.getState().sprints || [];
    const sprintName = sprints.find((s) => s.id === task.sprintId)?.name || `Sprint ${task.sprintId}`;
    const assignees = task.assignees?.length ? task.assignees : (task.owner ? [task.owner] : []);

    const priorityColors = {
      critical: { bg: '#fee2e2', color: '#dc2626' },
      high:     { bg: '#fef9c3', color: '#ca8a04' },
      medium:   { bg: '#dbeafe', color: '#2563eb' },
      low:      { bg: '#f3f4f6', color: '#6b7280' },
    };
    const statusColors = {
      blocked:  { bg: '#fee2e2', color: '#dc2626' },
      progress: { bg: '#ede9fe', color: '#7c3aed' },
      open:     { bg: '#f3f4f6', color: '#374151' },
      resolved: { bg: '#dcfce7', color: '#15803d' },
      done:     { bg: '#dcfce7', color: '#15803d' },
    };
    const pStyle = priorityColors[task.priority] || priorityColors.low;
    const sStyle = statusColors[task.status] || statusColors.open;

    const subtasks = store.getState().tasks.filter((t) => Number(t.parentTaskId) === Number(taskId));

    const avatarColor = (name) => {
      const palette = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
      let hash = 0;
      for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
      return palette[hash % palette.length];
    };
    const initials = (name) => {
      const p = (name || '').trim().split(/\s+/);
      return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : (p[0]||'?')[0].toUpperCase();
    };

    const html = `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">

        <!-- Badges row -->
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <span style="background:${pStyle.bg};color:${pStyle.color};font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:999px;">
            ${(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
          </span>
          <span style="background:${sStyle.bg};color:${sStyle.color};font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:6px;">
            ${task.status === 'progress' ? 'In Progress' : (task.status || 'open').charAt(0).toUpperCase() + (task.status || 'open').slice(1)}
          </span>
          ${task.type ? `<span style="background:#f3f4f6;color:#374151;font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:6px;">${task.type}</span>` : ''}
        </div>

        <!-- Meta grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div style="background:#f9fafb;border-radius:8px;padding:0.75rem;">
            <div style="font-size:0.72rem;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:0.3rem;">Sprint</div>
            <div style="font-size:0.875rem;font-weight:500;">${sprintName}</div>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:0.75rem;">
            <div style="font-size:0.72rem;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:0.3rem;">Due Date</div>
            <div style="font-size:0.875rem;font-weight:500;">${task.due || '—'}</div>
          </div>
        </div>

        <!-- Assignees -->
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:0.5rem;">Assignees</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            ${assignees.length
              ? assignees.map((a) => `
                <div style="display:flex;align-items:center;gap:0.5rem;background:#f3f4f6;border-radius:999px;padding:0.25rem 0.75rem 0.25rem 0.3rem;">
                  <span style="display:inline-flex;align-items:center;justify-content:center;
                    width:24px;height:24px;border-radius:50%;background:${avatarColor(a)};color:#fff;font-size:0.65rem;font-weight:700;">
                    ${initials(a)}
                  </span>
                  <span style="font-size:0.85rem;font-weight:500;">${a}</span>
                </div>`).join('')
              : '<span style="color:#9ca3af;font-size:0.875rem;">Unassigned</span>'}
          </div>
        </div>

        <!-- Description -->
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:0.5rem;">Description</div>
          <div style="background:#f9fafb;border-radius:8px;padding:0.875rem;font-size:0.875rem;color:#374151;min-height:60px;line-height:1.6;">
            ${task.description && task.description.trim() ? task.description.trim().replace(/\n/g, '<br>') : '<span style="color:#9ca3af;">No description provided.</span>'}
          </div>
        </div>

        <!-- Sub-tasks -->
        ${subtasks.length ? `
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:0.5rem;">
            Sub-tasks (${subtasks.filter(s=>s.status==='resolved').length}/${subtasks.length} done)
          </div>
          <div style="display:flex;flex-direction:column;gap:0.4rem;">
            ${subtasks.map((sub) => {
              const done = sub.status === 'resolved';
              const subA = sub.assignees?.length ? sub.assignees : (sub.owner ? [sub.owner] : []);
              return `
                <div style="display:flex;align-items:center;gap:0.75rem;background:#f9fafb;border-radius:8px;padding:0.6rem 0.875rem;">
                  <span style="font-size:1rem;${done ? 'color:#15803d;' : 'color:#d1d5db;'}">${done ? '✓' : '○'}</span>
                  <span style="font-size:0.85rem;flex:1;${done ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${sub.title}</span>
                  ${subA.length ? `<span style="font-size:0.75rem;color:#6b7280;">${subA[0]}</span>` : ''}
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

      </div>
    `;

    modal.show(task.title, html);
  });
}

/** Wire sub-task events dispatched from BacklogView. */
function wireSubtaskEvents() {
  if (window.__sitrepSubtaskWired) return;
  window.__sitrepSubtaskWired = true;

  window.addEventListener('sitrep:complete-subtask', async (e) => {
    const { subtaskId } = e.detail || {};
    if (!subtaskId) return;
    try {
      await completeSubtaskRemote(store, subtaskId);
      showToast('Sub-task marked complete.', 'success', 3000);
      rerenderIfCurrentRoute(['#backlog', '#dashboard']);
    } catch (err) {
      showToast(err?.message || 'Could not complete sub-task.', 'error', 5000);
    }
  });

  window.addEventListener('sitrep:split-task', async (e) => {
    const { taskId } = e.detail || {};
    if (!taskId) return;
    const task = store.state.tasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) return;
    const assignees = task.assignees?.length >= 2 ? task.assignees : [];
    if (assignees.length < 2) {
      showToast('Task needs 2+ assignees to split into sub-tasks.', 'warning', 4000);
      return;
    }
    try {
      for (const [i, person] of assignees.entries()) {
        await createSubtaskRemote(store, taskId, {
          title: `${task.title} — Part ${i + 1} (${person})`,
          assignees: [person],
          owner: person,
          priority: task.priority,
          due: task.due,
          status: 'open',
        });
      }
      await updateTaskRemote(store, taskId, { status: 'progress' }, task.updatedAt);
      showToast(`Split into ${assignees.length} sub-tasks.`, 'success', 3500);
      rerenderIfCurrentRoute(['#backlog', '#dashboard']);
    } catch (err) {
      showToast(err?.message || 'Could not split task.', 'error', 5000);
    }
  });
}

let meetingModalWired = false;

/**
 * Wires the open-meeting-modal event (once) to show the meeting form (pre-filled
 * with date/time) and create a new meeting.
 * @returns {void}
 */
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

/**
 * Wires the create-issue button to open the issue modal and create a new issue,
 * optionally also creating a tracking task.
 * @returns {void}
 */
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

/**
 * Closes the mobile navigation drawer and clears its open state.
 * @returns {void}
 */
function closeMobileNav() {
  const root = document.getElementById('root');
  const menuBtn = document.getElementById('btn-mobile-menu');
  root?.classList.remove('nav-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-nav-open');
}

/**
 * Opens the mobile navigation drawer and sets its open state.
 * @returns {void}
 */
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

/**
 * Wires the header search box (Enter searches issues) and the notifications
 * button (jumps to open issues).
 * @returns {void}
 */
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
 * Requests AI task suggestions for the given goals, then shows a review dialog
 * where the user can pick suggestions to add as tasks (and optionally tracking
 * issues), updating the AI log status accordingly.
 * @param {string} goals
 * @param {HTMLButtonElement|null} aiBtn
 * @returns {Promise<void>}
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

/**
 * Wires the AI action buttons: the suggest-tasks button (opens the goals modal,
 * then runs suggestions) and the team-summary button (generates and saves a
 * summary, handling expired sessions).
 * @returns {void}
 */
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

/**
 * Placeholder for logout wiring; logout is handled via document-level click
 * delegation (see bottom of file).
 * @returns {void}
 */
function wireLogout() {
  /* Log out is wired via document-level click delegation (see bottom of file). */
}

/**
 * Subscribes (once) to store events, re-rendering the relevant routes and
 * syncing the header when sprints change.
 * @returns {void}
 */
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
  stopLiveSync();
  await logout();
  window.location.hash = '';
  showLogin();
}, true);

wireMeetingModal();
wireMobileNavDocument();