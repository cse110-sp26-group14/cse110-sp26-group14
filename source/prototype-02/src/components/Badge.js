export function Badge(type, label) {
    const cleanLabel = label.toLowerCase().replace(' ', '-');
    return `<span class="badge badge-${cleanLabel}">${label}</span>`;
}
