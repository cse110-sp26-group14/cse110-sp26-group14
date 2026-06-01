/**
 * Quick team note (saved to AI log).
 * @module components/forms/NoteForm
 */
/**
 * Builds the quick team-note form markup, with title and content fields.
 * @returns {string} HTML form markup
 */
export function NoteForm() {
  return `
    <form id="note-form" class="form-stack">
      <div class="form-field">
        <label for="note-title">Title</label>
        <input id="note-title" name="title" type="text" required placeholder="e.g. Retro action item" />
      </div>
      <div class="form-field">
        <label for="note-content">Note</label>
        <textarea id="note-content" name="content" rows="4" required placeholder="What should the team remember?"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Save note</button>
      </div>
    </form>
  `;
}