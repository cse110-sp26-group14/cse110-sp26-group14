/**
 * Create issue / blocker form (markup from templates/partials.html).
 * @module components/forms/IssueForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';

/**
 * @returns {string} HTML form markup
 */
export function IssueForm() {
  return renderTemplate('tpl-form-issue');
}
