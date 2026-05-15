/**
 * sprint.js - Sprint Board View Component
 */
import { store } from '../store.js';

class ViewSprint extends HTMLElement {
    connectedCallback() {
        store.subscribe(() => this.render());
    }

    render() {
        this.innerHTML = `
            <div class="view-header flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h1 style="color: var(--accent);">Sprint Board</h1>
                    <p class="text-secondary">Manage and track tasks for the current sprint</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline"><i data-lucide="history"></i> History</button>
                    <button class="btn btn-primary" style="background: var(--status-progress);"><i data-lucide="share-2"></i> Share</button>
                    <button class="btn btn-outline"><i data-lucide="more-vertical"></i></button>
                </div>
            </div>

            <bento-card colspan="12" title="Sprint Progress" subtitle="68% Completed">
                <div class="flex items-center gap-4" style="margin-top: 1rem;">
                    <div style="flex: 1; height: 12px; background: #27272A; border-radius: 6px; overflow: hidden;">
                        <div style="width: 68%; height: 100%; background: var(--accent);"></div>
                    </div>
                    <div class="flex gap-8">
                        <div style="text-align: center;">
                            <div style="font-size: 0.625rem; color: var(--text-secondary);">DAYS LEFT</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #3B82F6;">04</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.625rem; color: var(--text-secondary);">VELOCITY</div>
                            <div style="font-size: 1.25rem; font-weight: 700;">42pts</div>
                        </div>
                        <div style="background: var(--bg-dark); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.5rem 1rem; display: flex; items-center gap-3;">
                            <i data-lucide="zap" style="color: var(--accent);"></i>
                            <div>
                                <div style="font-size: 0.625rem; color: var(--text-secondary);">HEALTH STATUS</div>
                                <div style="font-size: 0.75rem; font-weight: 700;">On Track</div>
                            </div>
                        </div>
                    </div>
                </div>
            </bento-card>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem; align-items: start;">
                ${this.renderColumn('TO DO', 5, [
                    { priority: 'High', title: 'Refactor authentication middleware for OAuth2', id: '#42', points: '8 pts' },
                    { priority: 'Medium', title: 'Update documentation for API v2 endpoints', id: '#43', points: '5 pts' }
                ])}
                ${this.renderColumn('IN PROGRESS', 3, [
                    { priority: 'High', title: 'Implementing Bento Grid layout for Analytics Dashboard', id: '#44', points: '13 pts' }
                ])}
                ${this.renderColumn('IN REVIEW', 2, [
                    { priority: 'Low', title: 'Fix: Z-index conflict on mobile navigation drawer', id: '#45', points: '3 pts' }
                ])}
                ${this.renderColumn('DONE', 12, [
                    { priority: 'Completed', title: 'Setup CI/CD pipeline for staging environment', id: '#41', points: '8 pts', done: true }
                ])}
            </div>

            <!-- Floating Action Button -->
            <button class="btn btn-primary" style="position: fixed; bottom: 2rem; right: 2rem; width: 48px; height: 48px; border-radius: 12px; padding: 0; justify-content: center; box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.4);">
                <i data-lucide="plus-circle" style="width: 24px;"></i>
            </button>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    renderColumn(title, count, tasks) {
        return `
            <div>
                <div class="flex items-center gap-2" style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.75rem; font-weight: 700;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${title === 'DONE' ? 'var(--status-done)' : title === 'IN PROGRESS' ? 'var(--status-progress)' : 'var(--text-muted)'};"></div>
                    ${title} <span style="background: var(--bg-card); padding: 0 6px; border-radius: 4px;">${count}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${tasks.map(task => `
                        <div class="card" style="padding: 1rem; border-color: ${task.done ? 'transparent' : 'var(--border)'}; opacity: ${task.done ? '0.6' : '1'};">
                            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.625rem; font-weight: 700; background: ${task.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)'}; color: ${task.priority === 'High' ? 'var(--status-blocked)' : 'var(--status-review)'}; padding: 2px 6px; border-radius: 4px;">${task.priority.toUpperCase()}</span>
                                <i data-lucide="link-2" style="width: 14px; color: var(--text-muted);"></i>
                            </div>
                            <div style="font-size: 0.875rem; font-weight: 500; margin-bottom: 1rem;">${task.title}</div>
                            <div class="flex justify-between items-center">
                                <div style="width: 24px; height: 24px; background: #27272A; border-radius: 50%; display: grid; place-items: center;"><i data-lucide="user" style="width: 12px;"></i></div>
                                <div style="font-size: 0.625rem; color: var(--text-secondary);">${task.id} • ${task.points}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

customElements.define('view-sprint', ViewSprint);
