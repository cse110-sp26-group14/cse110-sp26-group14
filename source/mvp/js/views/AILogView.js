/**
 * AI action log with search, filters, and approve flow for pending suggestions.
 * @module views/AILogView
 */

import { BaseView } from './BaseView.js';
import { escapeHtml } from '../utils/templateEngine.js';
import { updateAiLogStatusRemote } from '../services/dataSyncService.js';

export class AILogView extends BaseView {
  constructor(store) {
    super(store);
    this.searchQuery = '';
    this.typeFilter = 'All';
    const logs = store.getAiLogs();
    this.selectedLogId = logs[0]?.id ?? null;
  }

  getFilteredLogs() {
    let logs = this.store.getAiLogs();
    if (this.typeFilter !== 'All') {
      logs = logs.filter((l) => l.type === this.typeFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      logs = logs.filter(
        (l) =>
          l.title?.toLowerCase().includes(q)
          || l.content?.toLowerCase().includes(q),
      );
    }
    return logs;
  }

  renderSuggestionDetails(details) {
    const parseFailed = Boolean(details.parseFailed);
    const suggestions = details.suggestions || [];
    const preview = details.modelResponsePreview || '';
    const source = details.source || (parseFailed ? 'fallback' : '—');

    return `
      <div class="ai-log-detail-block">
        <div class="ai-log-detail-label">AI source</div>
        <div class="ai-log-detail-value">${escapeHtml(source)}</div>

        ${parseFailed
          ? `<div class="ai-log-parse-warning">
              <strong>Parse failed</strong>
              <p>Model output could not be parsed as JSON. Fallback tasks were shown instead.</p>
              ${details.parseError ? `<p class="ai-log-parse-error">Error: ${escapeHtml(details.parseError)}</p>` : ''}
            </div>`
          : '<p class="ai-log-parse-ok">Model JSON parsed successfully.</p>'}

        <div class="ai-log-detail-label">Sprint goals (input)</div>
        <div class="ai-log-detail-value ai-log-detail-pre">${escapeHtml(details.input || '—')}</div>

        <div class="ai-log-detail-label">Suggested tasks (${suggestions.length})</div>
        <ul class="ai-log-suggestion-list">
          ${suggestions.length
            ? suggestions.map((s) => `
              <li>
                <strong>${escapeHtml(s.title || '—')}</strong>
                <span>${escapeHtml(s.priority || 'medium')} · due ${escapeHtml(s.due || '—')} · ${escapeHtml(s.owner || 'Unassigned')}</span>
              </li>
            `).join('')
            : '<li class="empty-hint">No suggestions recorded.</li>'}
        </ul>

        ${preview
          ? `<details class="ai-log-raw-details">
              <summary>Model response preview</summary>
              <pre class="ai-log-raw-pre">${escapeHtml(preview)}</pre>
            </details>`
          : ''}
      </div>
    `;
  }

  renderDetail(log) {
    if (!log) {
      return '<p style="font-size: 0.875rem; color: var(--text-muted);">Select a log entry to view details.</p>';
    }
    const ts = (log.timestamp || '').replace('T', ' ').substring(0, 19);
    const details = log.details || {};
    const suggestionBlock = log.type === 'Suggestion' || details.suggestions?.length
      ? this.renderSuggestionDetails(details)
      : '';

    return `
      <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">${escapeHtml(log.title)}</h3>
      ${this.getBadgeHTML(log.status, (log.status || 'pending').toUpperCase())}
      <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem;">${escapeHtml(log.content)}</p>
      <div style="margin-top: 1.5rem;">
        <div class="ai-log-detail-label">Type</div>
        <div class="ai-log-detail-value">${escapeHtml(log.type || '—')}</div>

        <div class="ai-log-detail-label">Timestamp</div>
        <div class="ai-log-detail-value">${escapeHtml(ts)}</div>

        <div class="ai-log-detail-label">Input source</div>
        <div class="ai-log-detail-value">${details.input
          ? escapeHtml(String(details.input))
          : details.reportCount != null
            ? `${details.reportCount ?? '—'} check-ins`
            : '—'}</div>

        <div class="ai-log-detail-label">Reviewer</div>
        <div class="ai-log-detail-value">${escapeHtml(details.reviewer || '—')}</div>

        ${suggestionBlock}

        ${log.status === 'pending' && log.type === 'Suggestion'
          ? `<button type="button" class="primary-btn" id="ailog-approve-btn" data-log-id="${log.id}" style="margin-top: 1.5rem; width: 100%;">Mark as reviewed</button>`
          : ''}
      </div>
    `;
  }

  render() {
    const logs = this.getFilteredLogs();
    const types = ['All', ...new Set(this.store.getAiLogs().map((l) => l.type).filter(Boolean))];
    const selected = logs.find((l) => l.id === this.selectedLogId)
      || this.store.getAiLogs().find((l) => l.id === this.selectedLogId)
      || logs[0];

    return `
      <div class="view-header">
        <h1 class="view-title">AI Log</h1>
        <p class="view-subtitle">Transparent record of every AI action and team notes.</p>
      </div>

      <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div class="search-box" style="flex: 1; min-width: 200px; border: 1px solid var(--border);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="ailog-search" placeholder="Search logs..." value="${this.searchQuery.replace(/"/g, '&quot;')}" />
        </div>
        <select class="dropdown-toggle" id="ailog-type-filter">
          ${types.map((t) => `<option value="${t}" ${t === this.typeFilter ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>

      <div class="ai-log-layout">
        <div class="log-list" style="display: flex; flex-direction: column; gap: 1rem;">
          ${logs.length === 0 ? '<p class="empty-hint">No log entries match your filters.</p>' : ''}
          ${logs.map((log) => `
            <button type="button" class="card ai-log-card ${log.id === selected?.id ? 'ai-log-card-active' : ''}" data-log-id="${log.id}" style="cursor: pointer; text-align: left; width: 100%; border: 1px solid ${log.id === selected?.id ? 'var(--primary)' : 'var(--border)'};">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="background: var(--primary-light); color: var(--primary); padding: 0.5rem; border-radius: 8px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h4 style="font-weight: 600;">${log.title}</h4>
                    ${this.getBadgeHTML(log.status, (log.status || '').toUpperCase())}
                    <span class="badge badge-muted">${log.type || 'Log'}</span>
                  </div>
                  <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0.25rem 0;">${log.content}</p>
                  <div style="font-size: 0.7rem; color: var(--text-light);">${(log.timestamp || '').replace('T', ' ').substring(0, 19)}</div>
                </div>
              </div>
            </button>
          `).join('')}
        </div>

        <div class="card" id="log-detail">
          ${this.renderDetail(selected)}
        </div>
      </div>
    `;
  }

  mount(container) {
    const rerender = () => {
      container.innerHTML = this.render();
      this.mount(container);
    };

    container.querySelector('#ailog-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      rerender();
    });

    container.querySelector('#ailog-type-filter')?.addEventListener('change', (e) => {
      this.typeFilter = e.target.value;
      rerender();
    });

    container.querySelectorAll('[data-log-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedLogId = Number(btn.dataset.logId);
        rerender();
      });
    });

    container.querySelector('#ailog-approve-btn')?.addEventListener('click', async () => {
      const id = Number(container.querySelector('#ailog-approve-btn')?.dataset.logId);
      if (!id) return;
      await updateAiLogStatusRemote(this.store, id, 'approved');
      rerender();
    });
  }
}
