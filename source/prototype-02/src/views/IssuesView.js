import { BaseView } from './BaseView.js';

export class IssuesView extends BaseView {
    render() {
        const issues = this.store.getIssues();
        return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Issues & Reports</h1>
                    <p class="view-subtitle">Bugs, blockers, and process issues.</p>
                </div>
                <button class="primary-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create Issue / Report</button>
            </div>

            <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
                <div class="search-box" style="width: 100%; border: 1px solid var(--border); margin-bottom: 1rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search issues...">
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${['All', 'Open', 'In Progress', 'Blocked', 'High Priority', 'Assigned to Me', 'Created by Me', 'Resolved'].map(tag => `
                        <span class="badge" style="background: ${tag === 'All' ? 'var(--primary)' : 'var(--primary-light)'}; color: ${tag === 'All' ? 'white' : 'var(--primary)'}; cursor: pointer;">${tag}</span>
                    `).join('')}
                </div>
            </div>

            <div class="issues-list" style="display: flex; flex-direction: column; gap: 1rem;">
                ${issues.map(issue => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <h3 style="font-size: 1.125rem; font-weight: 600;">${issue.title}</h3>
                                ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                                ${this.getBadgeHTML(issue.status, issue.status.toUpperCase())}
                                ${issue.tags.map(t => `<span class="badge" style="background: #f3f4f6; color: #6b7280;">${t}</span>`).join('')}
                            </div>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">${issue.description}</p>
                        <div style="display: flex; gap: 1.5rem; font-size: 0.75rem; color: var(--text-light);">
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
}
