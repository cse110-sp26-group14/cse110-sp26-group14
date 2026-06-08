/**
 * Schedule team meeting form (markup from templates/partials.html).
 * @module components/forms/MeetingForm
 */
import { renderTemplate } from "../../utils/templateEngine.js";
/**
 * Renders the schedule-team-meeting form by expanding its HTML template,
 * pre-filling the date and time fields with the supplied defaults.
 * @param {string} [defaultDate] - Initial value for the meeting date field; defaults to an empty string.
 * @param {string} [defaultTime] - Initial value for the meeting time field; defaults to `'10:00 AM'`.
 * @param {{ recommendationBanner?: string, dateClass?: string, timeClass?: string }} [opts]
 * @returns {string} HTML form markup
 */
export function MeetingForm(
  defaultDate = "",
  defaultTime = "10:00 AM",
  opts = {},
) {
  const { recommendationBanner = "", dateClass = "", timeClass = "" } = opts;
  return renderTemplate(
    "tpl-form-meeting",
    { defaultDate, defaultTime, recommendationBanner, dateClass, timeClass },
    { raw: ["recommendationBanner"] },
  );
}
