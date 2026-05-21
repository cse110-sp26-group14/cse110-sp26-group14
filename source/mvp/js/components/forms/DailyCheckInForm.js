/**
 * Daily async check-in form (markup from templates/partials.html).
 * @module components/forms/DailyCheckInForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';

/**
 * @returns {string} HTML form markup
 */
export function DailyCheckInForm() {
  return renderTemplate('tpl-form-daily-checkin');
}
