/**
 * dashboard.js - Dashboard View Component
 */
import { store } from '../store.js';

class ViewDashboard extends HTMLElement {
    connectedCallback() {
        store.subscribe(() => this.render());
    }

    render() {
        const { sprint, team } = store.state;

        this.innerHTML = `
            <div class="dashboard-header flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h1>SE SitRep Dashboard</h1>
                    <p class="text-secondary">Today's team status, sprint progress, blockers, and meetings</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline"><i data-lucide="share-2"></i> Share</button>
                    <button class="btn btn-outline"><i data-lucide="download"></i> Export Report</button>
                    <button class="btn btn-primary btn-new-update"><i data-lucide="plus"></i> New Update</button>
                </div>
            </div>

            <div class="status-bar flex gap-4" style="margin-bottom: 2rem;">
                <div class="badge" style="background: rgba(234, 179, 8, 0.1); color: var(--status-review); border: 1px solid rgba(234, 179, 8, 0.2); display: flex; items-center gap-2; padding: 6px 12px;">
                    <i data-lucide="calendar" style="width: 14px;"></i> Sunday, May 24
                </div>
                <div class="badge" style="background: rgba(34, 197, 94, 0.1); color: var(--status-done); border: 1px solid rgba(34, 197, 94, 0.2); display: flex; items-center gap-2; padding: 6px 12px;">
                    <i data-lucide="users" style="width: 14px;"></i> Stand-up: Ongoing
                </div>
            </div>

            <div class="bento-grid">
                <!-- Sprint Progress -->
                <bento-card colspan="8" title="${sprint.name}" subtitle="Active: May 18 — June 01 (${sprint.daysRemaining} days remaining)">
                    <div class="flex justify-between items-end" style="margin-top: 1rem;">
                        <div style="flex: 1; margin-right: 2rem;">
                            <div style="height: 12px; background: #27272A; border-radius: 6px; overflow: hidden; margin-bottom: 1.5rem;">
                                <div style="width: ${sprint.completion}%; height: 100%; background: var(--accent);"></div>
                            </div>
                            <div class="flex justify-between">
                                ${this.renderStat('DONE', sprint.stats.done, 'var(--status-progress)')}
                                ${this.renderStat('IN PROGRESS', sprint.stats.inProgress, 'var(--text-secondary)')}
                                ${this.renderStat('BLOCKERS', sprint.stats.blockers, 'var(--status-blocked)')}
                                ${this.renderStat('CHECK-INS', sprint.stats.checkins + '/22', 'var(--text-secondary)')}
                                ${this.renderStat('DEADLINE', 'June 08', 'var(--text-secondary)')}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2.5rem; font-weight: 800; line-height: 1;">${sprint.completion}%</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Completed</div>
                        </div>
                    </div>
                </bento-card>

                <!-- Team Calendar -->
                <bento-card colspan="4" title="Team Calendar" subtitle="Week 7">
                    <div style="font-size: 0.875rem; margin-top: 1rem;">
                        <div class="flex justify-between text-muted" style="margin-bottom: 0.5rem; font-weight: 600;">
                            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span style="color: var(--accent);">S</span>
                        </div>
                        <div class="flex justify-between" style="margin-bottom: 1.5rem;">
                            <span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><span style="background: var(--accent); color: white; border-radius: 4px; padding: 0 4px;">24</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div class="flex gap-4">
                                <div style="width: 4px; background: var(--status-review); border-radius: 2px;"></div>
                                <div>
                                    <div style="font-weight: 600;">Daily Stand-up</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">10:00 AM • General Voice</div>
                                </div>
                            </div>
                            <div class="flex gap-4">
                                <div style="width: 4px; background: var(--accent); border-radius: 2px;"></div>
                                <div>
                                    <div style="font-weight: 600;">TA Meeting</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">03:00 PM • Room 402 / Zoom</div>
                                </div>
                                <div class="badge" style="background: var(--accent-muted); color: var(--accent); font-size: 0.625rem; align-self: center; margin-left: auto;">TODAY</div>
                            </div>
                        </div>
                    </div>
                </bento-card>

                <!-- Team SitRep Table -->
                <bento-card colspan="8" title="Team SitRep">
                    <div style="width: 100%; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                            <thead>
                                <tr style="text-align: left; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border);">
                                    <th style="padding: 1rem 0;">Person</th>
                                    <th style="padding: 1rem 0;">Today's Focus</th>
                                    <th style="padding: 1rem 0;">Status</th>
                                    <th style="padding: 1rem 0;">Blockers</th>
                                    <th style="padding: 1rem 0;">Mood</th>
                                    <th style="padding: 1rem 0;">Coverage</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${team.map(member => `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 0.875rem;">
                                        <td style="padding: 1rem 0;">
                                            <div class="flex items-center gap-3">
                                                <div style="width: 32px; height: 32px; background: #27272A; border-radius: 50%; display: grid; place-items: center; overflow: hidden;">
                                                    ${member.isAI ? `<i data-lucide="sparkles" style="width: 16px; color: var(--accent);"></i>` : `<i data-lucide="user" style="width: 16px;"></i>`}
                                                </div>
                                                <div>
                                                    <div style="font-weight: 600;">${member.name}</div>
                                                    ${member.isAI ? `<span style="font-size: 0.625rem; background: var(--accent-muted); color: var(--accent); padding: 0 4px; border-radius: 2px;">AI AGENT</span>` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding: 1rem 0; color: var(--text-secondary); max-width: 200px;">${member.focus}</td>
                                        <td style="padding: 1rem 0;">
                                            <status-badge status="${member.status}" label="${member.status}"></status-badge>
                                        </td>
                                        <td style="padding: 1rem 0;">${member.blockers || '—'}</td>
                                        <td style="padding: 1rem 0; font-size: 1.25rem;">${member.mood}</td>
                                        <td style="padding: 1rem 0; font-weight: 600;">${member.coverage}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </bento-card>

                <!-- Sidebar Widgets -->
                <div style="grid-column: span 4; display: flex; flex-direction: column; gap: 1.5rem;">
                    <bento-card title="Final Project Deadline" colspan="12">
                        <div style="margin-top: 0.5rem;">
                            <div style="font-size: 1.5rem; font-weight: 700;">Week 10</div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">June 15, 2024</div>
                            <div style="height: 6px; background: #27272A; border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem;">
                                <div style="width: 80%; height: 100%; background: var(--status-blocked); opacity: 0.6;"></div>
                            </div>
                            <div style="font-size: 0.75rem; text-align: right; color: var(--status-blocked);">21d left</div>
                        </div>
                    </bento-card>

                    <bento-card title="Active Blockers" colspan="12">
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <div class="flex gap-3">
                                <i data-lucide="alert-triangle" style="color: var(--status-blocked); width: 18px;"></i>
                                <div>
                                    <div style="font-weight: 600; font-size: 0.875rem;">SQL Injection Flaw in Auth</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Assigned to: Marcus J.</div>
                                    <div style="font-size: 0.75rem; color: var(--accent); margin-top: 0.25rem; cursor: pointer; font-weight: 600;">Resolve Blocker →</div>
                                </div>
                            </div>
                        </div>
                    </bento-card>

                    <bento-card title="Daily SitRep Summary" colspan="12">
                        <div style="background: var(--bg-dark); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.5rem; font-size: 0.75rem; line-height: 1.6;">
                            <div class="flex items-center gap-2" style="color: var(--accent); font-weight: 700; margin-bottom: 0.5rem;">
                                <i data-lucide="sparkles" style="width: 14px;"></i> AI SUMMARY
                            </div>
                            The team is focused on <span style="color: var(--accent);">Auth & Bento Grid</span> today. Velocity is steady at <span style="color: var(--status-done);">42pts</span>. 1 major blocker identified in Auth module.
                        </div>
                        <div class="flex gap-2" style="margin-top: 1rem;">
                            <button class="btn btn-primary" style="font-size: 0.625rem; flex: 1; justify-content: center;">
                                <i data-lucide="wand-2" style="width: 12px;"></i> Generate SitRep
                            </button>
                            <button class="btn btn-outline" style="font-size: 0.625rem; flex: 1; justify-content: center;">
                                <i data-lucide="github" style="width: 12px;"></i> Copy to GitHub
                            </button>
                        </div>
                    </bento-card>
                </div>
            </div>
        `;

        const btn = this.querySelector('.btn-new-update');
        if (btn) btn.onclick = () => document.getElementById('global-modal').show();

        if (window.lucide) window.lucide.createIcons();
    }

    renderStat(label, value, color) {
        return `
            <div style="text-align: center;">
                <div style="font-size: 0.625rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${label}</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: ${color};">${value}</div>
            </div>
        `;
    }
}

customElements.define('view-dashboard', ViewDashboard);
