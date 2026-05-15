import { BaseView } from './BaseView.js';

export class SettingsView extends BaseView {
    render() {
        return `
            <div class="view-header">
                <h1 class="view-title">Settings</h1>
                <p class="view-subtitle">Manage your profile and workspace preferences.</p>
            </div>
            <div class="card">
                <p>Settings implementation in progress...</p>
                <button class="primary-btn" style="margin-top: 1rem;" onclick="localStorage.clear(); location.reload();">Reset Application State</button>
            </div>
        `;
    }
}
