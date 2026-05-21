import { BaseView } from './BaseView.js';
import { useRemoteData } from '../config/appConfig.js';
import { showToast } from '../utils/toast.js';
import { updateProfileRemote } from '../services/dataSyncService.js';
import { appConfig } from '../config/appConfig.js';

export class SettingsView extends BaseView {
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
                    <input id="settings-name" name="name" type="text" value="${user?.name || ''}" required />
                  </div>
                  <div class="form-field">
                    <label for="settings-role">Role</label>
                    <input id="settings-role" name="role" type="text" value="${user?.role || ''}" />
                  </div>
                  <div class="form-field">
                    <label>Email</label>
                    <input type="email" value="${user?.email || ''}" disabled />
                  </div>
                  <p id="settings-msg" class="auth-error" role="status"></p>
                  <div class="form-actions">
                    <button type="submit" class="primary-btn">Save profile</button>
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

    container.querySelector('#settings-reset-local')?.addEventListener('click', () => {
      localStorage.removeItem('se-sitrep-mvp-state');
      showToast('Local cache cleared. Reloading…', 'info', 2000);
      location.reload();
    });
  }
}
