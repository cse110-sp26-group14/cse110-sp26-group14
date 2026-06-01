/**
 * Base class for hash-routed views.
 * @module views/BaseView
 */

import { Badge } from '../components/Badge.js';

/**
 * @typedef {import('../core/store.js').Store} SitRepStore
 */

/**
 * Abstract base class for hash-routed views, providing a store reference and
 * default render/mount/badge helpers for subclasses to override.
 * @abstract
 */
export class BaseView {
    /**
     * Stores the application store reference for use by the view.
     * @param {SitRepStore} store
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * Returns the view's HTML markup; the base implementation returns an empty
     * string and is intended to be overridden by subclasses.
     * @returns {string}
     */
    render() { return ''; }

    /**
     * Wires the view's interactivity after render; the base implementation is a
     * no-op and is intended to be overridden by subclasses.
     * @param {HTMLElement} container
     */
    mount(_container) {}

    /**
     * Renders a badge of the given type and label via the Badge component.
     * @param {string} type
     * @param {string} label
     * @returns {string}
     */
    getBadgeHTML(type, label) {
        return Badge(type, label);
    }
}