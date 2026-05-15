/**
 * checkins.js - Daily Check-ins View Component
 */
import { store } from '../store.js';

class ViewCheckins extends HTMLElement {
    connectedCallback() {
        store.subscribe(() => this.render());
    }

    render() {
        const { checkins } = store.state;

        this.innerHTML = `
            <div class="view-header flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h1 style="color: var(--accent);">Daily Check-ins</h1>
                    <p class="text-secondary">Track team focus, mood, and hurdles across the sprint</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary btn-new-checkin"><i data-lucide="plus"></i> New Check-in</button>
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex;">
                        <button class="btn" style="background: var(--border); color: white;">Table</button>
                        <button class="btn" style="color: var(--text-secondary);">Timeline</button>
                    </div>
                </div>
            </div>

            <!-- Filters Bar -->
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                <div class="flex gap-4">
                    <div style="position: relative;">
                        <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--text-muted);"></i>
                        <input type="text" placeholder="Search check-ins..." style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.5rem 1rem 0.5rem 2.5rem; color: white; width: 280px;">
                    </div>
                    <button class="btn btn-outline"><i data-lucide="users"></i> Team: Engineering <i data-lucide="chevron-down"></i></button>
                    <button class="btn btn-outline"><i data-lucide="calendar"></i> Oct 23 - Oct 29 <i data-lucide="chevron-down"></i></button>
                </div>
                <button class="btn btn-outline"><i data-lucide="filter"></i></button>
            </div>

            <!-- Check-ins Feed -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="card" style="padding: 0;">
                    <div style="padding: 1rem 1.5rem; background: rgba(168, 85, 247, 0.05); border-bottom: 1px solid var(--border); display: flex; justify-between items-center;">
                        <div class="flex items-center gap-2">
                            <i data-lucide="chevron-down" style="width: 16px;"></i>
                            <span style="font-weight: 600;">Today, October 26</span>
                            <span style="font-size: 0.625rem; background: var(--border); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary);">8 CHECK-INS</span>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #111112; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">
                            <tr>
                                <th style="padding: 0.75rem 1.5rem; text-align: left;">Person</th>
                                <th style="padding: 0.75rem 1.5rem; text-align: left;">Focus</th>
                                <th style="padding: 0.75rem 1.5rem; text-align: left;">Status</th>
                                <th style="padding: 0.75rem 1.5rem; text-align: left;">Mood</th>
                                <th style="padding: 0.75rem 1.5rem; text-align: left;">Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderRow('Sarah Jenkins', 'Refactoring Auth Middleware & JWT Logic', 'ON TRACK', '🙂', '—')}
                            ${this.renderRow('Marcus Thorne', 'Resolving P0 latency issues in Production', 'BLOCKED', '😫', 'QA NEEDED')}
                            ${this.renderRow('Alex Kim', 'Design System migration - Icons & Colors', 'DONE', '😎', '—')}
                        </tbody>
                    </table>
                </div>

                <div class="card" style="padding: 1rem 1.5rem; color: var(--text-secondary); display: flex; justify-between items-center;">
                    <div class="flex items-center gap-2">
                        <i data-lucide="chevron-right" style="width: 16px;"></i>
                        <span style="font-weight: 600;">Wednesday, October 25</span>
                        <span style="font-size: 0.625rem; background: var(--border); padding: 2px 6px; border-radius: 4px;">12 CHECK-INS</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Stats -->
            <div class="bento-grid" style="margin-top: 2rem;">
                <bento-card title="Team Momentum" colspan="8">
                    <canvas id="momentumChart" style="max-height: 150px;"></canvas>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1rem;">Check-in velocity is up <span style="color: var(--status-done); font-weight: 700;">14%</span> compared to last sprint.</p>
                </bento-card>
                <bento-card title="Total Blocks" colspan="4">
                    <div style="font-size: 3rem; font-weight: 800; line-height: 1; margin: 0.5rem 0;">3</div>
                    <div style="color: var(--status-blocked); font-size: 0.875rem; display: flex; items-center gap-2;">
                        <i data-lucide="alert-circle" style="width: 16px;"></i> Critical attention required
                    </div>
                </bento-card>
            </div>
        `;

        const btn = this.querySelector('.btn-new-checkin');
        if (btn) btn.onclick = () => document.getElementById('global-modal').show();

        if (window.lucide) window.lucide.createIcons();
        this.initChart();
    }

    renderRow(name, focus, status, mood, coverage) {
        return `
            <tr style="border-bottom: 1px solid var(--border); font-size: 0.875rem;">
                <td style="padding: 1rem 1.5rem;">
                    <div class="flex items-center gap-3">
                        <div style="width: 28px; height: 28px; background: #27272A; border-radius: 50%; display: grid; place-items: center;"><i data-lucide="user" style="width: 14px;"></i></div>
                        <div style="font-weight: 600;">${name}</div>
                    </div>
                </td>
                <td style="padding: 1rem 1.5rem; color: var(--text-secondary);">
                    <span style="color: var(--accent); margin-right: 0.5rem;">•</span> ${focus}
                </td>
                <td style="padding: 1rem 1.5rem;">
                    <status-badge status="${status}" label="${status}"></status-badge>
                </td>
                <td style="padding: 1rem 1.5rem; font-size: 1.25rem;">${mood}</td>
                <td style="padding: 1rem 1.5rem;">
                    ${coverage !== '—' ? `<span style="background: rgba(234, 179, 8, 0.1); color: var(--status-review); border: 1px solid var(--status-review); padding: 2px 6px; border-radius: 4px; font-size: 0.625rem; font-weight: 700;">${coverage}</span>` : '—'}
                </td>
            </tr>
        `;
    }

    initChart() {
        setTimeout(() => {
            const ctx = document.getElementById('momentumChart');
            if (ctx && window.Chart) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['', '', '', '', '', ''],
                        datasets: [{
                            data: [4, 6, 5, 8, 6, 12],
                            backgroundColor: (context) => {
                                const index = context.dataIndex;
                                return index === 5 ? '#A855F7' : '#3F3F46';
                            },
                            borderRadius: 4
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { x: { display: false }, y: { display: false } }
                    }
                });
            }
        }, 0);
    }
}

customElements.define('view-checkins', ViewCheckins);
