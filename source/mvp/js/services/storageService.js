/**
 * localStorage helpers for JSON persistence.
 * @module services/storageService
 */

/**
 * Reads and JSON-parses a value from localStorage, returning the fallback when
 * the key is absent or parsing fails.
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
 * JSON-stringifies a value and writes it to localStorage under the given key.
 * @param {string} key
 * @param {*} state
 */
export function saveState(key, state) {
  localStorage.setItem(key, JSON.stringify(state));
}