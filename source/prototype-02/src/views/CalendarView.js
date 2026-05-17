import { BaseView } from './BaseView.js';

export class CalendarView extends BaseView {
    render() {
        return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Sprint Calendar</h1>
                    <p class="view-subtitle">Sprint 2 • May 12 – May 19</p>
                </div>
                <div class="calendar-controls" style="display: flex; gap: 0.5rem; align-items: center; background: var(--white); padding: 0.25rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <button class="action-btn" style="border:none;">May 2026</button>
                    <button class="action-btn" style="border:none;">Sprint 2</button>
                    <button class="action-btn" style="border:none;">Today</button>
                    <div style="width: 1px; background: var(--border); height: 20px; margin: 0 0.25rem;"></div>
                    <button class="action-btn" style="border:none;">Month</button>
                    <button class="action-btn" style="border:none;">Week</button>
                    <button class="action-btn" style="border:none; background: var(--primary); color: white;">Sprint</button>
                </div>
            </div>

            <div class="calendar-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border);">
                        ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => `
                            <div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.7rem; font-weight: 600; color: var(--text-light);">${day}</div>
                        `).join('')}
                        ${[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map(d => `
                            <div class="calendar-day" style="background: white; height: 120px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; ${d === 13 ? 'border: 2px solid var(--primary); z-index: 10;' : ''}">
                                <div style="font-size: 0.875rem; font-weight: 500; color: ${d < 12 || d > 19 ? 'var(--text-light)' : 'var(--text-main)'}">${d}</div>
                                ${d === 13 ? '<div style="background: var(--primary-light); color: var(--primary); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">10:00 Sprint Stan...</div>' : ''}
                                ${d === 15 ? '<div style="background: var(--warning-light); color: var(--warning); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">Due: Migrate billi...</div>' : ''}
                                ${d === 19 ? '<div style="background: var(--success-light); color: var(--success); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">14:00 Sprint Revi...</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--primary);"></span> Sprint range</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--info);"></span> Meetings</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--warning);"></span> Tasks due</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--primary);"></span> Today</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> May 13</h3>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Meetings</h4>
                        <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                            <div style="font-weight: 600; font-size: 0.875rem;">Sprint Standup</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">10:00 • online</div>
                        </div>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Tasks Due</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Nothing scheduled</p>
                    </div>
                    <div>
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Notes</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No notes attached</p>
                    </div>
                </div>
            </div>
        `;
    }
}
