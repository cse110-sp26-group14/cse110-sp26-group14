import { BaseView } from './BaseView.js';
import { useRemoteData } from '../config/appConfig.js';
import { showToast } from '../utils/toast.js';
import { updateProfileRemote, createSprintRemote } from '../services/dataSyncService.js';
import { syncHeaderFromStore } from '../services/headerSync.js';
import { appConfig } from '../config/appConfig.js';
import { escapeHtml } from '../utils/templateEngine.js';

export class SettingsView extends BaseView {
  renderSprintRows() {
    const sprints = [...(this.store.state.sprints || [])].sort(
      (a, b) => Number(a.id) - Number(b.id),
    );
    if (!sprints.length) {
      return '<p class="empty-hint">No sprints yet. Add one below.</p>';
    }
    return `
      <ul class="sprint-list">
        ${sprints.map((s) => `
          <li class="sprint-list-item">
            <div>
              <strong>${escapeHtml(s.name)}</strong>
              <span class="sprint-list-dates">${escapeHtml(s.start)} – ${escapeHtml(s.end)}</span>
            </div>
            ${this.getBadgeHTML(s.status, (s.status || 'planned').toUpperCase())}
          </li>
        `).join('')}
      </ul>
    `;
  }

  render() {
    const user = this.store.currentAuthUser;
    const mode = useRemoteData() ? `API (${appConfig.apiBaseUrl})` : 'Local storage';

    return `
            <div class="view-header">
                <h1 class="view-title">Settings</h1>
                <p class="view-subtitle">Profile and workspace. Data mode: ${mode}</p>
            </div>
            <div class="card" style="max-width: 480px;">
                <form id="settings-form" class="form-stack">
                  <div class="form-field">
                    <label for="settings-name">Display name</label>
                    <input id="settings-name" name="name" type="text" value="${escapeHtml(user?.name || '')}" required />
                  </div>
                  <div class="form-field">
                    <label for="settings-role">Role</label>
                    <input id="settings-role" name="role" type="text" value="${escapeHtml(user?.role || '')}" />
                  </div>
                  <div class="form-field">
                    <label>Email</label>
                    <input type="email" value="${escapeHtml(user?.email || '')}" disabled />
                  </div>
                  <p id="settings-msg" class="auth-error" role="status"></p>
                  <div class="form-actions">
                    <button type="submit" class="primary-btn">Save profile</button>
                  </div>
                </form>
            </div>

            <div class="card settings-sprints-card">
                <h3 class="card-title" style="margin-bottom: 0.75rem;">Sprints</h3>
                <p class="form-hint" style="margin-bottom: 1rem;">Add sprints for planning. Setting status to <strong>active</strong> deactivates other active sprints.</p>
                ${this.renderSprintRows()}
                <form id="sprint-add-form" class="form-stack" style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border);">
                  <div class="form-field">
                    <label for="sprint-add-name">Sprint name</label>
                    <input id="sprint-add-name" name="name" type="text" placeholder="Sprint 4" required />
                  </div>
                  <div class="form-field-row" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <div class="form-field" style="flex: 1; min-width: 140px;">
                      <label for="sprint-add-start">Start</label>
                      <input id="sprint-add-start" name="start" type="date" required />
                    </div>
                    <div class="form-field" style="flex: 1; min-width: 140px;">
                      <label for="sprint-add-end">End</label>
                      <input id="sprint-add-end" name="end" type="date" required />
                    </div>
                  </div>
                  <div class="form-field">
                    <label for="sprint-add-status">Status</label>
                    <select id="sprint-add-status" name="status" class="dropdown-toggle" style="width: 100%;">
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <p id="sprint-add-msg" class="auth-error" role="status"></p>
                  <div class="form-actions">
                    <button type="submit" class="primary-btn">Add sprint</button>
                  </div>
                </form>
            </div>

            <div class="card" style="max-width: 480px; margin-top: 1rem;">
                <p style="font-size: 0.875rem; color: var(--text-muted);">Clear cached UI state in this browser (does not delete server data).</p>
                <button type="button" class="action-btn" id="settings-reset-local" style="margin-top: 1rem;">Reset local cache</button>
            </div>
        `;
  }

  mount(container) {
    container.querySelector('#settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msg = container.querySelector('#settings-msg');
      showToast('Saving profile…', 'info', 2000);
      try {
        await updateProfileRemote(this.store, {
          name: fd.get('name'),
          role: fd.get('role'),
        });
        msg.textContent = 'Profile saved.';
        msg.style.color = 'var(--success)';
        showToast('Profile updated.', 'success', 3500);
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = this.store.currentAuthUser?.name || '';
        if (roleEl) roleEl.textContent = this.store.currentAuthUser?.role || '';
      } catch (err) {
        msg.textContent = err.message || 'Save failed';
        msg.style.color = 'var(--danger)';
      }
    });

    container.querySelector('#sprint-add-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msg = container.querySelector('#sprint-add-msg');
      msg.textContent = '';
      try {
        const sprint = await createSprintRemote(this.store, {
          name: String(fd.get('name') || ''),
          start: String(fd.get('start') || ''),
          end: String(fd.get('end') || ''),
          status: String(fd.get('status') || 'planned'),
        });
        syncHeaderFromStore(this.store);
        showToast(`Sprint "${sprint.name}" added.`, 'success', 4000);
        e.target.reset();
        container.innerHTML = this.render();
        this.mount(container);
      } catch (err) {
        msg.textContent = err.message || 'Could not add sprint';
        msg.style.color = 'var(--danger)';
        showToast(msg.textContent, 'error', 5000);
      }
    });

    container.querySelector('#settings-reset-local')?.addEventListener('click', () => {
      localStorage.removeItem('se-sitrep-mvp-state');
      showToast('Local cache cleared. Reloading…', 'info', 2000);
      location.reload();
    });
  }
}
