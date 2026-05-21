/**
 * Runtime configuration (override via `window.SITREP_CONFIG` before main.js loads).
 * @module config/appConfig
 */

const defaults = {
  /**
   * `local` = browser-only (demo; teammates cannot see each other's data).
   * `api` = read/write issues & app state via backend (required for team-wide issues).
   */
  dataMode: 'local',
  /** Base URL when dataMode is `api` (index.html sets api + URL in browser) */
  apiBaseUrl: '',
  /**
   * Google OAuth Web client ID (Calendar API). Create in Google Cloud Console.
   * Never commit secrets; set in deployed `config.js` or hosting env injection.
   */
  googleClientId: '',
};

/** @type {typeof defaults} */
export const appConfig = {
  ...defaults,
  ...(typeof window !== 'undefined' && window.SITREP_CONFIG
    ? window.SITREP_CONFIG
    : {}),
};

/**
 * @returns {boolean}
 */
/**
 * @returns {typeof defaults}
 */
export function getRuntimeConfig() {
  if (typeof window !== 'undefined' && window.SITREP_CONFIG) {
    return { ...defaults, ...window.SITREP_CONFIG };
  }
  return appConfig;
}

/**
 * @returns {boolean}
 */
export function useRemoteData() {
  const cfg = getRuntimeConfig();
  return cfg.dataMode === 'api' && Boolean(cfg.apiBaseUrl);
}

/**
 * @returns {boolean}
 */
export function useGoogleCalendar() {
  return Boolean(appConfig.googleClientId);
}
