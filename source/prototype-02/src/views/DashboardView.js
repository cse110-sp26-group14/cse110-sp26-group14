import { BaseView } from './BaseView.js';

export class DashboardView extends BaseView {
    render() {
        const activeSprint = this.store.getActiveSprint();
        const sprintTasks = this.store.getTasksBySprint(activeSprint.id);
        const issues = this.store.getIssues();
        const urgentIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');

        return `
            <div class="view-header">
                <h1 class="view-title">Dashboard</h1>
                <p class="view-subtitle">Real-time overview of ${activeSprint.name}</p>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <!-- Sprint Progress Card -->
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">Current Sprint</h3>
                        <span class="badge badge-medium">Risk: Medium</span>
                    </div>
                    <div class="sprint-info" style="margin-bottom: 1.5rem;">
                        <h2 style="font-size: 1.5rem;">${activeSprint.name} • May 12 – May 19</h2>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">4 days left • keep momentum going.</p>
                    </div>
                    <div class="progress-bar-container" style="background: var(--border); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary); width: 45%; height: 100%;"></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        Progress 45%
                    </div>
                </div>

                <!-- Daily Check-in Status Card -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily check-in</h3>
                    </div>
                    <div style="text-align: center; padding: 1rem 0;">
                        <div class="badge badge-resolved" style="padding: 0.5rem 1rem; font-size: 0.875rem;">● Checked In</div>
                        <p style="margin-top: 1rem; font-size: 0.875rem;">Submitted today. Mood: <strong>Good</strong></p>
                        <p style="color: var(--text-muted); font-size: 0.75rem;">Working on: Lead standup</p>
                    </div>
                    <button class="action-btn" style="width: 100%; margin-top: 1rem; justify-content: center;">Edit Check-In</button>
                </div>

                <!-- This Week / Calendar Preview -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">This week</h3>
                        <a href="#calendar" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">Open calendar ></a>
                    </div>
                    <div class="week-strip" style="display: flex; gap: 0.5rem; justify-content: space-between;">
                        ${[12, 13, 14, 15, 16, 17, 18].map(d => `
                            <div class="day-box ${d === 13 ? 'active' : ''}" style="flex: 1; text-align: center; padding: 0.5rem; border: 1px solid ${d === 13 ? 'var(--primary)' : 'var(--border)'}; border-radius: var(--radius-md); background: ${d === 13 ? 'var(--primary-light)' : 'transparent'};">
                                <div style="font-size: 0.6rem; color: var(--text-light);">MON</div>
                                <div style="font-weight: 600; font-size: 0.875rem;">${d}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; padding: 0.75rem; background: var(--primary-light); border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--primary);">10:00 Sprint Standup</div>
                    </div>
                </div>

                <!-- AI Async Summary Card -->
                <div class="card" style="background: var(--primary-light); border-color: #dbeafe;">
                    <div class="card-header">
                        <h3 class="card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AI async summary</h3>
                    </div>
                    <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Team mostly on track. 1 blocker(s) and 2 missing check-in(s).</p>
                    <div style="display: flex; gap: 1rem; text-align: center;">
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success);">3</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Submitted</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning);">2</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Missing</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">1</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Blockers</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <button class="action-btn" style="flex: 1; justify-content: center;">View Updates</button>
                        <button class="primary-btn" style="flex: 1; justify-content: center; font-size: 0.8125rem;">Send Reminder</button>
                    </div>
                </div>

                <!-- Upcoming Meeting Card -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Upcoming meeting</h3>
                    </div>
                    <div class="meeting-details">
                        <h4 style="font-size: 1rem;">Sprint Standup</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0;">2026-05-13 • 10:00</p>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin: 0.5rem 0;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span>Online</span>
                        </div>
                        <p style="font-size: 0.875rem; margin-top: 1rem;">Daily sync, surface blockers</p>
                    </div>
                    <button class="action-btn" style="width: 100%; margin-top: 1rem; justify-content: center;">View Details</button>
                </div>

                <!-- Daily Reminders -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily reminders</h3>
                    </div>
                    <ul style="list-style: none;">
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                ${this.getBadgeHTML('resolved', 'Resolved')}
                                <span>Submit daily check-in</span>
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Open</span>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                ${this.getBadgeHTML('resolved', 'Resolved')}
                                <span>Complete availability survey</span>
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Open</span>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                <span class="badge" style="background: var(--warning-light); color: var(--warning);">Due Soon</span>
                                <span>Sprint meeting at 2:00 PM</span>
                            </div>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                <span class="badge" style="background: var(--primary-light); color: var(--primary);">AI Review Needed</span>
                                <span>Review AI suggested tasks</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Urgent Issues -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Urgent issues</h3>
                        <a href="#issues" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">View all ></a>
                    </div>
                    <ul style="list-style: none;">
                        ${urgentIssues.map(issue => `
                            <li style="margin-bottom: 1rem;">
                                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                    ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                                    <div>
                                        <div style="font-size: 0.8125rem; font-weight: 600;">${issue.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${issue.tags[0]}</div>
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
}
