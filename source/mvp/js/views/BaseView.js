/**
 * Base class for hash-routed views.
 * @module views/BaseView
 */

import { Badge } from '../components/Badge.js';

/**
 * @typedef {import('../core/store.js').Store} SitRepStore
 */

/**
 * @abstract
 */
export class BaseView {
    /**
     * @param {SitRepStore} store
     */
    constructor(store) {
        this.store = store;
    }

    /** @returns {string} */
    render() { return ''; }

    /**
     * @param {HTMLElement} container
     */
    mount(_container) {}

    /**
     * @param {string} type
     * @param {string} label
     * @returns {string}
     */
    getBadgeHTML(type, label) {
        return Badge(type, label);
    }
}
