/**
 * Keep header sprint badge and selector in sync with store.
 * @module services/headerSync
 */

/**
 * @param {import('../core/store.js').Store} store
 */
export function syncHeaderFromStore(store) {
  const sprint = store.getSelectedSprint();
  const badge = document.getElementById('header-sprint-badge');
  if (badge && sprint) {
    badge.innerHTML = `<span class="dot"></span> ${sprint.name}: ${sprint.start} – ${sprint.end}`;
  }
  const select = document.getElementById('header-sprint-select');
  if (select && store.getState().sprints?.length) {
    const current = store.getSelectedSprint()?.id ?? '';
    select.innerHTML = store.getState().sprints.map((s) => `
      <option value="${s.id}" ${Number(s.id) === Number(current) ? 'selected' : ''}>${s.name} (${s.status})</option>
    `).join('');
  }
}
