/**
 * Update personal availability slots for one day.
 * @module components/forms/AvailabilityForm
 */

import { todayISO } from '../../utils/dates.js';

const HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const STATUSES = ['available', 'preferred', 'tentative', 'unavailable', 'needs_coverage'];

/**
 * @param {object} [existing] - hour → status
 * @param {string} [date]
 * @returns {string}
 */
export function AvailabilityForm(existing = {}, date = todayISO()) {
  const rows = HOURS.map((h) => {
    const val = existing[h] || 'available';
    const options = STATUSES.map(
      (s) => `<option value="${s}" ${s === val ? 'selected' : ''}>${s.replace('_', ' ')}</option>`,
    ).join('');
    return `
      <div class="form-field" style="display:grid;grid-template-columns:80px 1fr;gap:0.5rem;align-items:center;">
        <label for="slot-${h}">${h}</label>
        <select id="slot-${h}" name="slot-${h}">${options}</select>
      </div>`;
  }).join('');

  return `
    <form id="availability-form" class="form-stack">
      <div class="form-field">
        <label for="avail-date">Date</label>
        <input id="avail-date" name="date" type="date" value="${date}" required />
      </div>
      ${rows}
      <div class="form-actions">
        <button type="submit" class="primary-btn">Save availability</button>
      </div>
    </form>
  `;
}

export { HOURS };
