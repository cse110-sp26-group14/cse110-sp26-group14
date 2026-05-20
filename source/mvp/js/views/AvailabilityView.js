import { BaseView } from './BaseView.js';
import { HOURS } from '../components/forms/AvailabilityForm.js';
import { suggestBestMeetingSlot } from '../utils/teamStats.js';
import { todayISO } from '../utils/dates.js';

export class AvailabilityView extends BaseView {
  render() {
    const users = this.store.getUsers();
    const date = todayISO();
    const availability = this.store.getState().availability?.[date] || {};
    const best = suggestBestMeetingSlot(availability, HOURS);
    const me = this.store.getCurrentUserId();

    return `
            <div class="view-header">
                <h1 class="view-title">Team Availability</h1>
                <p class="view-subtitle">Shared schedule for ${date}. <button type="button" class="action-btn" id="avail-update-btn">Update my availability</button></p>
            </div>

            <div class="availability-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;">
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">${date}</span>
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">${this.store.getActiveSprint()?.name || 'Sprint'}</span>
                    </div>
                    <div class="availability-grid" style="display: grid; grid-template-columns: 150px repeat(9, 1fr); gap: 1px; background: var(--border);">
                        <div style="background: var(--bg-main); padding: 0.75rem; font-size: 0.75rem; color: var(--text-light);">Team</div>
                        ${HOURS.map((h) => `<div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--text-light);">${h}</div>`).join('')}
                        
                        ${users.map((user) => `
                            <div style="background: white; padding: 1rem; border-bottom: 1px solid var(--border);">
                                <div style="font-weight: 600; font-size: 0.875rem;">
                                  ${user.isOnline ? '<span style="color:var(--success)">●</span> ' : ''}${user.name}
                                  ${Number(user.id) === Number(me) ? ' (you)' : ''}
                                </div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${user.role}</div>
                            </div>
                            ${HOURS.map((h) => {
                                const status = availability[user.id]?.[h] || 'available';
                                const colors = {
                                    preferred: { bg: '#e0e7ff', text: '#4338ca', label: 'Preferred' },
                                    available: { bg: '#dcfce7', text: '#15803d', label: 'Available' },
                                    tentative: { bg: '#eff6ff', text: '#1d4ed8', label: 'Tentative' },
                                    unavailable: { bg: '#f3f4f6', text: '#4b5563', label: 'Unavailable' },
                                    needs_coverage: { bg: '#fef3c7', text: '#b45309', label: 'Needs Coverage' },
                                };
                                const style = colors[status] || colors.available;
                                return `
                                    <div style="background: white; padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
                                        <div title="${style.label}" style="width: 100%; height: 32px; border-radius: 4px; background: ${style.bg}; color: ${style.text}; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 500;">
                                            ${style.label}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        `).join('')}
                    </div>
                </div>

                <div class="availability-sidebar" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Best meeting time</h3>
                        </div>
                        <div style="padding: 1.5rem; background: var(--primary-light); border-radius: var(--radius-md); border: 1px solid var(--primary); margin-bottom: 1rem;">
                            <div style="font-weight: 700; font-size: 1rem;">${best.label}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${best.detail}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  mount(container) {
    container.querySelector('#avail-update-btn')?.addEventListener('click', () => {
      document.getElementById('btn-availability')?.click();
    });
  }
}
