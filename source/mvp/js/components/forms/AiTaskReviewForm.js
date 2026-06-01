/**
 * Review AI task suggestions before adding to backlog.
 * @module components/forms/AiTaskReviewForm
 */
import { renderTemplate } from '../../utils/templateEngine.js';
import { defaultDueForSprint } from '../../utils/taskHelpers.js';
/**
 * Builds the review form markup for a set of AI-generated task suggestions,
 * pre-filling each row's priority, due date, and owner with sensible defaults
 * derived from the current sprint and user list.
 * @param {object[]} suggestions - AI-generated task suggestions; each may carry `title`, `priority`, `due`, and `owner` fields. Returns an empty-state hint when the array is empty.
 * @param {import('../../core/store.js').Store} store - Application store used to resolve the active/selected sprint, the current user, and the available user list.
 * @returns {string} HTML form markup
 */
export function AiTaskReviewForm(suggestions, store) {
  if (!suggestions.length) {
    return '<p class="empty-hint">No suggestions returned.</p>';
  }
  const defaultDue = defaultDueForSprint(store.getSelectedSprint() || store.getActiveSprint());
  const fallbackOwner = store.currentAuthUser?.name || store.getUsers()[0]?.name || '';
  const rows = suggestions.map((s, i) => {
    const p = s.priority || 'medium';
    const due = s.due || defaultDue;
    const selectedOwner = s.owner || fallbackOwner;
    const ownerOptions = store.getUsers().map(
      (u) => `<option value="${u.name}" ${u.name === selectedOwner ? 'selected' : ''}>${u.name} — ${u.role}</option>`,
    ).join('');
    return renderTemplate('tpl-form-ai-review-row', {
      index: String(i),
      title: s.title,
      defaultDue: due,
      ownerOptions,
      highSelected: p === 'high' ? 'selected' : '',
      mediumSelected: p === 'medium' ? 'selected' : '',
      lowSelected: p === 'low' ? 'selected' : '',
    }, { raw: ['highSelected', 'mediumSelected', 'lowSelected', 'ownerOptions'] });
  }).join('');
  return renderTemplate('tpl-form-ai-review-intro', { rows }, { raw: ['rows'] });
}
