import { BaseView } from './BaseView.js';
import { getMyReportToday, getCheckInStats } from '../utils/teamStats.js';
import { todayISO } from '../utils/dates.js';

export class DashboardView extends BaseView {
  render() {
    const activeSprint = this.store.getActiveSprint();
    const sprintTasks = this.store.getTasksBySprint(activeSprint?.id ?? 2);
    const issues = this.store.getIssues();
    const urgentIssues = issues.filter((i) =>
      (i.severity === 'critical' || i.severity === 'high') && i.status !== 'resolved',
    );
    const reports = this.store.getReports();
    const users = this.store.getUsers();
    const stats = getCheckInStats(reports, users);
    const myReport = getMyReportToday(this.store);
    const latestAi = this.store.getAiLogs()[0];
    const meetings = this.store.getMeetings().filter((m) => m.sprintId === activeSprint?.id);
    const nextMeeting = meetings[0];
    const doneTasks = sprintTasks.filter((t) => t.status === 'resolved' || t.status === 'done').length;
    const progress = sprintTasks.length
      ? Math.round((doneTasks / sprintTasks.length) * 100)
      : 0;

    return `
            <div class="view-header">
                <h1 class="view-title">Dashboard</h1>
                <p class="view-subtitle">Real-time overview of ${activeSprint?.name || 'Sprint'} ${this.store.dataModeLabel}</p>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">Current Sprint</h3>
                        <span class="badge badge-medium">${urgentIssues.length ? 'Risk: Elevated' : 'On track'}</span>
                    </div>
                    <div class="sprint-info" style="margin-bottom: 1.5rem;">
                        <h2 style="font-size: 1.5rem;">${activeSprint?.name || '—'} • ${activeSprint?.start || ''} – ${activeSprint?.end || ''}</h2>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">${sprintTasks.length} tasks • ${issues.filter((i) => i.status !== 'resolved').length} open issues</p>
                    </div>
                    <div class="progress-bar-container" style="background: var(--border); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary); width: ${progress}%; height: 100%;"></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        Progress ${progress}%
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily check-in</h3>
                    </div>
                    <div style="text-align: center; padding: 1rem 0;">
                        ${myReport
                          ? `<div class="badge badge-resolved" style="padding: 0.5rem 1rem; font-size: 0.875rem;">● Checked In</div>
                             <p style="margin-top: 1rem; font-size: 0.875rem;">${myReport.status} • Mood: <strong>${myReport.mood}</strong></p>
                             <p style="color: var(--text-muted); font-size: 0.75rem;">${myReport.progress}</p>`
                          : `<div class="badge" style="padding: 0.5rem 1rem; background: var(--warning-light); color: var(--warning);">Not submitted today</div>
                             <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted);">Use Quick actions → Daily Check-In</p>`}
                    </div>
                    <button type="button" class="action-btn" id="dashboard-edit-checkin" style="width: 100%; margin-top: 1rem; justify-content: center;">
                      ${myReport ? 'Edit Check-In' : 'Submit Check-In'}
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">This week</h3>
                        <a href="#calendar" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">Open calendar ></a>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-muted);">${meetings.length} meeting(s) this sprint</p>
                    ${nextMeeting
                      ? `<div style="margin-top: 1rem; padding: 0.75rem; background: var(--primary-light); border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
                           <div style="font-size: 0.75rem; font-weight: 600; color: var(--primary);">${nextMeeting.time} ${nextMeeting.title}</div>
                           <div style="font-size: 0.7rem; color: var(--text-muted);">${nextMeeting.date} • ${nextMeeting.format}</div>
                         </div>`
                      : ''}
                </div>

                <div class="card" style="background: var(--primary-light); border-color: #dbeafe;">
                    <div class="card-header">
                        <h3 class="card-title">AI async summary</h3>
                    </div>
                    <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">${latestAi?.content || 'No AI summary yet — use header “AI Team Summary”.'}</p>
                    <div style="display: flex; gap: 1rem; text-align: center;">
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success);">${stats.submitted}</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Submitted</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning);">${stats.missing}</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Missing</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">${stats.blockers}</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Blockers</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <a href="#ai-log" class="action-btn" style="flex: 1; justify-content: center; text-decoration: none;">View AI Log</a>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Upcoming meeting</h3>
                    </div>
                    ${nextMeeting
                      ? `<div class="meeting-details">
                           <h4 style="font-size: 1rem;">${nextMeeting.title}</h4>
                           <p style="font-size: 0.75rem; color: var(--text-muted);">${nextMeeting.date} • ${nextMeeting.time}</p>
                           <p style="font-size: 0.875rem; margin-top: 1rem;">${nextMeeting.goal || ''}</p>
                           ${nextMeeting.zoomLink ? `<a href="${nextMeeting.zoomLink}" target="_blank" rel="noopener" style="font-size: 0.75rem;">Zoom link</a>` : ''}
                         </div>`
                      : '<p style="font-size: 0.875rem; color: var(--text-muted);">No meetings in active sprint.</p>'}
                    <a href="#calendar" class="action-btn" style="width: 100%; margin-top: 1rem; justify-content: center; text-decoration: none;">View Calendar</a>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Urgent issues</h3>
                        <a href="#issues" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">View all ></a>
                    </div>
                    <ul style="list-style: none;">
                        ${urgentIssues.length
                          ? urgentIssues.slice(0, 5).map((issue) => `
                            <li style="margin-bottom: 1rem;">
                                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                    ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                                    <div>
                                        <div style="font-size: 0.8125rem; font-weight: 600;">${issue.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${(issue.tags || [])[0] || issue.status}</div>
                                    </div>
                                </div>
                            </li>`).join('')
                          : '<li style="color: var(--text-muted); font-size: 0.875rem;">No urgent open issues.</li>'}
                    </ul>
                </div>
            </div>
        `;
  }

  mount(container) {
    const btn = container.querySelector('#dashboard-edit-checkin');
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('btn-daily-checkin')?.click();
      });
    }
  }
}
