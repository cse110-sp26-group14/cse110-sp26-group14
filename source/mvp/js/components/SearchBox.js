/**
 * Builds a search-box markup with a magnifier icon and a text input.
 * @param {string} [placeholder] - Placeholder text for the input; defaults to `'Search...'`.
 * @param {object} [options] - Optional configuration.
 * @param {string} [options.style] - Inline CSS; when non-empty, rendered as a `style` attribute on the wrapper div.
 * @returns {string} HTML markup for the search box.
 */
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