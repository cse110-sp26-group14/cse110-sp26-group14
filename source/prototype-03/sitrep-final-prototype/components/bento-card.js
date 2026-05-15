/**
 * bento-card.js - Bento Card Wrapper Component
 */
class BentoCard extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle') || '';
        const colspan = this.getAttribute('colspan') || '4';
        const rowspan = this.getAttribute('rowspan') || 'auto';

        this.className = `card`;
        this.style.gridColumn = `span ${colspan}`;
        this.style.gridRow = `span ${rowspan}`;

        this.innerHTML = `
            ${title ? `<div class="card-header" style="margin-bottom: 1rem;">
                <h3 style="font-size: 1rem; font-weight: 600;">${title}</h3>
                ${subtitle ? `<p style="font-size: 0.75rem; color: var(--text-secondary);">${subtitle}</p>` : ''}
            </div>` : ''}
            <div class="card-content">
                ${this.innerHTML}
            </div>
        `;
    }
}

customElements.define('bento-card', BentoCard);
