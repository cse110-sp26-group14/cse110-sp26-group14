import { BaseView } from './BaseView.js';

export class BacklogView extends BaseView {
  constructor(store) {
    super(store);
    this.filter = 'All';
    this.searchQuery = '';
  }

  getFilteredTasks() {
    const activeId = this.store.getSelectedSprint()?.id;
    let tasks = [...this.store.getState().tasks];

    switch (this.filter) {
      case 'High Priority':
        tasks = tasks.filter((t) => t.priority === 'critical' || t.priority === 'high');
        break;
      case 'Unassigned':
        tasks = tasks.filter((t) => !t.owner);
        break;
      case 'This Sprint':
        tasks = tasks.filter((t) => t.sprintId === activeId);
        break;
      case 'Future Sprint':
        tasks = tasks.filter((t) => t.sprintId > activeId);
        break;
      case 'AI Suggested':
        tasks = tasks.filter((t) => (t.tags || []).includes('AI Suggested') || t.source === 'ai');
        break;
      case 'Blocked':
        tasks = tasks.filter((t) => t.status === 'blocked');
        break;
      case 'Completed':
        tasks = tasks.filter((t) => t.status === 'resolved' || t.status === 'done');
        break;
      default:
        break;
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      tasks = tasks.filter(
        (t) =>
          t.title?.toLowerCase().includes(q)
          || (t.owner || '').toLowerCase().includes(q),
      );
    }
    return tasks;
  }

  render() {
    const tasks = this.getFilteredTasks();
    const filters = ['All', 'High Priority', 'Unassigned', 'This Sprint', 'Future Sprint', 'AI Suggested', 'Blocked', 'Completed'];

    return `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 class="view-title">Backlog</h1>
          <p class="view-subtitle">All tasks across past, current, and upcoming sprints (${tasks.length} shown).</p>
        </div>
        <button type="button" class="primary-btn" id="backlog-add-task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>

      <div class="card" style="padding: 0;">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: center;">
          <div class="search-box" style="flex: 1; border: 1px solid var(--border);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="backlog-search" placeholder="Search tasks..." value="${this.searchQuery.replace(/"/g, '&quot;')}" />
          </div>
        </div>
        <div style="padding: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;" id="backlog-filters">
          ${filters.map((tag) => `
            <button type="button" class="badge backlog-filter-chip ${tag === this.filter ? 'filter-chip-active' : ''}" data-filter="${tag}" style="cursor: pointer; border: none; ${tag === this.filter ? 'background: var(--primary); color: white;' : 'background: var(--primary-light); color: var(--primary);'}">${tag}</button>
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
            ${tasks.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No tasks match this filter.</td></tr>' : ''}
            ${tasks.map((task) => `
              <tr>
                <td style="font-weight: 500;">${task.title}</td>
                <td>${task.owner || '—'}</td>
                <td>Sprint ${task.sprintId}</td>
                <td>${this.getBadgeHTML(task.priority, (task.priority || '').toUpperCase())}</td>
                <td>${this.getBadgeHTML(task.status, (task.status || '').toUpperCase())}</td>
                <td style="color: var(--text-muted);">${task.due || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  mount(container) {
    const rerender = () => {
      container.innerHTML = this.render();
      this.mount(container);
    };

    container.querySelector('#backlog-add-task')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('sitrep:open-task-modal'));
    });

    container.querySelector('#backlog-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      rerender();
    });

    container.querySelectorAll('.backlog-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.filter = chip.dataset.filter || 'All';
        rerender();
      });
    });
  }
}
