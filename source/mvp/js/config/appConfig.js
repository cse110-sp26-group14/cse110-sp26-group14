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

/**
 * @returns {typeof defaults}
 */
function readConfig() {
  return {
    ...defaults,
    ...(typeof window !== 'undefined' && window.SITREP_CONFIG
      ? window.SITREP_CONFIG
      : {}),
  };
}

/** @type {typeof defaults} */
export const appConfig = new Proxy(
  {},
  {
    get(_target, prop) {
      const cfg = readConfig();
      return cfg[prop];
    },
  },
);

/**
 * @returns {boolean}
 */
export function useRemoteData() {
  const cfg = readConfig();
  return cfg.dataMode === 'api' && Boolean(cfg.apiBaseUrl);
}

/**
 * @returns {boolean}
 */
export function useGoogleCalendar() {
  return Boolean(readConfig().googleClientId);
}
