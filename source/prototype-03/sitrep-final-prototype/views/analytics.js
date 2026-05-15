/**
 * analytics.js - Analytics View Component
 */
import { store } from '../store.js';

class ViewAnalytics extends HTMLElement {
    connectedCallback() {
        store.subscribe(() => this.render());
    }

    render() {
        this.innerHTML = `
            <div class="view-header flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h1 style="color: var(--accent);">Analytics</h1>
                    <p class="text-secondary">Deep dive into team performance and sprint metrics</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline">History</button>
                    <button class="btn btn-primary" style="background: var(--accent);"><i data-lucide="share-2"></i> Share</button>
                    <button class="btn btn-outline"><i data-lucide="more-vertical"></i></button>
                </div>
            </div>

            <div class="flex gap-4" style="margin-bottom: 2rem;">
                ${this.renderMetricCard('SPRINT PROGRESS', '84%', 'On track for Sprint 42', 'var(--accent)')}
                ${this.renderMetricCard('TEAM MOOD', '4.2 🙂', 'Avg. Daily Check-in', 'var(--status-review)')}
                ${this.renderMetricCard('OPEN BLOCKERS', '7', '+2 since yesterday', 'var(--status-blocked)')}
                ${this.renderMetricCard('AI EFFICIENCY', '1.4x', 'Time saved / PR', 'var(--status-progress)')}
            </div>

            <div class="bento-grid">
                <bento-card colspan="8" title="Sprint Velocity" subtitle="Projected vs Actual burn-down">
                    <canvas id="velocityChart" style="max-height: 250px;"></canvas>
                </bento-card>

                <bento-card colspan="4" title="Potential Risks">
                    <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                        ${this.renderRisk('High Blocker Count in Frontend', '3 blockers pending for >48h in Repo \'Core-UI\'.', 'var(--status-blocked)')}
                        ${this.renderRisk('Unbalanced Sprint Load', 'Senior Devs are over capacity (120%).', 'var(--status-review)')}
                        ${this.renderRisk('Documentation Gap', 'Sprint velocity dropping due to lack of spec files.', 'var(--status-progress)')}
                        <div style="text-align: center; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; font-weight: 600;">View Detailed Report →</div>
                    </div>
                </bento-card>

                <bento-card colspan="4" title="Blocker Frequency">
                    <canvas id="blockerFreqChart" style="max-height: 150px;"></canvas>
                </bento-card>

                <bento-card colspan="4" title="Team Mood Trends">
                    <canvas id="moodTrendChart" style="max-height: 150px;"></canvas>
                </bento-card>

                <bento-card colspan="4" title="AI Agent Efficiency">
                    <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem;">
                        ${this.renderEfficiencyBar('Auto-Refactoring Agent', 92)}
                        ${this.renderEfficiencyBar('Documentation Bot', 78)}
                        ${this.renderEfficiencyBar('Testing Assistant', 85)}
                    </div>
                </bento-card>

                <bento-card colspan="12" title="Top Contributors & Health">
                    <div class="flex gap-4" style="margin-top: 1rem;">
                        ${this.renderContributor('Elena Rodriguez', '12 Tickets Closed', 'Optimal', 'var(--status-done)')}
                        ${this.renderContributor('Marcus Chen', '8 Tasks / 2 Blocked', 'Stressed', 'var(--status-review)')}
                        ${this.renderContributor('Sarah Connor', '15 Commit Avg.', 'High', 'var(--status-progress)')}
                    </div>
                </bento-card>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        this.initCharts();
    }

    renderMetricCard(label, value, subtext, color) {
        return `
            <div class="card" style="flex: 1; padding: 1rem;">
                <div style="font-size: 0.625rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 700;">${label}</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: ${color}; line-height: 1;">${value}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${subtext}</div>
            </div>
        `;
    }

    renderRisk(title, desc, color) {
        return `
            <div style="background: ${color}11; border: 1px solid ${color}33; border-radius: var(--radius-md); padding: 0.75rem;">
                <div style="font-size: 0.875rem; font-weight: 700; color: ${color}; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${desc}</div>
            </div>
        `;
    }

    renderEfficiencyBar(label, percent) {
        return `
            <div>
                <div class="flex justify-between" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
                    <span>${label}</span>
                    <span style="font-weight: 700;">${percent}%</span>
                </div>
                <div style="height: 6px; background: #27272A; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: var(--status-progress);"></div>
                </div>
            </div>
        `;
    }

    renderContributor(name, stat, health, color) {
        return `
            <div style="flex: 1; background: #111112; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; display: flex; items-center gap-4;">
                <div style="width: 40px; height: 40px; background: #27272A; border-radius: 8px;"></div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 0.875rem;">${name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${stat}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.625rem; color: var(--text-secondary);">Health</div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: ${color};">${health}</div>
                </div>
            </div>
        `;
    }

    initCharts() {
        setTimeout(() => {
            if (!window.Chart) return;

            // Velocity Chart
            new Chart(document.getElementById('velocityChart'), {
                type: 'line',
                data: {
                    labels: ['Day 1', 'Day 4', 'Day 7', 'Day 10', 'Day 14'],
                    datasets: [{
                        data: [100, 85, 75, 60, 40],
                        borderColor: '#A855F7',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(168, 85, 247, 0.1)'
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { display: false } }
                }
            });

            // Blocker Freq
            new Chart(document.getElementById('blockerFreqChart'), {
                type: 'bar',
                data: {
                    labels: ['API', 'FE', 'BE', 'OPS', 'QA'],
                    datasets: [{
                        data: [12, 18, 8, 6, 11],
                        backgroundColor: (c) => c.dataIndex === 1 ? '#A855F7' : '#3F3F46',
                        borderRadius: 4
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { display: false } }
                }
            });

            // Mood Trend
            new Chart(document.getElementById('moodTrendChart'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{
                        data: [3.5, 4.2, 3.8, 4.5, 4.0],
                        borderColor: '#EAB308',
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { display: false } }
                }
            });
        }, 0);
    }
}

customElements.define('view-analytics', ViewAnalytics);
