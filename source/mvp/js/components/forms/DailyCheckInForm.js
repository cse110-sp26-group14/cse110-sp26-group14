/**
 * Daily async check-in form (markup from templates/partials.html).
 * @module components/forms/DailyCheckInForm
 */
import { renderTemplate } from '../../utils/templateEngine.js';
/**
 * Renders the daily async check-in form by expanding its HTML template.
 * @returns {string} HTML form markup
 */
export function DailyCheckInForm() {
  return renderTemplate('tpl-form-daily-checkin');
}