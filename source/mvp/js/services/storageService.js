/**
 * localStorage helpers for JSON persistence.
 * @module services/storageService
 */

/**
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn('Failed to load saved state:', error);
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {*} state
 */
export function saveState(key, state) {
  localStorage.setItem(key, JSON.stringify(state));
}
