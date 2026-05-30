/**
 * Issues, daily reports, and unified activity timeline.
 * @module views/IssuesView
 */

import { BaseView } from './BaseView.js';
import {
  resolveIssueRemote,
  updateAiLogRemote,
  updateIssueRemote,
  updateReportRemote,
  updateTaskRemote,
} from '../services/dataSyncService.js';
import { buildActivityTimeline } from '../utils/activityTimeline.js';
import { renderTabButton } from './renderers/issuesRenderer.js';
import { escapeHtml } from '../utils/templateEngine.js';

const ISSUE_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ISSUE_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'resolved', label: 'Done' },
];
const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low'];
const TASK_STATUSES = ['open', 'progress', 'blocked', 'resolved', 'done'];
const REPORT_STATUSES = ['Completed', 'In Progress', 'Blocked', 'Not Started'];
const REPORT_MOODS = ['Good', 'Neutral', 'Stressed'];
const AI_STATUSES = ['pending', 'approved', 'applied', 'rejected'];

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
  }

  /**
   * @returns {object[]}
   */
  getFilteredIssues() {
    const issues = this.store.getIssues();
    const me = this.store.currentAuthUser?.name;

    switch (this.filter) {
      case 'Created by Me':
        return issues.filter((i) => i.author === me);
      case 'Assigned to Me':
        return issues.filter((i) => i.assignee === me);
      case 'Open':
        return issues.filter((i) => i.status === 'open');
      case 'Resolved':
        return issues.filter((i) => i.status === 'resolved');
      case 'High Priority':
        return issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
      default:
        return issues;
    }
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
    const users = [{ value: '', label: 'Unassigned' }, ...this.store.getUsers().map((u) => ({
      value: u.name,
      label: `${u.name} — ${u.role}`,
    }))];
    return `
      <div class="card issue-card editable-card" data-edit-card data-kind="issue" data-id="${issue.id}" data-title="${escapeHtml(String(issue.title || '').toLowerCase())}">
        <div class="issue-card-header">
          <div class="issue-card-title-row">
            ${editableTitle('issue', issue.id, 'title', issue.title, 'Issue title')}
            ${editableSelect('issue', issue.id, 'severity', issue.severity || 'medium', 'Issue priority', ISSUE_SEVERITIES, 'inline-edit-select')}
            ${editableSelect('issue', issue.id, 'status', issue.status || 'open', 'Issue status', ISSUE_STATUSES, 'inline-edit-select')}
            ${this.getBadgeHTML(issue.status || 'open', (issue.status || 'open').toUpperCase())}
            ${(issue.tags || []).map((t) => `<span class="badge badge-muted">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="inline-card-actions">
            ${saveStatus('issue', issue.id)}
            ${issue.status !== 'resolved'
              ? `<button type="button" class="action-btn resolve-issue-btn" data-issue-id="${issue.id}">Mark resolved</button>`
              : ''}
          </div>
        </div>
        ${editableTextarea('issue', issue.id, 'description', issue.description || '', 'Issue description', 'inline-edit-description issue-description')}
        <div class="issue-meta inline-edit-grid">
          <span>By ${escapeHtml(issue.author || 'Team Member')}</span>
          <label>Assignee ${editableSelect('issue', issue.id, 'assignee', issue.assignee || '', 'Issue assignee', users, 'inline-edit-select')}</label>
          <label>Due ${editableInput('issue', issue.id, 'due', issue.due || issue.created || '', 'Issue due date', 'date', 'inline-edit-date')}</label>
          <span>Sprint ${escapeHtml(issue.sprintId ?? '—')}</span>
          <span>created ${escapeHtml(issue.created || '—')}</span>
        </div>
      </div>
    `;
  }

  /**
   * @param {object} task
   * @returns {string}
   */
  renderTaskCard(task) {
    const users = [{ value: '', label: 'Unassigned' }, ...this.store.getUsers().map((u) => ({
      value: u.name,
      label: `${u.name} — ${u.role}`,
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
          <span>Sprint ${escapeHtml(task.sprintId ?? '—')}</span>
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
            <h3 class="issue-title">${escapeHtml(userName)} — ${escapeHtml(report.date || '')}</h3>
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
      <div class="card issues-filters-card">
        <div class="search-box issues-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search issues..." id="issues-search-input">
        </div>
        <div class="filter-chips" id="issues-filter-chips">
          ${['All', 'Open', 'High Priority', 'Assigned to Me', 'Created by Me', 'Resolved'].map((tag) => `
            <button type="button" class="badge filter-chip ${tag === this.filter ? 'filter-chip-active' : ''}" data-filter="${tag}">${tag}</button>
          `).join('')}
        </div>
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
    const tabs = [
      { id: 'issues', label: 'Issues' },
      { id: 'tasks', label: 'Tasks' },
      { id: 'reports', label: 'Reports' },
      { id: 'activity', label: 'Activity' },
    ].map((t) => renderTabButton({ ...t, active: this.panel === t.id })).join('');

    return `
      <div class="view-header issues-header">
        <div>
          <h1 class="view-title">Issues &amp; Reports</h1>
          <p class="view-subtitle">Team issues, check-ins, and activity. ${modeNote}</p>
        </div>
      </div>
      <div class="filter-chips issues-tabs">${tabs}</div>
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
    const search = container.querySelector('#issues-search-input');
    if (savedSearch && search) {
      search.value = savedSearch;
      sessionStorage.removeItem('sitrep:search');
      const q = savedSearch.trim().toLowerCase();
      container.querySelectorAll('.issue-card').forEach((card) => {
        const title = card.dataset.title || '';
        card.style.display = !q || title.includes(q) ? '' : 'none';
      });
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

    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        container.querySelectorAll('.issue-card').forEach((card) => {
          const title = card.dataset.title || '';
          card.style.display = !q || title.includes(q) ? '' : 'none';
        });
      });
    }

    container.querySelectorAll('.resolve-issue-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.issueId);
        await resolveIssueRemote(this.store, id);
        container.innerHTML = this.render();
        this.mount(container);
      });
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
      if (kind === 'issue') await updateIssueRemote(this.store, numericId, patch);
      if (kind === 'task') await updateTaskRemote(this.store, numericId, patch);
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
