export function SearchBox(placeholder = 'Search...', options = {}) {
    const { style = '' } = options;
    const styleAttribute = style ? ` style="${style}"` : '';

    return `
        <div class="search-box"${styleAttribute}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="${placeholder}">
        </div>
    `;
}
