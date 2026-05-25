import { BaseView } from './BaseView.js';
import { formatShortDate, getWeekdayDates } from '../utils/dates.js';
import { AVAILABILITY_HOURS } from '../components/forms/AvailabilityCheckForm.js';

const STATUS_STYLES = {
    preferred: { bg: '#e0e7ff', text: '#4338ca', label: 'Preferred' },
    available: { bg: '#dcfce7', text: '#15803d', label: 'Available' },
    tentative: { bg: '#eff6ff', text: '#1d4ed8', label: 'Tentative' },
    unavailable: { bg: '#f3f4f6', text: '#4b5563', label: 'Unavailable' },
    needs_coverage: { bg: '#fef3c7', text: '#b45309', label: 'Needs Coverage' }
};

export class AvailabilityView extends BaseView {
    render() {
        const users = this.store.getUsers();
        const state = this.store.getState();
        const logs = this.store.getAvailabilityLogs();
        const dates = this.getDisplayedDates(state.availability);
        const currentUserId = 1;
        const currentUser = users.find(user => user.id === currentUserId);
        const latestLog = logs[0];

        return `
            <div class="view-header">
                <h1 class="view-title">Team Availability</h1>
                <p class="view-subtitle">Weekly async availability and calendar-derived conflicts.</p>
            </div>

            <div class="availability-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem; margin-bottom: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">${formatShortDate(dates[0])} - ${formatShortDate(dates[dates.length - 1])}</span>
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">${this.store.getActiveSprint()?.name || 'Current Sprint'}</span>
                        <span class="badge" style="background: ${latestLog ? 'var(--success-light)' : 'var(--warning-light)'}; color: ${latestLog ? 'var(--success)' : 'var(--warning)'};">${latestLog ? 'Submitted' : 'Pending Check'}</span>
                    </div>
                    <div class="availability-grid" style="display: grid; grid-template-columns: 150px repeat(${AVAILABILITY_HOURS.length}, 1fr); gap: 1px; background: var(--border); overflow-x: auto;">
                        <div style="background: var(--bg-main); padding: 0.75rem; font-size: 0.75rem; color: var(--text-light);">Team / day</div>
                        ${AVAILABILITY_HOURS.map(hour => `<div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--text-light);">${hour}</div>`).join('')}
                        
                        ${dates.map(date => `
                            <div style="background: var(--bg-main); padding: 0.75rem; grid-column: 1 / -1; font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${formatShortDate(date)}</div>
                            ${users.map(user => `
                                <div style="background: white; padding: 1rem; border-bottom: 1px solid var(--border);">
                                    <div style="font-weight: 600; font-size: 0.875rem;">${user.name}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-muted);">${user.role}</div>
                                </div>
                                ${AVAILABILITY_HOURS.map(hour => this.renderAvailabilityCell(state.availability, date, user.id, hour)).join('')}
                            `).join('')}
                        `).join('')}
                    </div>
                </div>

                <div class="availability-sidebar" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Weekly status</h3>
                        </div>
                        <div style="padding: 1rem; background: var(--primary-light); border-radius: var(--radius-md); border: 1px solid var(--primary); margin-bottom: 1rem;">
                            <div style="font-weight: 700; font-size: 1rem;">${currentUser?.name || 'Current user'}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${latestLog ? `Submitted ${latestLog.submittedAt.replace('T', ' ').substring(0, 16)}` : 'Awaiting weekly check'}</div>
                        </div>
                        <button id="open-availability-check" class="primary-btn" style="width: 100%; justify-content: center;">Update Availability</button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Calendar sync</h3>
                        </div>
                        <p style="font-size: 0.8125rem; color: var(--text-muted);">${latestLog?.calendarSync?.message || 'No weekly submission has been synced yet.'}</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Availability Log</h3>
                </div>
                ${logs.length ? `
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${logs.map(log => this.renderLog(log)).join('')}
                    </div>
                ` : '<p style="font-size: 0.875rem; color: var(--text-muted);">No availability submissions yet.</p>'}
            </div>
        `;
    }

    mount(container) {
        const openButton = container.querySelector('#open-availability-check');
        const quickAction = document.getElementById('btn-availability');
        if (openButton && quickAction) {
            openButton.addEventListener('click', () => quickAction.click());
        }
    }

    getDisplayedDates(availability) {
        const dates = Object.keys(availability || {}).sort();
        if (dates.length >= 5) return dates.slice(-5);
        return getWeekdayDates(new Date());
    }

    renderAvailabilityCell(availability, date, userId, hour) {
        const status = availability?.[date]?.[userId]?.[hour] || 'available';
        const style = STATUS_STYLES[status] || STATUS_STYLES.available;

        return `
            <div style="background: white; padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
                <div title="${style.label}" style="width: 100%; height: 32px; border-radius: 4px; background: ${style.bg}; color: ${style.text}; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 500;">
                    ${style.label}
                </div>
            </div>
        `;
    }

    renderLog(log) {
        const summary = Object.entries(log.summary || {})
            .map(([status, count]) => `${STATUS_STYLES[status]?.label || status}: ${count}`)
            .join(' • ');

        return `
            <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
                <div style="display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start;">
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">${log.userName} submitted ${log.weekKey}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${log.sprintName} • ${log.submittedAt.replace('T', ' ').substring(0, 19)}</div>
                    </div>
                    <span class="badge" style="background: var(--primary-light); color: var(--primary);">${log.calendarSync?.status || 'logged'}</span>
                </div>
                <p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.75rem;">${summary || 'No availability slots recorded.'}</p>
                <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">${log.calendarSync?.message || ''}</p>
            </div>
        `;
    }
}
