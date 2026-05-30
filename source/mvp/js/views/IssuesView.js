/**
 * Issues, daily reports, and unified activity timeline.
 * @module views/IssuesView
 */

import { BaseView } from './BaseView.js';
import {
  updateAiLogRemote,
  updateReportRemote,
  updateInlineTaskRemote,
} from '../services/dataSyncService.js';
import { buildActivityTimeline } from '../utils/activityTimeline.js';
import { renderTabButton } from './renderers/issuesRenderer.js';
import { escapeHtml } from '../utils/templateEngine.js';
import { todayISO } from '../utils/dates.js';

const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low'];
const TASK_STATUSES = ['open', 'progress', 'blocked', 'resolved', 'done'];
const REPORT_STATUSES = ['Completed', 'In Progress', 'Blocked', 'Not Started'];
const REPORT_MOODS = ['Good', 'Neutral', 'Stressed'];
const AI_STATUSES = ['pending', 'approved', 'applied', 'rejected'];
const ISSUE_FILTERS = ['All', 'Open', 'High Priority', 'Assigned to Me', 'Created by Me', 'Resolved'];

function editableAttrs(kind, id, field, value) {
  return `data-kind="${kind}" data-id="${id}" data-field="${field}" data-original="${escapeHtml(value ?? '')}"`;
}

function editableInput(kind, id, field, value, label, type = 'text', className = '') {
  return `<input class="inline-edit ${className}" type="${type}" value="${escapeHtml(value ?? '')}" aria-label="${escapeHtml(label)}" ${editableAttrs(kind, id, field, value)} />`;
}

function editableTextarea(kind, id, field, value, label, className = '') {
  return `<textarea class="inline-edit ${className}" aria-label="${escapeHtml(label)}" ${editableAttrs(kind, id, field, value)}>${escapeHtml(value ?? '')}</textarea>`;
}

function editableSelect(kind, id, field, value, label, options, className = '') {
  const current = String(value ?? '');
  return `
    <select class="inline-edit ${className}" aria-label="${escapeHtml(label)}" ${editableAttrs(kind, id, field, value)}>
      ${options.map((option) => {
    const optionValue = typeof option === 'string' ? option : option.value;
    const optionLabel = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHtml(optionValue)}" ${String(optionValue) === current ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`;
  }).join('')}
    </select>
  `;
}

function saveStatus(kind, id) {
  return `<span class="inline-save-status" data-save-status="${kind}:${id}" aria-live="polite"></span>`;
}

function editableTitle(kind, id, field, value, label, className = '') {
  return `
    <h3 class="issue-title inline-edit-title-wrap">
      <span class="sr-only">${escapeHtml(value ?? '')}</span>
      ${editableInput(kind, id, field, value, label, 'text', `inline-edit-title ${className}`)}
    </h3>
  `;
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function issueNumber(id) {
  return `ISS-${String(id ?? 0).padStart(4, '0')}`;
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

function formatIssueDate(value) {
  if (!value) return 'No date';
  const raw = String(value);
  const datePart = raw.slice(0, 10);
  const parsed = new Date(raw.includes('T') ? raw : `${datePart}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;

  const dateText = datePart === todayISO()
    ? 'Today'
    : parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const timeMatch = raw.match(/T(\d{2}):(\d{2})/);
  if (!timeMatch) return dateText;
  let hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${dateText}, ${hour}:${minute} ${suffix}`;
}

function resolvedDate(issue) {
  return issue.resolvedOn || issue.resolvedAt || issue.updatedAt || issue.due || issue.created || '';
}

function issueTone(issue) {
  if (issue.status === 'resolved') return 'resolved';
  if (issue.severity === 'critical') return 'critical';
  if (issue.severity === 'high') return 'high';
  if (issue.severity === 'medium') return 'medium';
  return 'low';
}

function isDueUrgent(issue) {
  if (issue.status === 'resolved' || !issue.due) return false;
  return String(issue.due).slice(0, 10) <= todayISO();
}

/**
 * @extends BaseView
 */
export class IssuesView extends BaseView {
  /**
   * @param {import('../core/store.js').Store} store
   */
  constructor(store) {
    super(store);
    /** @type {string} */
    this.filter = 'All';
    /** @type {'issues'|'tasks'|'reports'|'activity'} */
    this.panel = 'issues';
    /** @type {string} */
    this.searchQuery = '';
  }

  /**
   * @returns {object[]}
   */
  getFilteredIssues() {
    const me = this.store.currentAuthUser?.name;
    let issues = this.store.getIssues();

    switch (this.filter) {
      case 'Created by Me':
        issues = issues.filter((i) => i.author === me);
        break;
      case 'Assigned to Me':
        issues = issues.filter((i) => i.assignee === me);
        break;
      case 'Open':
        issues = issues.filter((i) => i.status === 'open');
        break;
      case 'Resolved':
        issues = issues.filter((i) => i.status === 'resolved');
        break;
      case 'High Priority':
        issues = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
        break;
      default:
        break;
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter((i) => [
      i.title,
      i.description,
      i.author,
      i.assignee,
      ...(i.tags || []),
    ].some((value) => String(value || '').toLowerCase().includes(q)));
  }

  /**
   * @returns {string}
   */
  renderReportsPanel() {
    const sprintId = this.store.getSelectedSprint()?.id;
    const reports = this.store.getReports()
      .filter((r) => sprintId == null || r.sprintId == null || Number(r.sprintId) === Number(sprintId))
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));

    if (!reports.length) {
      return '<p class="empty-hint">No check-in reports for this sprint yet.</p>';
    }

    return reports.map((r) => {
      const user = this.store.getUsers().find((u) => Number(u.id) === Number(r.userId));
      return this.renderReportCard(r, user?.name || 'Member');
    }).join('');
  }

  /**
   * @returns {string}
   */
  renderActivityPanel() {
    const items = buildActivityTimeline(this.store, this.store.getSelectedSprint()?.id);
    if (!items.length) {
      return '<p class="empty-hint">No activity yet.</p>';
    }
    return items.slice(0, 40).map((item) => this.renderActivityCard(item)).join('');
  }

  /**
   * @returns {string}
   */
  renderTasksPanel() {
    const sprintId = this.store.getSelectedSprint()?.id;
    const tasks = this.store.getState().tasks
      .filter((t) => sprintId == null || Number(t.sprintId) === Number(sprintId))
      .sort((a, b) => (a.due || '').localeCompare(b.due || '') || a.title.localeCompare(b.title));

    if (!tasks.length) {
      return '<p class="empty-hint">No sprint tasks yet. Add tasks from Backlog or accept AI suggestions.</p>';
    }

    return `<div class="issues-list">${tasks.map((t) => this.renderTaskCard(t)).join('')}</div>`;
  }

  /**
   * @param {object} issue
   * @returns {string}
   */
  renderIssueCard(issue) {
    const tone = issueTone(issue);
    const assignee = issue.assignee || 'Unassigned';
    const primaryBadge = issue.status === 'resolved' ? 'RESOLVED' : (issue.severity || 'medium').toUpperCase();
    const dateLabel = issue.status === 'resolved' ? 'Resolved On' : 'Due Date';
    const dateValue = issue.status === 'resolved' ? resolvedDate(issue) : (issue.due || issue.created || '');
    const extraBadges = issue.status === 'resolved'
      ? [titleCase(issue.severity || 'medium'), ...(issue.tags || [])]
      : (issue.tags || []);

    return `
      <article class="issue-card issue-list-card issue-list-card-${tone}" data-title="${escapeHtml(String(issue.title || '').toLowerCase())}">
        <div class="issue-card-content">
          <div class="issue-card-main">
            <div class="issue-card-metadata">
              <span class="issue-priority-badge issue-priority-badge-${tone}">${escapeHtml(primaryBadge)}</span>
              ${extraBadges.map((tag) => `<span class="issue-tag-badge">${escapeHtml(tag)}</span>`).join('')}
              <span class="issue-id">${escapeHtml(issueNumber(issue.id))}</span>
            </div>
            <h3 class="issue-display-title ${issue.status === 'resolved' ? 'issue-display-title-resolved' : ''}">${escapeHtml(issue.title || 'Untitled issue')}</h3>
            <p class="issue-display-description">${escapeHtml(issue.description || 'No description provided.')}</p>
          </div>

          <div class="issue-card-side">
            <div class="issue-side-column issue-assignee-column">
              <span class="issue-side-label">Assignee</span>
              <div class="issue-assignee">
                <span class="issue-avatar" aria-hidden="true">${escapeHtml(initials(assignee))}</span>
                <span class="issue-assignee-name">${escapeHtml(assignee)}</span>
              </div>
            </div>
            <div class="issue-side-column issue-date-column">
              <span class="issue-side-label">${dateLabel}</span>
              <span class="issue-date-value ${isDueUrgent(issue) ? 'issue-date-urgent' : ''}">${escapeHtml(formatIssueDate(dateValue))}</span>
            </div>
            <span class="issue-chevron" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * @param {object} task
   * @returns {string}
   */
  renderTaskCard(task) {
    const users = [{ value: '', label: 'Unassigned' }, ...this.store.getUsers().map((u) => ({
      value: u.name,
      label: `${u.name} - ${u.role}`,
    }))];
    const aiTag = (task.tags || []).includes('AI Suggested') || task.source === 'ai'
      ? '<span class="badge badge-muted">AI Suggested</span>'
      : '';
    return `
      <div class="card issue-card task-card editable-card" data-edit-card data-kind="task" data-id="${task.id}">
        <div class="issue-card-header">
          <div class="issue-card-title-row">
            ${editableTitle('task', task.id, 'title', task.title, 'Task title')}
            ${editableSelect('task', task.id, 'priority', task.priority || 'medium', 'Task priority', TASK_PRIORITIES, 'inline-edit-select')}
            ${editableSelect('task', task.id, 'status', task.status || 'open', 'Task status', TASK_STATUSES, 'inline-edit-select')}
            ${aiTag}
          </div>
          ${saveStatus('task', task.id)}
        </div>
        <div class="issue-meta inline-edit-grid">
          <label>Owner ${editableSelect('task', task.id, 'owner', task.owner || '', 'Task owner', users, 'inline-edit-select')}</label>
          <span>Sprint ${escapeHtml(task.sprintId ?? '-')}</span>
          <label>Due ${editableInput('task', task.id, 'due', task.due || '', 'Task due date', 'date', 'inline-edit-date')}</label>
        </div>
      </div>
    `;
  }

  /**
   * @param {object} report
   * @param {string} userName
   * @returns {string}
   */
  renderReportCard(report, userName) {
    return `
      <div class="card issue-card report-card editable-card" data-edit-card data-kind="report" data-id="${report.id}">
        <div class="issue-card-header">
          <div class="issue-card-title-row">
            <h3 class="issue-title">${escapeHtml(userName)} - ${escapeHtml(report.date || '')}</h3>
            ${editableSelect('report', report.id, 'status', report.status || 'In Progress', 'Report status', REPORT_STATUSES, 'inline-edit-select')}
            ${editableSelect('report', report.id, 'mood', report.mood || 'Neutral', 'Report mood', REPORT_MOODS, 'inline-edit-select')}
          </div>
          ${saveStatus('report', report.id)}
        </div>
        ${editableTextarea('report', report.id, 'progress', report.progress || '', 'Report progress', 'inline-edit-description issue-description')}
        <div class="inline-edit-grid issue-meta">
          <label>Blockers ${editableInput('report', report.id, 'blockers', report.blockers || 'None', 'Report blockers', 'text')}</label>
          <label>Notes ${editableTextarea('report', report.id, 'notes', report.notes || '', 'Report notes', 'inline-edit-small-textarea')}</label>
        </div>
      </div>
    `;
  }

  /**
   * @param {object} log
   * @param {object} item
   * @returns {string}
   */
  renderAiActivityCard(log, item) {
    return `
      <div class="card activity-card editable-card" data-edit-card data-kind="ai" data-id="${log.id}">
        <div class="activity-card-top">
          <span class="badge badge-muted">ai</span>
          <span class="activity-card-time">${escapeHtml((item.ts || '').replace('T', ' ').slice(0, 16))}</span>
          ${saveStatus('ai', log.id)}
        </div>
        ${editableInput('ai', log.id, 'title', log.title || '', 'AI log title', 'text', 'inline-edit-title activity-card-title')}
        ${editableTextarea('ai', log.id, 'content', log.content || '', 'AI log content', 'inline-edit-description activity-card-body')}
        <div class="issue-meta inline-edit-grid">
          <label>Status ${editableSelect('ai', log.id, 'status', log.status || 'pending', 'AI log status', AI_STATUSES, 'inline-edit-select')}</label>
          <span>${escapeHtml(log.type || 'Log')}</span>
        </div>
      </div>
    `;
  }

  /**
   * @param {object} item
   * @returns {string}
   */
  renderActivityCard(item) {
    if (item.sourceKind === 'issue') {
      const issue = this.store.getIssues().find((i) => Number(i.id) === Number(item.sourceId));
      return issue ? this.renderIssueCard(issue) : '';
    }
    if (item.sourceKind === 'task') {
      const task = this.store.getState().tasks.find((t) => Number(t.id) === Number(item.sourceId));
      return task ? this.renderTaskCard(task) : '';
    }
    if (item.sourceKind === 'report') {
      const report = this.store.getReports().find((r) => Number(r.id) === Number(item.sourceId));
      const user = this.store.getUsers().find((u) => Number(u.id) === Number(report?.userId));
      return report ? this.renderReportCard(report, user?.name || 'Member') : '';
    }
    if (item.sourceKind === 'ai') {
      const log = this.store.getAiLogs().find((l) => Number(l.id) === Number(item.sourceId));
      return log ? this.renderAiActivityCard(log, item) : '';
    }
    return '';
  }

  /**
   * @returns {string}
   */
  renderIssuesPanel() {
    const issues = this.getFilteredIssues();
    return `
      <div class="issues-filter-row" id="issues-filter-chips">
        ${ISSUE_FILTERS.map((tag) => `
          <button type="button" class="issues-filter-chip filter-chip ${tag === this.filter ? 'filter-chip-active' : ''}" data-filter="${tag}">${tag}</button>
        `).join('')}
      </div>
      <div class="issues-list">
        ${issues.length === 0 ? '<p class="empty-hint">No issues match this filter.</p>' : ''}
        ${issues.map((issue) => this.renderIssueCard(issue)).join('')}
      </div>
    `;
  }

  /**
   * @returns {string}
   */
  render() {
    const modeNote = this.store.dataModeLabel || '';
    const activeIssues = this.store.getIssues().filter((issue) => issue.status !== 'resolved').length;
    const tabs = [
      { id: 'issues', label: 'Issues' },
      { id: 'tasks', label: 'Tasks' },
      { id: 'reports', label: 'Reports' },
      { id: 'activity', label: 'Activity' },
    ].map((t) => renderTabButton({ ...t, active: this.panel === t.id })).join('');

    return `
      <div class="view-header issues-header">
        <div>
          <div class="issues-title-row">
            <h1 class="view-title issues-page-title">Issues &amp; Reports</h1>
            <span class="issues-active-count"><strong>${activeIssues}</strong> Active</span>
          </div>
          <p class="view-subtitle">Team issues, check-ins, and activity. ${modeNote}</p>
        </div>
        <div class="issues-header-actions">
          <button type="button" class="issues-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Export
          </button>
          <button type="button" class="issues-create-btn" id="issues-create-issue">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create Issue
          </button>
        </div>
      </div>
      <div class="issues-tabs">${tabs}</div>
      ${this.panel === 'issues' ? this.renderIssuesPanel() : ''}
      ${this.panel === 'tasks' ? this.renderTasksPanel() : ''}
      ${this.panel === 'reports' ? `<div class="reports-list">${this.renderReportsPanel()}</div>` : ''}
      ${this.panel === 'activity' ? `<div class="activity-list">${this.renderActivityPanel()}</div>` : ''}
    `;
  }

  /**
   * @param {HTMLElement} container
   */
  mount(container) {
    const savedFilter = sessionStorage.getItem('sitrep:issues-filter');
    if (savedFilter) {
      this.filter = savedFilter;
      sessionStorage.removeItem('sitrep:issues-filter');
      container.innerHTML = this.render();
    }

    const savedSearch = sessionStorage.getItem('sitrep:search');
    if (savedSearch) {
      this.searchQuery = savedSearch;
      sessionStorage.removeItem('sitrep:search');
      container.innerHTML = this.render();
      this.mount(container);
      return;
    }

    container.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.panel = btn.dataset.panel || 'issues';
        container.innerHTML = this.render();
        this.mount(container);
      });
    });

    container.querySelectorAll('.filter-chip[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.filter = chip.dataset.filter || 'All';
        container.innerHTML = this.render();
        this.mount(container);
      });
    });

    container.querySelector('#issues-create-issue')?.addEventListener('click', () => {
      document.getElementById('btn-create-issue')?.click();
    });

    container.querySelectorAll('.inline-edit').forEach((field) => {
      const eventName = field.matches('select, input[type="date"]') ? 'change' : 'blur';
      field.addEventListener(eventName, () => this.saveInlineEdit(field, container));
    });
  }

  /**
   * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field
   * @param {HTMLElement} container
   */
  async saveInlineEdit(field, container) {
    const { kind, id, field: fieldName } = field.dataset;
    if (!kind || !id || !fieldName) return;
    const value = field.value.trim();
    if (value === (field.dataset.original || '')) return;

    const card = field.closest('[data-edit-card]');
    const status = card?.querySelector(`[data-save-status="${kind}:${id}"]`);
    if (status) {
      status.textContent = 'Saving...';
      status.classList.remove('inline-save-error');
    }

    try {
      const patch = { [fieldName]: value };
      const numericId = Number(id);
      if (kind === 'task') await updateInlineTaskRemote(this.store, numericId, patch);
      if (kind === 'report') await updateReportRemote(this.store, numericId, patch);
      if (kind === 'ai') await updateAiLogRemote(this.store, numericId, patch);
      field.dataset.original = value;
      const freshStatus = container.querySelector(`[data-save-status="${kind}:${id}"]`);
      if (freshStatus) {
        freshStatus.textContent = 'Saved';
        window.setTimeout(() => {
          const laterStatus = container.querySelector(`[data-save-status="${kind}:${id}"]`);
          if (laterStatus?.textContent === 'Saved') laterStatus.textContent = '';
        }, 1600);
      }
    } catch (err) {
      if (status) {
        status.textContent = 'Could not save';
        status.classList.add('inline-save-error');
      }
      field.value = field.dataset.original || '';
      console.error('[IssuesView] Inline edit failed', err);
    }
  }
}
