/**
 * Today as YYYY-MM-DD. Optional override via `SITREP_CONFIG.sitrepToday` (E2E / demos).
 * @returns {string}
 */
export function todayISO() {
  const override = typeof globalThis !== 'undefined' && globalThis.SITREP_CONFIG?.sitrepToday;
  if (typeof override === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    return override;
  }
  return new Date().toISOString().split('T')[0];
}

export function currentTimestamp() {
    return new Date().toISOString();
}
