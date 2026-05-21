import { BaseView } from './BaseView.js';
import { resolveIssueRemote } from '../services/dataSyncService.js';

/**
 * Issues list with team-wide data (when API mode) and filters for mine vs all.
 */
export class IssuesView extends BaseView {
  constructor(store) {
    super(store);
    /** @type {string} */
    this.filter = 'All';
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

  render() {
    const issues = this.getFilteredIssues();
    const modeNote = this.store.dataModeLabel || '';

    return `
            <div class="view-header issues-header">
                <div>
                    <h1 class="view-title">Issues &amp; Reports</h1>
                    <p class="view-subtitle">Team issues and blockers. ${modeNote}</p>
                </div>
            </div>

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
                            <span>Sprint ${issue.sprintId}</span>
                            <span>created ${issue.created}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
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

    container.querySelectorAll('.filter-chip').forEach((chip) => {
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
