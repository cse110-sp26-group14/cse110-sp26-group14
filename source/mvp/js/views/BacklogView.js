/**
 * Backlog view — tasks with multi-assign, sub-tasks, live sync indicator.
 * @module views/BacklogView
 */

import { BaseView } from './BaseView.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class BacklogView extends BaseView {
  constructor(store) {
    super(store);
    this.filter = 'All';
    this.searchQuery = '';
  }

  /** Top-level tasks only (no sub-tasks). */
  _rootTasks() {
    return this.store.getState().tasks.filter(
      (t) => !t.parentTaskId && t.parentTaskId !== 0,
    );
  }

  /** Sub-tasks of a given parent id. */
  _subtasksOf(parentId) {
    return this.store.getState().tasks.filter(
      (t) => Number(t.parentTaskId) === Number(parentId),
    );
  }

  getFilteredTasks() {
    const activeId = this.store.getSelectedSprint()?.id;
    let tasks = this._rootTasks();

    switch (this.filter) {
      case 'High Priority':
        tasks = tasks.filter((t) => t.priority === 'critical' || t.priority === 'high');
        break;
      case 'Unassigned':
        tasks = tasks.filter((t) => !t.owner && !(t.assignees?.length));
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
      case 'Multi-Assigned':
        tasks = tasks.filter((t) => (t.assignees || []).length >= 2);
        break;
      case 'Has Sub-Tasks':
        tasks = tasks.filter((t) => this._subtasksOf(t.id).length > 0);
        break;
      case 'Needs Review':
        tasks = tasks.filter((t) => t.subtaskReviewStatus === 'pending');
        break;
      default:
        break;
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      tasks = tasks.filter(
        (t) =>
          t.title?.toLowerCase().includes(q)
          || (t.owner || '').toLowerCase().includes(q)
          || (t.assignees || []).join(' ').toLowerCase().includes(q),
      );
    }
    return tasks;
  }

  _assigneeBadges(task) {
    const assignees = task.assignees?.length ? task.assignees : (task.owner ? [task.owner] : []);
    if (!assignees.length) return '<span style="color:var(--text-muted);">—</span>';
    return assignees
      .map((a) => `<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:0.72rem;margin-right:0.2rem;">${esc(a)}</span>`)
      .join('');
  }

  render() {
    const tasks = this.getFilteredTasks();
    const filters = [
      'All', 'High Priority', 'Unassigned', 'This Sprint', 'Future Sprint',
      'AI Suggested', 'Blocked', 'Completed', 'Multi-Assigned', 'Has Sub-Tasks', 'Needs Review',
    ];
    const onlineUsers = this.store.getUsers().filter((u) => u.isOnline).map((u) => u.name);

    return `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 class="view-title">
            Backlog
            ${onlineUsers.length ? `<span style="font-size:0.8rem;color:var(--success);margin-left:0.75rem;">● ${onlineUsers.length} online: ${onlineUsers.join(', ')}</span>` : ''}
          </h1>
          <p class="view-subtitle">
            ${tasks.length} task${tasks.length !== 1 ? 's' : ''} shown · Live synced every 10s
          </p>
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
            <input type="text" id="backlog-search" placeholder="Search tasks…" value="${esc(this.searchQuery)}" />
          </div>
        </div>
        <div style="padding: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;" id="backlog-filters">
          ${filters.map((tag) => `
            <button type="button" class="badge backlog-filter-chip ${tag === this.filter ? 'filter-chip-active' : ''}" data-filter="${esc(tag)}"
              style="cursor:pointer;border:none;${tag === this.filter ? 'background:var(--primary);color:white;' : 'background:var(--primary-light);color:var(--primary);'}">
              ${esc(tag)}
            </button>
          `).join('')}
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th style="width:28px;"></th>
                <th>Task</th>
                <th>Assignees</th>
                <th>Sprint</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th style="width:100px;"></th>
              </tr>
            </thead>
            <tbody id="backlog-tbody">
              ${tasks.length === 0
                ? '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem;">No tasks match this filter.</td></tr>'
                : tasks.map((task) => this._taskRow(task)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  _taskRow(task) {
    const subs = this._subtasksOf(task.id);
    const hasSubs = subs.length > 0;
    const assignees = task.assignees?.length ? task.assignees : (task.owner ? [task.owner] : []);
    const needsReview = task.subtaskReviewStatus === 'pending';
    const doneCount = subs.filter((s) => s.status === 'resolved').length;

    return `
      <tr data-task-id="${task.id}">
        <td>
          ${hasSubs
            ? `<button type="button" class="action-btn backlog-toggle-sub" data-parent="${task.id}"
                style="padding:0.15rem 0.4rem;font-size:0.7rem;border:1px solid var(--border);"
                aria-expanded="false">▶</button>`
            : ''}
        </td>
        <td style="font-weight:500;">
          ${esc(task.title)}
          ${needsReview ? '<span class="badge badge-warning" style="margin-left:0.5rem;font-size:0.7rem;">Needs Review</span>' : ''}
          ${hasSubs ? `<span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.4rem;">(${doneCount}/${subs.length} done)</span>` : ''}
        </td>
        <td>${this._assigneeBadges(task)}</td>
        <td>Sprint ${esc(task.sprintId)}</td>
        <td>${this.getBadgeHTML(task.priority, (task.priority || '').toUpperCase())}</td>
        <td>${this.getBadgeHTML(task.status, (task.status || '').toUpperCase())}</td>
        <td style="color:var(--text-muted);">${esc(task.due || '—')}</td>
        <td style="text-align:right;white-space:nowrap;">
          ${assignees.length >= 2 && !hasSubs
            ? `<button type="button" class="action-btn backlog-split-btn" data-task-id="${task.id}"
                style="font-size:0.7rem;padding:0.2rem 0.5rem;margin-right:0.25rem;" title="Split into sub-tasks">⚡ Split</button>`
            : ''}
        </td>
      </tr>
      ${hasSubs ? subs.map((sub) => this._subtaskRow(sub, task.id)).join('') : ''}
    `;
  }

  _subtaskRow(sub, parentId) {
    const subAssignees = sub.assignees?.length ? sub.assignees : (sub.owner ? [sub.owner] : []);
    const done = sub.status === 'resolved';
    return `
      <tr class="backlog-subtask-row" data-subtask-parent="${parentId}" style="display:none;background:var(--bg-main);">
        <td></td>
        <td style="padding-left:2rem;font-size:0.875rem;color:var(--text-muted);">
          ↳ ${esc(sub.title)}
        </td>
        <td>
          ${subAssignees.map((a) => `<span class="badge" style="background:#f0fdf4;color:#15803d;font-size:0.7rem;">${esc(a)}</span>`).join('')}
        </td>
        <td colspan="3">${this.getBadgeHTML(sub.status, (sub.status || '').toUpperCase())}</td>
        <td style="color:var(--text-muted);font-size:0.8rem;">${esc(sub.due || '—')}</td>
        <td style="text-align:right;">
          ${done
            ? '<span style="font-size:0.75rem;color:var(--success);">✓ Done</span>'
            : `<button type="button" class="action-btn backlog-complete-sub" data-subtask-id="${sub.id}"
                style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--success-light);color:var(--success);">✓ Complete</button>`}
        </td>
      </tr>
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

    // Expand/collapse sub-tasks
    container.querySelectorAll('.backlog-toggle-sub').forEach((btn) => {
      btn.addEventListener('click', () => {
        const parentId = btn.dataset.parent;
        const rows = container.querySelectorAll(`.backlog-subtask-row[data-subtask-parent="${parentId}"]`);
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        rows.forEach((r) => { r.style.display = expanded ? 'none' : ''; });
        btn.textContent = expanded ? '▶' : '▼';
        btn.setAttribute('aria-expanded', String(!expanded));
      });
    });

    // Complete a sub-task
    container.querySelectorAll('.backlog-complete-sub').forEach((btn) => {
      btn.addEventListener('click', () => {
        const subtaskId = Number(btn.dataset.subtaskId);
        window.dispatchEvent(new CustomEvent('sitrep:complete-subtask', { detail: { subtaskId } }));
      });
    });

    // Split a task into sub-tasks
    container.querySelectorAll('.backlog-split-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = Number(btn.dataset.taskId);
        window.dispatchEvent(new CustomEvent('sitrep:split-task', { detail: { taskId } }));
      });
    });
  }
}
