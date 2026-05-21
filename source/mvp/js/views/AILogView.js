import { BaseView } from './BaseView.js';

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

  renderDetail(log) {
    if (!log) {
      return '<p style="font-size: 0.875rem; color: var(--text-muted);">Select a log entry to view details.</p>';
    }
    const ts = (log.timestamp || '').replace('T', ' ').substring(0, 19);
    const details = log.details || {};
    return `
      <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">${log.title}</h3>
      ${this.getBadgeHTML(log.status, (log.status || 'pending').toUpperCase())}
      <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem;">${log.content}</p>
      <div style="margin-top: 1.5rem;">
        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Type</div>
        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">${log.type || '—'}</div>

        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Timestamp</div>
        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">${ts}</div>

        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Input source</div>
        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">${details.input || details.reportCount != null ? `${details.reportCount ?? '—'} check-ins` : '—'}</div>

        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Reviewer</div>
        <div style="font-size: 0.8125rem;">${details.reviewer || '—'}</div>
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

      <div class="ai-log-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
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
  }
}
