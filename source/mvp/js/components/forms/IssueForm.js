/**
 * Create issue / blocker form template.
 * @module components/forms/IssueForm
 * @returns {string} HTML
 */
export function IssueForm() {
  return `
    <form id="issue-form" class="form-stack">
      <div class="form-field">
        <label for="issue-title">Title</label>
        <input id="issue-title" name="title" type="text" required />
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
        <label for="issue-description">Description</label>
        <textarea id="issue-description" name="description" required></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Submit Issue</button>
      </div>
    </form>
  `;
}
