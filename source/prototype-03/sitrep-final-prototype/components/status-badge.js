/**
 * status-badge.js - Dynamic Status Badge Web Component
 */
class StatusBadge extends HTMLElement {
    static get observedAttributes() { return ['status', 'label']; }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const status = (this.getAttribute('status') || '').toLowerCase();
        const label = this.getAttribute('label') || 'Pending';

        let color = 'var(--text-muted)';
        let bg = 'rgba(82, 82, 91, 0.1)';

        switch (status) {
            case 'done':
            case 'on track':
                color = 'var(--status-done)';
                bg = 'rgba(34, 197, 94, 0.1)';
                break;
            case 'in progress':
                color = 'var(--status-progress)';
                bg = 'rgba(59, 130, 246, 0.1)';
                break;
            case 'review':
                color = 'var(--status-review)';
                bg = 'rgba(234, 179, 8, 0.1)';
                break;
            case 'blocked':
                color = 'var(--status-blocked)';
                bg = 'rgba(239, 68, 68, 0.1)';
                break;
            case 'scanning':
            case 'summarizing':
                color = 'var(--status-scanning)';
                bg = 'rgba(168, 85, 247, 0.1)';
                break;
        }

        this.innerHTML = `
            <span class="badge" style="color: ${color}; background: ${bg}; border: 1px solid ${color}33; display: inline-block; padding: 2px 8px; font-size: 0.625rem; letter-spacing: 0.05em;">
                ${label.toUpperCase()}
            </span>
        `;
    }
}

customElements.define('status-badge', StatusBadge);
