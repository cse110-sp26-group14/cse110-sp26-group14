/**
 * Issues, daily reports, and unified activity timeline.
 * @module views/IssuesView
 */

import { BaseView } from './BaseView.js';
import { resolveIssueRemote } from '../services/dataSyncService.js';
import { buildActivityTimeline } from '../utils/activityTimeline.js';
import { renderActivityCard, renderReportCard, renderTabButton, renderTaskCard } from './renderers/issuesRenderer.js';

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
      return renderReportCard(r, user?.name || 'Member', (type, label) => this.getBadgeHTML(type, label));
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
    return items.slice(0, 40).map(renderActivityCard).join('');
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

    return `<div class="issues-list">${tasks.map((t) => renderTaskCard(t, (type, label) => this.getBadgeHTML(type, label))).join('')}</div>`;
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
        ${issues.map((issue) => `
          <div class="card issue-card" data-title="${issue.title.toLowerCase()}">
            <div class="issue-card-header">
              <div class="issue-card-title-row">
                <h3 class="issue-title">${issue.title}</h3>
                ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                ${this.getBadgeHTML(issue.status, issue.status.toUpperCase())}
                ${(issue.tags || []).map((t) => `<span class="badge badge-muted">${t}</span>`).join('')}
              </div>
              ${issue.status !== 'resolved'
                ? `<button type="button" class="action-btn resolve-issue-btn" data-issue-id="${issue.id}">Mark resolved</button>`
                : ''}
            </div>
            <p class="issue-description">${issue.description || ''}</p>
            <div class="issue-meta">
              <span>By ${issue.author}</span>
              <span>Assignee ${issue.assignee || 'Unassigned'}</span>
              <span>Due ${issue.due || issue.created || '—'}</span>
              <span>Sprint ${issue.sprintId}</span>
              <span>created ${issue.created}</span>
            </div>
          </div>
        `).join('')}
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
  }
}
