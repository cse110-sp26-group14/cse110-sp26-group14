/**
 * Review AI task suggestions before adding to backlog.
 * @module components/forms/AiTaskReviewForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';
import { defaultDueForSprint } from '../../utils/taskHelpers.js';

/**
 * @param {object[]} suggestions
 * @param {import('../../core/store.js').Store} store
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
