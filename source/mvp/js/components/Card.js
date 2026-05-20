export function Card(content, options = {}) {
    const { className = '', style = '' } = options;
    const classes = ['card', className].filter(Boolean).join(' ');
    const styleAttribute = style ? ` style="${style}"` : '';

    return `<div class="${classes}"${styleAttribute}>${content}</div>`;
}
