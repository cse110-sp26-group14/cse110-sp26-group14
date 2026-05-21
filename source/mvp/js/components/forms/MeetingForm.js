/**
 * Schedule team meeting form (markup from templates/partials.html).
 * @module components/forms/MeetingForm
 */

import { renderTemplate } from '../../utils/templateEngine.js';

/**
 * @param {string} [defaultDate]
 * @param {string} [defaultTime]
 * @returns {string} HTML form markup
 */
export function MeetingForm(defaultDate = '', defaultTime = '10:00 AM') {
  return renderTemplate('tpl-form-meeting', { defaultDate, defaultTime });
}
