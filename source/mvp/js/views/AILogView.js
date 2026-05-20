import { BaseView } from './BaseView.js';

export class AILogView extends BaseView {
    render() {
        const logs = this.store.getAiLogs();
        return `
            <div class="view-header">
                <h1 class="view-title">AI Log</h1>
                <p class="view-subtitle">Transparent record of every AI action.</p>
            </div>

            <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; align-items: center;">
                <div class="search-box" style="flex: 1; border: 1px solid var(--border);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search...">
                </div>
                <select class="dropdown-toggle"><option>All</option></select>
                <select class="dropdown-toggle"><option>All</option></select>
            </div>

            <div class="ai-log-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="log-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${logs.map(log => `
                        <div class="card" style="cursor: pointer; transition: border-color 0.2s;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="background: var(--primary-light); color: var(--primary); padding: 0.5rem; border-radius: 8px;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <h4 style="font-weight: 600;">${log.title}</h4>
                                        ${this.getBadgeHTML(log.status, log.status.toUpperCase())}
                                    </div>
                                    <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0.25rem 0;">${log.content}</p>
                                    <div style="font-size: 0.7rem; color: var(--text-light);">${log.timestamp.replace('T', ' ').substring(0, 19)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card" id="log-detail">
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">AI Summary Generated</h3>
                    ${this.getBadgeHTML('resolved', 'Approved')}
                    <div style="margin-top: 1.5rem;">
                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Timestamp</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">2026-05-13T09:30:30</div>
                        
                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Input Source</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">3 check-ins</div>

                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Output</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">Team mostly on track; 1 blocker on staging env.</div>

                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Reviewer</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">Maya Patel</div>
                    </div>
                </div>
            </div>
        `;
    }
}
