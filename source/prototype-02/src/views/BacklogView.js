import { BaseView } from './BaseView.js';
import { api, isConfigured } from '../services/apiClient.js';

function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function badge(value) {
    const label = (value || '').toUpperCase();
    const clean = label.toLowerCase().replace(/\s+/g, '-');
    return `<span class="badge badge-${clean}">${label}</span>`;
}

export class BacklogView extends BaseView {
    render() {
        const tasks = this.store.getState().tasks.filter((t) => !t.parentTaskId);
        const allTasks = this.store.getState().tasks;
        const users = this.store.getUsers();
        const userNames = users.map((u) => u.name);
        const online = users.filter((u) => u.isOnline).map((u) => u.name);

        const activeUsers = online.length
            ? `<span style="font-size:0.75rem;color:var(--success);margin-left:1rem;">● ${online.length} online: ${online.join(', ')}</span>`
            : '';

        return `
            <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;">
                <div>
                    <h1 class="view-title">Backlog ${activeUsers}</h1>
                    <p class="view-subtitle">All tasks across sprints. Live synced every 10s.${isConfigured() ? '' : ' <span style="color:var(--warning);">(Local mode — set API URL in Settings to enable live sync)</span>'}</p>
                </div>
                <button id="btn-add-task" class="primary-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Task
                </button>
            </div>

            <!-- Add Task modal template (hidden) -->
            <template id="tmpl-add-task">
                <form id="add-task-form" style="display:flex;flex-direction:column;gap:0.75rem;min-width:340px;">
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Title *</label>
                        <input name="title" required style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                    </div>
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Assignees (select multiple for sub-tasks)</label>
                        <select name="assignees" multiple size="4"
                            style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;height:auto;">
                            ${userNames.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
                        </select>
                        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem;">Hold Ctrl/Cmd to select multiple. 2+ assignees will auto-create sub-tasks.</div>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <div style="flex:1;">
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Priority</label>
                            <select name="priority" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium" selected>Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Sprint</label>
                            <input name="sprintId" type="number" value="${this.store.getActiveSprint()?.id || 2}" min="1"
                                style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                        </div>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Due date</label>
                        <input name="due" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                    </div>
                    <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                        <button type="submit" class="primary-btn" style="flex:1;justify-content:center;">Add Task</button>
                        <button type="button" id="cancel-add-task" class="action-btn" style="flex:1;justify-content:center;">Cancel</button>
                    </div>
                </form>
            </template>

            <div class="card" style="padding:0;">
                <div style="padding:1.5rem;border-bottom:1px solid var(--border);display:flex;gap:1rem;align-items:center;">
                    <div class="search-box" style="flex:1;border:1px solid var(--border);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input id="backlog-search" type="text" placeholder="Search tasks…">
                    </div>
                    <select id="backlog-sort" class="dropdown-toggle">
                        <option value="priority">Sort: Priority</option>
                        <option value="due">Sort: Due Date</option>
                        <option value="status">Sort: Status</option>
                        <option value="assignees">Sort: Assignees</option>
                    </select>
                </div>
                <div id="filter-pills" style="padding:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
                    ${[
                        { label: 'All', key: 'ALL' },
                        { label: 'High Priority', key: 'HIGH_PRIORITY' },
                        { label: 'Multi-Assigned', key: 'MULTI' },
                        { label: 'Has Sub-Tasks', key: 'SUBTASKS' },
                        { label: 'Needs Review', key: 'REVIEW' },
                        { label: 'Blocked', key: 'BLOCKED' },
                        { label: 'Completed', key: 'COMPLETED' },
                    ].map((p) => `
                        <button class="filter-pill badge" data-filter="${p.key}"
                            style="background:${p.key === 'ALL' ? 'var(--primary)' : 'var(--primary-light)'};
                                   color:${p.key === 'ALL' ? 'white' : 'var(--primary)'};
                                   cursor:pointer;border:none;">
                            ${p.label}
                        </button>
                    `).join('')}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Task</th>
                            <th>Assignees</th>
                            <th>Sprint</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="backlog-body"></tbody>
                </table>
            </div>
        `;
    }

    mount(container) {
        const allTasks = () => this.store.getState().tasks;
        const users = this.store.getUsers();
        const userNames = users.map((u) => u.name);

        let filter = 'ALL';
        let search = '';
        let sort = 'priority';

        const PRIORITY = ['critical', 'high', 'medium', 'low'];
        const STATUS = ['blocked', 'progress', 'open', 'resolved'];

        const tbody = container.querySelector('#backlog-body');

        function subtasksOf(parentId) {
            return allTasks().filter((t) => t.parentTaskId === Number(parentId) || t.parentTaskId === String(parentId));
        }

        function applyPipeline() {
            let tasks = allTasks().filter((t) => !t.parentTaskId);

            if (filter === 'HIGH_PRIORITY')
                tasks = tasks.filter((t) => ['critical', 'high'].includes((t.priority || '').toLowerCase()));
            else if (filter === 'MULTI')
                tasks = tasks.filter((t) => (t.assignees || []).length >= 2);
            else if (filter === 'SUBTASKS')
                tasks = tasks.filter((t) => subtasksOf(t.id).length > 0);
            else if (filter === 'REVIEW')
                tasks = tasks.filter((t) => t.subtaskReviewStatus === 'pending');
            else if (filter === 'BLOCKED')
                tasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'blocked');
            else if (filter === 'COMPLETED')
                tasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'resolved');

            if (search) {
                const q = search.toLowerCase();
                tasks = tasks.filter((t) =>
                    (t.title || '').toLowerCase().includes(q) ||
                    (t.assignees || []).join(' ').toLowerCase().includes(q) ||
                    (t.owner || '').toLowerCase().includes(q)
                );
            }

            if (sort === 'priority')
                tasks.sort((a, b) => PRIORITY.indexOf((a.priority || '').toLowerCase()) - PRIORITY.indexOf((b.priority || '').toLowerCase()));
            else if (sort === 'due')
                tasks.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
            else if (sort === 'status')
                tasks.sort((a, b) => STATUS.indexOf((a.status || '').toLowerCase()) - STATUS.indexOf((b.status || '').toLowerCase()));
            else if (sort === 'assignees')
                tasks.sort((a, b) => (b.assignees || []).length - (a.assignees || []).length);

            return tasks;
        }

        const renderRows = () => {
            const tasks = applyPipeline();
            tbody.innerHTML = '';
            tasks.forEach((task) => {
                const subs = subtasksOf(task.id);
                const hasSubs = subs.length > 0;
                const assignees = task.assignees && task.assignees.length ? task.assignees : (task.owner ? [task.owner] : []);
                const needsReview = task.subtaskReviewStatus === 'pending';

                const tr = document.createElement('tr');
                tr.dataset.taskId = task.id;
                tr.innerHTML = `
                    <td style="width:28px;">
                        ${hasSubs ? `<button class="toggle-subtasks action-btn" data-id="${task.id}"
                            style="padding:0.2rem 0.4rem;font-size:0.7rem;border:1px solid var(--border);"
                            aria-expanded="false">▶</button>` : ''}
                    </td>
                    <td style="font-weight:500;">
                        ${esc(task.title)}
                        ${needsReview ? '<span class="badge" style="background:var(--warning-light);color:var(--warning);margin-left:0.5rem;">Needs Review</span>' : ''}
                        ${hasSubs ? `<span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.5rem;">(${subs.filter(s => s.status === 'resolved').length}/${subs.length} done)</span>` : ''}
                    </td>
                    <td>
                        <div style="display:flex;flex-wrap:wrap;gap:0.25rem;">
                            ${assignees.map((a) => `<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:0.7rem;">${esc(a)}</span>`).join('')}
                            ${assignees.length === 0 ? '<span style="color:var(--text-muted);">—</span>' : ''}
                        </div>
                    </td>
                    <td>Sprint ${esc(task.sprintId)}</td>
                    <td>${badge(task.priority)}</td>
                    <td>${badge(task.status)}</td>
                    <td style="color:var(--text-muted);">${esc(task.due || '—')}</td>
                    <td style="width:80px;text-align:right;white-space:nowrap;">
                        <button class="edit-task-btn action-btn" data-id="${task.id}"
                            style="padding:0.2rem 0.5rem;font-size:0.7rem;" title="Edit">✏️</button>
                        ${assignees.length >= 2 && !hasSubs
                            ? `<button class="split-task-btn action-btn" data-id="${task.id}"
                                style="padding:0.2rem 0.5rem;font-size:0.7rem;margin-left:0.25rem;" title="Split into sub-tasks">⚡ Split</button>`
                            : ''}
                    </td>
                `;
                tbody.appendChild(tr);

                if (hasSubs) {
                    subs.forEach((sub) => {
                        const subAssignees = sub.assignees && sub.assignees.length ? sub.assignees : (sub.owner ? [sub.owner] : []);
                        const str = document.createElement('tr');
                        str.className = `subtask-row subtask-of-${task.id}`;
                        str.style.display = 'none';
                        str.innerHTML = `
                            <td></td>
                            <td style="padding-left:2rem;font-size:0.875rem;color:var(--text-muted);">
                                ↳ ${esc(sub.title)}
                            </td>
                            <td>
                                ${subAssignees.map((a) => `<span class="badge" style="background:#f0fdf4;color:#15803d;font-size:0.7rem;">${esc(a)}</span>`).join('')}
                            </td>
                            <td colspan="3">${badge(sub.status)}</td>
                            <td style="color:var(--text-muted);font-size:0.8rem;">${esc(sub.due || '—')}</td>
                            <td style="text-align:right;">
                                ${sub.status !== 'resolved'
                                    ? `<button class="complete-subtask-btn action-btn" data-id="${sub.id}"
                                        style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--success-light);color:var(--success);">✓ Complete</button>`
                                    : '<span style="font-size:0.7rem;color:var(--success);">✓ Done</span>'}
                            </td>
                        `;
                        tbody.appendChild(str);
                    });
                }
            });

            wireTableButtons();
        };

        const wireTableButtons = () => {
            tbody.querySelectorAll('.toggle-subtasks').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const rows = tbody.querySelectorAll(`.subtask-of-${id}`);
                    const expanded = btn.getAttribute('aria-expanded') === 'true';
                    rows.forEach((r) => { r.style.display = expanded ? 'none' : ''; });
                    btn.textContent = expanded ? '▶' : '▼';
                    btn.setAttribute('aria-expanded', String(!expanded));
                });
            });

            tbody.querySelectorAll('.split-task-btn').forEach((btn) => {
                btn.addEventListener('click', () => splitTask(Number(btn.dataset.id)));
            });

            tbody.querySelectorAll('.edit-task-btn').forEach((btn) => {
                btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
            });

            tbody.querySelectorAll('.complete-subtask-btn').forEach((btn) => {
                btn.addEventListener('click', () => completeSubtask(Number(btn.dataset.id)));
            });
        };

        const splitTask = async (taskId) => {
            const task = allTasks().find((t) => t.id === taskId);
            if (!task) return;
            const assignees = task.assignees && task.assignees.length >= 2 ? task.assignees : [];
            if (assignees.length < 2) {
                alert('Task needs 2+ assignees to split into sub-tasks.');
                return;
            }

            if (!isConfigured()) {
                alert('Set the API URL in Settings to use live sub-tasks.');
                return;
            }

            if (!confirm(`Split "${task.title}" into ${assignees.length} sub-tasks, one per assignee?`)) return;

            try {
                for (const [i, person] of assignees.entries()) {
                    const sub = await api.createSubtask(taskId, {
                        title: `${task.title} — Part ${i + 1} (${person})`,
                        assignees: [person],
                        owner: person,
                        priority: task.priority,
                        due: task.due,
                    });
                    this.store.addTask(sub);
                }
                await api.updateTask(taskId, { status: 'progress', expectedUpdatedAt: task.updatedAt });
                const refreshed = await api.getTasks();
                this.store.setTasks(refreshed);
                renderRows();
                showNotification(`Split into ${assignees.length} sub-tasks.`, 'success');
            } catch (err) {
                alert('Failed to create sub-tasks: ' + err.message);
            }
        };

        const completeSubtask = async (subtaskId) => {
            if (!isConfigured()) {
                alert('Set the API URL in Settings to use live sub-task completion.');
                return;
            }
            try {
                const result = await api.completeSubtask(subtaskId);
                this.store.patchTask(result);
                const refreshed = await api.getTasks();
                this.store.setTasks(refreshed);
                renderRows();
                showNotification('Sub-task marked complete.', 'success');
            } catch (err) {
                if (err.status === 403) {
                    alert(err.body?.error || 'Only the assigned person can complete this sub-task.');
                } else {
                    alert('Error: ' + err.message);
                }
            }
        };

        const openEditModal = (taskId) => {
            const task = allTasks().find((t) => t.id === taskId);
            if (!task) return;
            const assignees = task.assignees || (task.owner ? [task.owner] : []);

            const modalHost = document.getElementById('modal-host');
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');

            modalTitle.textContent = 'Edit Task';
            modalContent.innerHTML = `
                <form id="edit-task-form" style="display:flex;flex-direction:column;gap:0.75rem;min-width:340px;">
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Title *</label>
                        <input name="title" required value="${esc(task.title)}"
                            style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                    </div>
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Assignees (Ctrl/Cmd to multi-select)</label>
                        <select name="assignees" multiple size="4"
                            style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                            ${userNames.map((n) => `<option value="${esc(n)}" ${assignees.includes(n) ? 'selected' : ''}>${esc(n)}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <div style="flex:1;">
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Priority</label>
                            <select name="priority" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                                ${['critical','high','medium','low'].map((p) =>
                                    `<option value="${p}" ${(task.priority||'').toLowerCase()===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Status</label>
                            <select name="status" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                                ${['open','progress','blocked','resolved'].map((s) =>
                                    `<option value="${s}" ${(task.status||'').toLowerCase()===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Due date</label>
                        <input name="due" type="date" value="${esc(task.due || '')}"
                            style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                    </div>
                    <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                        <button type="submit" class="primary-btn" style="flex:1;justify-content:center;">Save</button>
                        <button type="button" id="cancel-edit" class="action-btn" style="flex:1;justify-content:center;">Cancel</button>
                    </div>
                </form>
            `;
            modalHost.classList.remove('hidden');
            document.getElementById('cancel-edit').addEventListener('click', () => modalHost.classList.add('hidden'));

            document.getElementById('edit-task-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const newAssignees = Array.from(fd.getAll('assignees'));
                const patch = {
                    title: fd.get('title'),
                    priority: fd.get('priority'),
                    status: fd.get('status'),
                    due: fd.get('due') || null,
                    assignees: newAssignees,
                    owner: newAssignees[0] || null,
                    expectedUpdatedAt: task.updatedAt || null,
                };

                if (isConfigured()) {
                    try {
                        const updated = await api.updateTask(taskId, patch);
                        this.store.patchTask(updated);
                        modalHost.classList.add('hidden');
                        renderRows();
                        showNotification('Task saved.', 'success');
                    } catch (err) {
                        if (err.conflict) {
                            modalHost.classList.add('hidden');
                            alert(`Conflict: ${err.body?.error || 'Task was changed by another user. Reloading latest version.'}`);
                            const refreshed = await api.getTasks();
                            this.store.setTasks(refreshed);
                            renderRows();
                        } else {
                            alert('Save failed: ' + err.message);
                        }
                    }
                } else {
                    this.store.patchTask({ ...task, ...patch });
                    modalHost.classList.add('hidden');
                    renderRows();
                }
            });
        };

        const openAddModal = () => {
            const tmpl = container.querySelector('#tmpl-add-task');
            const modalHost = document.getElementById('modal-host');
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');
            modalTitle.textContent = 'Add Task';
            modalContent.innerHTML = tmpl.innerHTML;
            modalHost.classList.remove('hidden');

            document.getElementById('cancel-add-task').addEventListener('click', () => modalHost.classList.add('hidden'));
            document.getElementById('add-task-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const assignees = Array.from(fd.getAll('assignees'));
                const payload = {
                    title: fd.get('title'),
                    priority: fd.get('priority'),
                    sprintId: Number(fd.get('sprintId')) || 2,
                    due: fd.get('due') || null,
                    assignees,
                    owner: assignees[0] || null,
                    status: 'open',
                };

                if (isConfigured()) {
                    try {
                        const task = await api.createTask(payload);
                        this.store.addTask(task);

                        if (assignees.length >= 2) {
                            for (const [i, person] of assignees.entries()) {
                                const sub = await api.createSubtask(task.id, {
                                    title: `${payload.title} — Part ${i + 1} (${person})`,
                                    assignees: [person],
                                    owner: person,
                                    priority: payload.priority,
                                    due: payload.due,
                                });
                                this.store.addTask(sub);
                            }
                            showNotification(`Task created with ${assignees.length} sub-tasks.`, 'success');
                        } else {
                            showNotification('Task created.', 'success');
                        }
                    } catch (err) {
                        alert('Failed to create task: ' + err.message);
                        return;
                    }
                } else {
                    this.store.addTask({ ...payload, id: Date.now(), sprintId: payload.sprintId });
                    showNotification('Task added (local mode).', 'info');
                }

                modalHost.classList.add('hidden');
                renderRows();
            });
        };

        container.querySelector('#btn-add-task').addEventListener('click', openAddModal);

        container.querySelector('#backlog-search').addEventListener('input', (e) => {
            search = e.target.value;
            renderRows();
        });

        container.querySelector('#backlog-sort').addEventListener('change', (e) => {
            sort = e.target.value;
            renderRows();
        });

        container.querySelectorAll('.filter-pill').forEach((pill) => {
            pill.addEventListener('click', () => {
                container.querySelectorAll('.filter-pill').forEach((p) => {
                    p.style.background = 'var(--primary-light)';
                    p.style.color = 'var(--primary)';
                });
                pill.style.background = 'var(--primary)';
                pill.style.color = 'white';
                filter = pill.dataset.filter;
                renderRows();
            });
        });

        renderRows();
    }
}

function showNotification(msg, type = 'info') {
    const colors = { success: '#15803d', error: '#dc2626', info: '#1d4ed8', warning: '#b45309' };
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
        position:fixed;bottom:1.5rem;right:1.5rem;
        background:${colors[type] || colors.info};color:white;
        padding:0.6rem 1.2rem;border-radius:8px;font-size:0.875rem;font-weight:500;
        z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}
