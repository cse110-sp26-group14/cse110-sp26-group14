/**
 * Wraps content in a `card` div, optionally adding a custom class and inline style.
 * @param {string} content - HTML/string content placed inside the card.
 * @param {object} [options] - Optional configuration.
 * @param {string} [options.className] - Extra class name appended after `card`; falsy values are omitted.
 * @param {string} [options.style] - Inline CSS; when non-empty, rendered as a `style` attribute.
 * @returns {string} HTML markup for the card div.
 */
export function Card(content, options = {}) {
    const { className = '', style = '' } = options;
    const classes = ['card', className].filter(Boolean).join(' ');
    const styleAttribute = style ? ` style="${style}"` : '';

    return `<div class="${classes}"${styleAttribute}>${content}</div>`;
}