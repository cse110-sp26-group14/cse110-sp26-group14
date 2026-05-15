import { BaseView } from './BaseView.js';

export class AvailabilityView extends BaseView {
    render() {
        const users = this.store.getUsers();
        const availability = this.store.getState().availability['2026-05-13'];
        const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

        return `
            <div class="view-header">
                <h1 class="view-title">Team Availability</h1>
                <p class="view-subtitle">When the team is reachable today.</p>
            </div>

            <div class="availability-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;">
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">May 13, 2026</span>
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">Sprint 2</span>
                        <select class="dropdown-toggle" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <option>All formats</option>
                        </select>
                    </div>
                    <div class="availability-grid" style="display: grid; grid-template-columns: 150px repeat(9, 1fr); gap: 1px; background: var(--border);">
                        <div style="background: var(--bg-main); padding: 0.75rem; font-size: 0.75rem; color: var(--text-light);">Today</div>
                        ${hours.map(h => `<div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--text-light);">${h}</div>`).join('')}
                        
                        ${users.map(user => `
                            <div style="background: white; padding: 1rem; border-bottom: 1px solid var(--border);">
                                <div style="font-weight: 600; font-size: 0.875rem;">${user.name}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${user.role}</div>
                            </div>
                            ${hours.map(h => {
                                const status = availability[user.id][h] || 'available';
                                const colors = {
                                    preferred: { bg: '#e0e7ff', text: '#4338ca', label: 'Preferred' },
                                    available: { bg: '#dcfce7', text: '#15803d', label: 'Available' },
                                    tentative: { bg: '#eff6ff', text: '#1d4ed8', label: 'Tentative' },
                                    unavailable: { bg: '#f3f4f6', text: '#4b5563', label: 'Unavailable' },
                                    needs_coverage: { bg: '#fef3c7', text: '#b45309', label: 'Needs Coverage' }
                                };
                                const style = colors[status];
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
                            <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Best meeting time</h3>
                        </div>
                        <div style="padding: 1.5rem; background: var(--primary-light); border-radius: var(--radius-md); border: 1px solid var(--primary); margin-bottom: 1rem;">
                            <div style="font-weight: 700; font-size: 1rem;">Wed • 2:00 PM</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">4 of 5 available • 1 tentative</div>
                        </div>
                        <div style="font-size: 0.75rem;">
                            <div style="color: var(--text-light); margin-bottom: 0.5rem;">Alternatives</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span>Thu • 10:00 AM</span> <span>3/5</span></div>
                            <div style="display: flex; justify-content: space-between;"><span>Fri • 11:00 AM</span> <span>3/5</span></div>
                        </div>
                        <button class="primary-btn" style="width: 100%; margin-top: 1.5rem; justify-content: center;">Add Meeting to Calendar</button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Coverage requests</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
                                <span>Priya • QA on-call</span>
                                <span class="badge" style="background: var(--warning-light); color: var(--warning);">Needs Coverage</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
                                <span>Sam • Docs review</span>
                                <span class="badge" style="background: var(--info-light); color: var(--info);">Tentative</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Conflicts</h3>
                        </div>
                        <p style="font-size: 0.8125rem; color: var(--text-muted);">2 conflicts during sprint review window.</p>
                    </div>
                </div>
            </div>
        `;
    }
}
