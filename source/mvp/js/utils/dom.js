/**
 * DOM helpers.
 * @module utils/dom
 */

/**
 * Attach a listener only once per element (prevents double-click / double-submit after re-login).
 * @param {HTMLElement|null|undefined} el
 * @param {string} type
 * @param {EventListener} handler
 * @param {boolean | AddEventListenerOptions} [options]
 */
export function bindOnce(el, type, handler, options) {
  if (!el || el.dataset.sitrepBound === '1') return;
  el.dataset.sitrepBound = '1';
  el.addEventListener(type, handler, options);
}
