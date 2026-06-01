/**
 * Team report / availability helpers for dashboard.
 * @module utils/teamStats
 */

import { todayISO } from './dates.js';

/**
 * Returns the current user's check-in report for today, if one exists.
 * @param {import('../core/store.js').Store} store
 * @returns {object|undefined}
 */
export function getMyReportToday(store) {
  const uid = store.getCurrentUserId();
  const today = todayISO();
  return store.getReports().find(
    (r) => Number(r.userId) === Number(uid) && r.date === today,
  );
}

/**
 * Computes check-in stats for a date: how many reports were submitted, how many
 * users are still missing, and how many reported a blocker.
 * @param {object[]} reports
 * @param {object[]} users
 * @param {string} [date]
 */
export function getCheckInStats(reports, users, date = todayISO()) {
  const dayReports = reports.filter((r) => r.date === date);
  const submitted = dayReports.length;
  const missing = Math.max(0, users.length - submitted);
  const blockers = dayReports.filter((r) => r.blockers && r.blockers !== 'None').length;
  return { submitted, missing, blockers };
}

/**
 * Suggests the best meeting hour by scoring each hour across the team's
 * availability slots (available/preferred = 2, tentative = 1) and returning the
 * highest-scoring hour with a summary label.
 * @param {Record<string, Record<string, string>>} daySlots
 * @param {string[]} hours
 */
export function suggestBestMeetingSlot(daySlots, hours) {
  if (!daySlots || !Object.keys(daySlots).length) {
    return { label: 'No data', detail: 'Submit availability first' };
  }
  let bestHour = hours[0];
  let bestScore = -1;
  hours.forEach((h) => {
    let score = 0;
    Object.values(daySlots).forEach((slots) => {
      const s = slots[h];
      if (s === 'available' || s === 'preferred') score += 2;
      else if (s === 'tentative') score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestHour = h;
    }
  });
  const total = Object.keys(daySlots).length;
  return { label: `Today • ${bestHour}`, detail: `${bestScore}/${total * 2} team score at this hour` };
}

/**
 * Users who have not submitted a check-in for the given date.
 * @param {object[]} reports
 * @param {object[]} users
 * @param {string} [date]
 * @returns {object[]}
 */
export function getMissingCheckInUsers(reports, users, date = todayISO()) {
  const submittedIds = new Set(
    reports.filter((r) => r.date === date).map((r) => Number(r.userId)),
  );
  return users.filter((u) => !submittedIds.has(Number(u.id)));
}