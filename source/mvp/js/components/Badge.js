/**
 * Builds an HTML badge span whose modifier class is derived from the label.
 * @param {*} type - Badge type/category. Note: this parameter is accepted but not used in the current implementation.
 * @param {string} label - The text shown in the badge; also lowercased (with the first space replaced by a hyphen) to form the `badge-<label>` modifier class.
 * @returns {string} HTML markup for the badge span.
 */
export function Badge(type, label) {
    const cleanLabel = label.toLowerCase().replace(' ', '-');
    return `<span class="badge badge-${cleanLabel}">${label}</span>`;
}