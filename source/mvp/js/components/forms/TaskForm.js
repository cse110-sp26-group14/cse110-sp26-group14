/**
 * Create sprint task form.
 * @module components/forms/TaskForm
 */

import { defaultDueForSprint } from '../../utils/taskHelpers.js';

/**
 * @param {import('../../core/store.js').Store} store
 * @returns {string}
 */
export function TaskForm(store) {
  const sprint = store.getSelectedSprint() || store.getActiveSprint();
  const defaultDue = defaultDueForSprint(sprint);
  const users = store.getUsers();

  return `
    <form id="task-form" class="form-stack">
      <div class="form-field">
        <label for="task-title">Title</label>
        <input id="task-title" name="title" type="text" required />
      </div>
      <div class="form-field">
        <label for="task-owner">Assignee</label>
        <select id="task-owner" name="owner" required>
          ${users.map((u) => `
            <option value="${u.name}" ${u.name === store.currentAuthUser?.name ? 'selected' : ''}>${u.name} — ${u.role}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="task-priority">Priority</label>
        <select id="task-priority" name="priority">
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium" selected>Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="form-field">
        <label for="task-due">Due date</label>
        <input id="task-due" name="due" type="date" value="${defaultDue}" required />
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Add task</button>
      </div>
    </form>
  `;
}
