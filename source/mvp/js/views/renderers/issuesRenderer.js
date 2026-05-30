/**
 * Issues / reports / activity HTML builders using templates.
 * @module views/renderers/issuesRenderer
 */

import { escapeHtml, renderTemplate } from '../../utils/templateEngine.js';

/**
 * @param {{ id: string, label: string, active: boolean }} tab
 * @returns {string}
 */
export function renderTabButton(tab) {
  const active = tab.active ? 'filter-chip-active' : '';
  return `<button type="button" class="badge filter-chip ${active}" data-panel="${tab.id}">${tab.label}</button>`;
}

/**
 * @param {object} report
 * @param {string} userName
 * @param {function(string, string): string} badgeFn
 * @returns {string}
 */
export function renderReportCard(report, userName, badgeFn) {
  const badges = `${badgeFn(report.status, report.status)}<span class="badge badge-muted">${report.mood}</span>`;
  const blockers = report.blockers && report.blockers !== 'None'
    ? `<p class="issue-description issue-description-danger">Blockers: ${escapeHtml(report.blockers)}</p>`
    : '';
  const notes = report.notes
    ? `<p class="issue-description">Notes: ${escapeHtml(report.notes)}</p>`
    : '';

  return renderTemplate('tpl-report-card', {
    title: `${userName} — ${report.date}`,
    badges,
    progress: report.progress || '',
    blockers,
    notes,
  }, { raw: ['badges', 'blockers', 'notes'] });
}

/**
 * @param {object} item
 * @returns {string}
 */
export function renderActivityCard(item) {
  return renderTemplate('tpl-activity-card', {
    kind: item.kind,
    time: (item.ts || '').replace('T', ' ').slice(0, 16),
    title: item.title,
    body: item.body,
    meta: item.meta,
  });
}

/**
 * @param {object} task
 * @param {function(string, string): string} badgeFn
 * @returns {string}
 */
export function renderTaskCard(task, badgeFn) {
  const aiTag = (task.tags || []).includes('AI Suggested') || task.source === 'ai'
    ? '<span class="badge badge-muted">AI Suggested</span>'
    : '';
  const badges = `${badgeFn(task.priority, (task.priority || 'medium').toUpperCase())}
    ${badgeFn(task.status, (task.status || 'open').toUpperCase())}${aiTag}`;
  return `
    <div class="card issue-card task-card">
      <div class="issue-card-header">
        <div class="issue-card-title-row">
          <h3 class="issue-title">${escapeHtml(task.title)}</h3>
          ${badges}
        </div>
      </div>
      <div class="issue-meta">
        <span>Owner ${escapeHtml(task.owner || 'Unassigned')}</span>
        <span>Sprint ${task.sprintId}</span>
        <span>Due ${escapeHtml(task.due || '—')}</span>
      </div>
    </div>
  `;
}
