/**
 * Create sprint task form.
 * @module components/forms/TaskForm
 */

/**
 * @returns {string}
 */
export function TaskForm() {
  return `
    <form id="task-form" class="form-stack">
      <div class="form-field">
        <label for="task-title">Title</label>
        <input id="task-title" name="title" type="text" required />
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
        <input id="task-due" name="due" type="date" />
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Add task</button>
      </div>
    </form>
  `;
}
