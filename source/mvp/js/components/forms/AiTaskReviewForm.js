/**
 * Review AI task suggestions before adding to backlog.
 * @module components/forms/AiTaskReviewForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';

/**
 * @param {object[]} suggestions
 * @returns {string} HTML form markup
 */
export function AiTaskReviewForm(suggestions) {
  if (!suggestions.length) {
    return '<p class="empty-hint">No suggestions returned.</p>';
  }

  const rows = suggestions.map((s, i) => {
    const p = s.priority || 'medium';
    return renderTemplate('tpl-form-ai-review-row', {
      index: String(i),
      title: s.title,
      highSelected: p === 'high' ? 'selected' : '',
      mediumSelected: p === 'medium' ? 'selected' : '',
      lowSelected: p === 'low' ? 'selected' : '',
    }, { raw: ['highSelected', 'mediumSelected', 'lowSelected'] });
  }).join('');

  return renderTemplate('tpl-form-ai-review-intro', { rows }, { raw: ['rows'] });
}
