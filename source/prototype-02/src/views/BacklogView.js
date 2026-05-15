import { BaseView } from './BaseView.js';

export class BacklogView extends BaseView {
    render() {
        const tasks = this.store.getState().tasks;
        return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Backlog</h1>
                    <p class="view-subtitle">All tasks across past, current, and upcoming sprints.</p>
                </div>
                <button class="primary-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task</button>
            </div>

            <div class="card" style="padding: 0;">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: center;">
                    <div class="search-box" style="flex: 1; border: 1px solid var(--border);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Search tasks...">
                    </div>
                    <select class="dropdown-toggle">
                        <option>Sort: Priority</option>
                    </select>
                </div>
                <div style="padding: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${['All', 'High Priority', 'Unassigned', 'This Sprint', 'Future Sprint', 'AI Suggested', 'Blocked', 'Completed'].map(tag => `
                        <span class="badge" style="background: ${tag === 'All' ? 'var(--primary)' : 'var(--primary-light)'}; color: ${tag === 'All' ? 'white' : 'var(--primary)'}; cursor: pointer;">${tag}</span>
                    `).join('')}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Owner</th>
                            <th>Sprint</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map(task => `
                            <tr>
                                <td style="font-weight: 500;">${task.title}</td>
                                <td>${task.owner || '—'}</td>
                                <td>Sprint ${task.sprintId}</td>
                                <td>${this.getBadgeHTML(task.priority, task.priority.toUpperCase())}</td>
                                <td>${this.getBadgeHTML(task.status, task.status.toUpperCase())}</td>
                                <td style="color: var(--text-muted);">${task.due || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}
