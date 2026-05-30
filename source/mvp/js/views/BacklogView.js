/**
 * Backlog view — redesigned UI with avatar assignees, pagination, and new filters.
 * @module views/BacklogView
 */

import { BaseView } from './BaseView.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || '?')[0].toUpperCase();
}

function avatarColor(name) {
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[hash % palette.length];
}

function avatarHTML(name, size = 28) {
  const bg = avatarColor(name);
  return `<span style="
    display:inline-flex;align-items:center;justify-content:center;
    width:${size}px;height:${size}px;border-radius:50%;
    background:${bg};color:#fff;font-size:${Math.round(size * 0.38)}px;
    font-weight:600;flex-shrink:0;border:2px solid #fff;
  " title="${esc(name)}">${esc(initials(name))}</span>`;
}

export class BacklogView extends BaseView {
  constructor(store) {
    super(store);
    this.filter = 'All';
    this.searchQuery = '';
    this.sprintFilter = '';
    this.statusFilter = '';
    this.page = 1;
    this.pageSize = 7;
  }

  _rootTasks() {
    return this.store.getState().tasks.filter(
      (t) => !t.parentTaskId && t.parentTaskId !== 0,
    );
  }

  _subtasksOf(parentId) {
    return this.store.getState().tasks.filter(
      (t) => Number(t.parentTaskId) === Number(parentId),
    );
  }

  getFilteredTasks() {
    const activeId = this.store.getSelectedSprint()?.id;
    const me = this.store.currentAuthUser?.name;
    let tasks = this._rootTasks();

    switch (this.filter) {
      case 'My Tasks':
        tasks = tasks.filter((t) =>
          (t.assignees || []).includes(me) || t.owner === me,
        );
        break;
      case 'High Priority':
        tasks = tasks.filter((t) => t.priority === 'critical' || t.priority === 'high');
        break;
      case 'Blocked':
        tasks = tasks.filter((t) => t.status === 'blocked');
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

    if (this.sprintFilter) {
      tasks = tasks.filter((t) => String(t.sprintId) === String(this.sprintFilter));
    }

    if (this.statusFilter) {
      tasks = tasks.filter((t) => t.status === this.statusFilter);
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

  _priorityBadge(priority) {
    const map = {
      critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
      high:     { bg: '#fef9c3', color: '#ca8a04', label: 'High' },
      medium:   { bg: '#dbeafe', color: '#2563eb', label: 'Medium' },
      low:      { bg: '#f3f4f6', color: '#6b7280', label: 'Low' },
    };
    const s = map[priority] || { bg: '#f3f4f6', color: '#6b7280', label: priority || '—' };
    return `<span style="
      display:inline-flex;align-items:center;gap:0.3rem;
      background:${s.bg};color:${s.color};
      font-size:0.75rem;font-weight:600;padding:0.2rem 0.6rem;
      border-radius:999px;white-space:nowrap;
    ">${s.label}</span>`;
  }

  _statusBadge(status) {
    const map = {
      blocked:  { bg: '#fee2e2', color: '#dc2626', label: 'Blocked' },
      progress: { bg: '#ede9fe', color: '#7c3aed', label: 'In Progress' },
      open:     { bg: '#f3f4f6', color: '#374151', label: 'Open' },
      resolved: { bg: '#dcfce7', color: '#15803d', label: 'Resolved' },
      done:     { bg: '#dcfce7', color: '#15803d', label: 'Done' },
      pending:  { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
    };
    const s = map[status] || { bg: '#f3f4f6', color: '#374151', label: status || '—' };
    return `<span style="
      background:${s.bg};color:${s.color};
      font-size:0.75rem;font-weight:600;padding:0.2rem 0.65rem;
      border-radius:6px;white-space:nowrap;
    ">${s.label}</span>`;
  }

  _assigneeCell(task) {
    const assignees = task.assignees?.length ? task.assignees : (task.owner ? [task.owner] : []);
    if (!assignees.length) return '<span style="color:var(--text-muted);">—</span>';
    const primary = assignees[0];
    const extra = assignees.length - 1;
    return `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        ${avatarHTML(primary)}
        <span style="font-size:0.875rem;font-weight:500;">${esc(primary)}</span>
        ${extra > 0 ? `<span style="font-size:0.75rem;color:var(--text-muted);">+${extra}</span>` : ''}
      </div>`;
  }

  render() {
    const allFiltered = this.getFilteredTasks().slice().reverse();
    const total = allFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.page > totalPages) this.page = totalPages;
    const start = (this.page - 1) * this.pageSize;
    const tasks = allFiltered.slice(start, start + this.pageSize);

    const onlineUsers = this.store.getUsers().filter((u) => u.isOnline);
    const sprints = this.store.getState().sprints || [];
    const statuses = ['open', 'progress', 'blocked', 'resolved'];

    const chipFilters = ['All', 'My Tasks', 'High Priority', 'Blocked'];

    const onlineAvatars = onlineUsers.slice(0, 4).map((u) => avatarHTML(u.name, 26)).join('');
    const extraOnline = onlineUsers.length > 4 ? `<span style="font-size:0.75rem;color:var(--text-muted);">+${onlineUsers.length - 4}</span>` : '';

    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">
        <div>
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
            <h1 class="view-title" style="font-size:1.75rem;font-weight:700;margin:0;">Backlog</h1>
            ${onlineUsers.length ? `
              <span style="display:inline-flex;align-items:center;gap:0.3rem;background:#dcfce7;color:#15803d;
                font-size:0.78rem;font-weight:600;padding:0.2rem 0.65rem;border-radius:999px;">
                ● ${onlineUsers.length} online
              </span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.4rem;flex-wrap:wrap;">
            <span style="font-size:0.85rem;color:var(--text-muted);">${total} task${total !== 1 ? 's' : ''} shown · Live synced every 10s</span>
            ${onlineUsers.length ? `<div style="display:flex;align-items:center;gap:2px;">${onlineAvatars}${extraOnline}</div>` : ''}
          </div>
        </div>
        <button type="button" id="backlog-add-task" style="
          display:inline-flex;align-items:center;gap:0.4rem;
          background:#4f46e5;color:#fff;border:none;cursor:pointer;
          padding:0.6rem 1.2rem;border-radius:8px;font-size:0.9rem;font-weight:600;
          white-space:nowrap;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Task
        </button>
      </div>

      <div class="card" style="padding:0;border-radius:12px;overflow:hidden;">

        <!-- Search + Filters -->
        <div style="padding:1rem 1.25rem;display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--border);">
          <!-- Search -->
          <div style="display:flex;align-items:center;gap:0.5rem;border:1px solid var(--border);border-radius:8px;padding:0.45rem 0.75rem;flex:1;min-width:200px;background:#fff;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="backlog-search" placeholder="Search tasks..." value="${esc(this.searchQuery)}"
              style="border:none;outline:none;font-size:0.875rem;width:100%;background:transparent;" />
          </div>

          <!-- Chip filters -->
          ${chipFilters.map((f) => `
            <button type="button" class="backlog-filter-chip" data-filter="${esc(f)}" style="
              border:none;cursor:pointer;padding:0.4rem 0.9rem;border-radius:999px;
              font-size:0.82rem;font-weight:500;white-space:nowrap;
              ${f === this.filter
                ? 'background:#4f46e5;color:#fff;'
                : 'background:#f3f4f6;color:#374151;'}
            ">${esc(f)}</button>
          `).join('')}

          <!-- Sprint dropdown -->
          <select id="backlog-sprint-filter" style="
            border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;
            font-size:0.82rem;color:#374151;background:#fff;cursor:pointer;outline:none;
          ">
            <option value="">Sprint</option>
            ${sprints.map((s) => `<option value="${s.id}" ${String(this.sprintFilter) === String(s.id) ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
          </select>

          <!-- Status dropdown -->
          <select id="backlog-status-filter" style="
            border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;
            font-size:0.82rem;color:#374151;background:#fff;cursor:pointer;outline:none;
          ">
            <option value="">Status</option>
            ${statuses.map((s) => `<option value="${s}" ${this.statusFilter === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </div>

        <!-- Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;border-bottom:1px solid var(--border);">
                <th style="width:32px;padding:0.75rem 0.5rem;"></th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Task</th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Assignee</th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Sprint</th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Priority</th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
                <th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Due Date</th>
              </tr>
            </thead>
            <tbody id="backlog-tbody">
              ${tasks.length === 0
                ? `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:3rem;">No tasks match this filter.</td></tr>`
                : tasks.map((task) => this._taskRow(task)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.875rem 1.25rem;border-top:1px solid var(--border);">
          <span style="font-size:0.82rem;color:#6b7280;">
            Showing ${total === 0 ? 0 : start + 1} to ${Math.min(start + this.pageSize, total)} of ${total} result${total !== 1 ? 's' : ''}
          </span>
          <div style="display:flex;gap:0.5rem;">
            <button type="button" id="backlog-prev" ${this.page <= 1 ? 'disabled' : ''} style="
              padding:0.35rem 0.85rem;border-radius:6px;border:1px solid var(--border);
              background:#fff;font-size:0.82rem;cursor:${this.page <= 1 ? 'default' : 'pointer'};
              color:${this.page <= 1 ? '#d1d5db' : '#374151'};
            ">Previous</button>
            <button type="button" id="backlog-next" ${this.page >= totalPages ? 'disabled' : ''} style="
              padding:0.35rem 0.85rem;border-radius:6px;border:1px solid var(--border);
              background:#fff;font-size:0.82rem;cursor:${this.page >= totalPages ? 'default' : 'pointer'};
              color:${this.page >= totalPages ? '#d1d5db' : '#374151'};
            ">Next</button>
          </div>
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
    const sprintName = this.store.getState().sprints?.find((s) => s.id === task.sprintId)?.name || `Sprint ${task.sprintId}`;

    return `
      <tr data-task-id="${task.id}" style="border-bottom:1px solid #f3f4f6;" class="backlog-task-row">
        <td style="padding:0.875rem 0.5rem;color:#d1d5db;text-align:center;font-size:1rem;">
          ${hasSubs
            ? `<button type="button" class="backlog-toggle-sub" data-parent="${task.id}" aria-expanded="false"
                style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:0.8rem;padding:0.1rem 0.3rem;">▶</button>`
            : '⠿'}
        </td>
        <td style="padding:0.875rem 1rem;">
          <span style="font-size:0.9rem;font-weight:500;color:#111827;">${esc(task.title)}</span>
          ${needsReview ? '<span style="margin-left:0.5rem;background:#fef3c7;color:#b45309;font-size:0.7rem;font-weight:600;padding:0.1rem 0.4rem;border-radius:4px;">Needs Review</span>' : ''}
          ${hasSubs ? `<span style="font-size:0.72rem;color:#9ca3af;margin-left:0.4rem;">(${doneCount}/${subs.length} done)</span>` : ''}
          ${assignees.length >= 2 && !hasSubs
            ? `<button type="button" class="backlog-split-btn" data-task-id="${task.id}"
                style="margin-left:0.5rem;font-size:0.7rem;padding:0.1rem 0.4rem;background:#ede9fe;color:#7c3aed;border:none;border-radius:4px;cursor:pointer;">⚡ Split</button>`
            : ''}
        </td>
        <td style="padding:0.875rem 1rem;">${this._assigneeCell(task)}</td>
        <td style="padding:0.875rem 1rem;font-size:0.875rem;color:#6b7280;">${esc(sprintName)}</td>
        <td style="padding:0.875rem 1rem;">${this._priorityBadge(task.priority)}</td>
        <td style="padding:0.875rem 1rem;">${this._statusBadge(task.status)}</td>
        <td style="padding:0.875rem 1rem;font-size:0.875rem;color:#6b7280;">${esc(task.due || '—')}</td>
      </tr>
      ${hasSubs ? subs.map((sub) => this._subtaskRow(sub, task.id)).join('') : ''}
    `;
  }

  _subtaskRow(sub, parentId) {
    const subAssignees = sub.assignees?.length ? sub.assignees : (sub.owner ? [sub.owner] : []);
    const done = sub.status === 'resolved';
    return `
      <tr class="backlog-subtask-row" data-subtask-parent="${parentId}"
        style="display:none;background:#fafafa;border-bottom:1px solid #f3f4f6;">
        <td style="padding:0.6rem 0.5rem;"></td>
        <td style="padding:0.6rem 1rem;padding-left:2.5rem;font-size:0.85rem;color:#6b7280;">
          ↳ ${esc(sub.title)}
        </td>
        <td style="padding:0.6rem 1rem;">
          <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
            ${subAssignees.map((a) => `<div style="display:flex;align-items:center;gap:0.3rem;">${avatarHTML(a, 22)}<span style="font-size:0.8rem;">${esc(a)}</span></div>`).join('')}
          </div>
        </td>
        <td colspan="2" style="padding:0.6rem 1rem;">${this._statusBadge(sub.status)}</td>
        <td style="padding:0.6rem 1rem;font-size:0.8rem;color:#9ca3af;">${esc(sub.due || '—')}</td>
        <td style="padding:0.6rem 1rem;text-align:right;">
          ${done
            ? '<span style="font-size:0.75rem;color:#15803d;font-weight:500;">✓ Done</span>'
            : `<button type="button" class="backlog-complete-sub" data-subtask-id="${sub.id}"
                style="font-size:0.75rem;padding:0.2rem 0.6rem;background:#dcfce7;color:#15803d;border:none;border-radius:6px;cursor:pointer;font-weight:500;">✓ Complete</button>`}
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
      this.page = 1;
      rerender();
    });

    container.querySelectorAll('.backlog-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.filter = chip.dataset.filter || 'All';
        this.page = 1;
        rerender();
      });
    });

    container.querySelector('#backlog-sprint-filter')?.addEventListener('change', (e) => {
      this.sprintFilter = e.target.value;
      this.page = 1;
      rerender();
    });

    container.querySelector('#backlog-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.page = 1;
      rerender();
    });

    container.querySelector('#backlog-prev')?.addEventListener('click', () => {
      if (this.page > 1) { this.page--; rerender(); }
    });

    container.querySelector('#backlog-next')?.addEventListener('click', () => {
      const total = this.getFilteredTasks().length;
      if (this.page < Math.ceil(total / this.pageSize)) { this.page++; rerender(); }
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

    // Row hover effect + click to open task detail
    container.querySelectorAll('.backlog-task-row').forEach((row) => {
      row.addEventListener('mouseenter', () => { row.style.background = '#f9fafb'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });
      row.addEventListener('click', (e) => {
        // Don't open if clicking a button inside the row
        if (e.target.closest('button')) return;
        const taskId = Number(row.dataset.taskId);
        window.dispatchEvent(new CustomEvent('sitrep:open-task-detail', { detail: { taskId } }));
      });
      row.style.cursor = 'pointer';
    });
  }
}
