/**
 * sidebar.js - Native Web Component for Sidebar Navigation
 */
class SitRepSidebar extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <aside id="sidebar" style="background: var(--bg-sidebar); border-right: 1px solid var(--border); padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; height: 100%;">
                <div class="logo flex items-center gap-2">
                    <div style="background: var(--accent); width: 32px; height: 32px; border-radius: var(--radius-sm); display: grid; place-items: center; font-weight: 800; font-size: 0.75rem;">SE</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.125rem;">SE SitRep</div>
                        <div style="font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Agile Platform</div>
                    </div>
                </div>

                <div class="workspace">
                    <div style="font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Workspace</div>
                    <div style="font-weight: 600; font-size: 0.875rem;">CSE 110 Team Space</div>
                </div>

                <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <a href="#/dashboard" class="nav-link flex items-center gap-4" style="padding: 0.75rem; border-radius: var(--radius-md); text-decoration: none; color: var(--text-secondary); transition: 0.2s;">
                        <i data-lucide="layout-dashboard" style="width: 18px;"></i> Dashboard
                    </a>
                    <a href="#/check-ins" class="nav-link flex items-center gap-4" style="padding: 0.75rem; border-radius: var(--radius-md); text-decoration: none; color: var(--text-secondary); transition: 0.2s;">
                        <i data-lucide="calendar-check" style="width: 18px;"></i> Check-ins
                    </a>
                    <a href="#/sprint-board" class="nav-link flex items-center gap-4" style="padding: 0.75rem; border-radius: var(--radius-md); text-decoration: none; color: var(--text-secondary); transition: 0.2s;">
                        <i data-lucide="columns-3" style="width: 18px;"></i> Sprint Board
                    </a>
                    <a href="#/analytics" class="nav-link flex items-center gap-4" style="padding: 0.75rem; border-radius: var(--radius-md); text-decoration: none; color: var(--text-secondary); transition: 0.2s;">
                        <i data-lucide="bar-chart-3" style="width: 18px;"></i> Analytics
                    </a>
                </nav>

                <div style="margin-top: auto;">
                    <button class="btn btn-primary btn-new-checkin" style="width: 100%; justify-content: center;">
                        <i data-lucide="plus" style="width: 16px;"></i> New Check-in
                    </button>
                    <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                        <div class="flex items-center gap-4 text-secondary" style="font-size: 0.875rem; cursor: pointer;">
                            <i data-lucide="help-circle" style="width: 18px;"></i> Help
                        </div>
                        <div class="flex items-center gap-4 text-secondary" style="font-size: 0.875rem; cursor: pointer;">
                            <i data-lucide="settings" style="width: 18px;"></i> Settings
                        </div>
                    </div>
                </div>
            </aside>
        `;

        this.querySelector('.btn-new-checkin').onclick = () => {
            document.getElementById('global-modal').show();
        };
        
        // Active link handling
        const currentHash = window.location.hash || '#/dashboard';
        const activeLink = this.querySelector(`a[href="${currentHash}"]`);
        if (activeLink) {
            activeLink.style.backgroundColor = 'var(--accent-muted)';
            activeLink.style.color = 'var(--accent)';
        }

        if (window.lucide) window.lucide.createIcons();
    }
}

customElements.define('sitrep-sidebar', SitRepSidebar);
