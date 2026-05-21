/**
 * Sprint goals input before AI task suggestions (replaces browser prompt).
 * @module components/forms/AiGoalsForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';

/**
 * @returns {string} HTML form markup
 */
export function AiGoalsForm() {
  return renderTemplate('tpl-form-ai-goals');
}
