/**
 * Create issue form with assignee and due date.
 * @module components/forms/IssueForm
 */

import { defaultDueForSprint } from '../../utils/taskHelpers.js';

/**
 * @param {import('../../core/store.js').Store} store
 * @returns {string} HTML form markup
 */
export function IssueForm(store) {
  const sprint = store.getSelectedSprint() || store.getActiveSprint();
  const defaultDue = defaultDueForSprint(sprint);
  const users = store.getUsers();
  const me = store.currentAuthUser?.name || '';

  return `
    <form id="issue-form" class="form-stack">
      <div class="form-field">
        <label for="issue-title">Title</label>
        <input id="issue-title" name="title" type="text" required />
      </div>
      <div class="form-field">
        <label for="issue-assignee">Assignee</label>
        <select id="issue-assignee" name="assignee" required>
          ${users.map((u) => `
            <option value="${u.name}" ${u.name === me ? 'selected' : ''}>${u.name} — ${u.role}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="issue-severity">Priority</label>
        <select id="issue-severity" name="severity">
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium" selected>Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="form-field">
        <label for="issue-due">Due date</label>
        <input id="issue-due" name="due" type="date" value="${defaultDue}" required />
      </div>
      <div class="form-field">
        <label for="issue-description">Description</label>
        <textarea id="issue-description" name="description" required></textarea>
      </div>
      <div class="form-field form-field-row">
        <label>
          <input type="checkbox" name="createTask" value="1" checked />
          Also create a tracking task in the backlog (same assignee &amp; due)
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Submit Issue</button>
      </div>
    </form>
  `;
}
