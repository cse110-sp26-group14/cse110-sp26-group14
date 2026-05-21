import { getISOWeekKey, getWeekdayDates } from '../../utils/dates.js';

export const AVAILABILITY_HOURS = [
    '9:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
];

export const AVAILABILITY_STATUSES = [
    { value: 'preferred', label: 'Preferred' },
    { value: 'available', label: 'Available' },
    { value: 'tentative', label: 'Tentative' },
    { value: 'unavailable', label: 'Unavailable' },
    { value: 'needs_coverage', label: 'Needs Coverage' }
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function AvailabilityCheckForm(date = new Date()) {
    const dates = getWeekdayDates(date);
    const weekKey = getISOWeekKey(date);

    return `
        <form id="availability-check-form" data-week-key="${weekKey}" style="display: flex; flex-direction: column; gap: 1rem;">
            <p style="font-size: 0.875rem; color: var(--text-muted);">Set your expected working availability for this week. Calendar conflicts will be merged when you submit.</p>
            <div style="overflow-x: auto;">
                <table class="availability-check-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            ${dates.map((isoDate, index) => `<th>${WEEKDAY_LABELS[index]}<br><span style="font-weight: 400;">${isoDate.slice(5)}</span></th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${AVAILABILITY_HOURS.map(hour => `
                            <tr>
                                <td style="font-weight: 600;">${hour}</td>
                                ${dates.map(dateValue => `
                                    <td>
                                        <select name="${dateValue}__${hour}" aria-label="${dateValue} ${hour}" style="width: 100%; min-width: 120px; padding: 0.4rem; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                                            ${AVAILABILITY_STATUSES.map(status => `
                                                <option value="${status.value}" ${status.value === 'available' ? 'selected' : ''}>${status.label}</option>
                                            `).join('')}
                                        </select>
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button type="submit" class="primary-btn" style="width: 100%; justify-content: center;">Submit Availability Check</button>
        </form>
    `;
}

export function parseAvailabilityForm(form) {
    const grid = {};
    const formData = new FormData(form);

    formData.forEach((status, key) => {
        const [date, hour] = key.split('__');
        if (!date || !hour) return;
        if (!grid[date]) grid[date] = {};
        grid[date][hour] = status;
    });

    return {
        grid,
        weekKey: form.dataset.weekKey
    };
}
