/**
 * Runtime configuration (override via `window.SITREP_CONFIG` before main.js loads).
 * @module config/appConfig
 */

const defaults = {
  /**
   * `local` = browser-only (demo; teammates cannot see each other's data).
   * `api` = read/write issues & app state via backend (required for team-wide issues).
   */
  dataMode: 'api',
  /** Base URL when dataMode is `api` */
  apiBaseUrl: 'http://localhost:3001',
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
export function useRemoteData() {
  return appConfig.dataMode === 'api' && Boolean(appConfig.apiBaseUrl);
}

/**
 * @returns {boolean}
 */
export function useGoogleCalendar() {
  return Boolean(appConfig.googleClientId);
}
