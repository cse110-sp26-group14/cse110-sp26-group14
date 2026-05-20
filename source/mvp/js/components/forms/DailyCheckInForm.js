/**
 * Daily async check-in form template.
 * @module components/forms/DailyCheckInForm
 * @returns {string} HTML
 */
export function DailyCheckInForm() {
  return `
    <form id="checkin-form" class="form-stack">
      <div class="form-field">
        <label for="checkin-status">Status</label>
        <select id="checkin-status" name="status" required>
          <option value="Completed">Completed</option>
          <option value="In Progress" selected>In Progress</option>
          <option value="Blocked">Blocked</option>
          <option value="Not Started">Not Started</option>
        </select>
      </div>
      <div class="form-field">
        <label for="checkin-mood">Mood</label>
        <select id="checkin-mood" name="mood">
          <option>Good</option>
          <option>Neutral</option>
          <option>Stressed</option>
        </select>
      </div>
      <div class="form-field">
        <label for="checkin-progress">What did you work on?</label>
        <textarea id="checkin-progress" name="progress" required></textarea>
      </div>
      <div class="form-field">
        <label for="checkin-blockers">Any blockers?</label>
        <input id="checkin-blockers" name="blockers" type="text" placeholder="None" />
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Submit Check-In</button>
      </div>
    </form>
  `;
}
