/**
 * Runtime configuration (override via `window.SITREP_CONFIG` before main.js loads).
 * @module config/appConfig
 */

const defaults = {
  /** `api` = team data via Cloudflare Worker (`index.html` + GitHub Actions inject). */
  dataMode: 'api',
  /** Injected at deploy: `__API_BASE_URL__` → GitHub variable `API_BASE_URL`. */
  apiBaseUrl: '',
  /**
   * Google OAuth Web client ID (Calendar API). Create in Google Cloud Console.
   * Set in `index.html` `SITREP_CONFIG` when needed.
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
  const cfg = readConfig();
  return cfg.dataMode === 'api' && Boolean(cfg.apiBaseUrl);
}

/**
 * @returns {boolean}
 */
export function useGoogleCalendar() {
  return Boolean(readConfig().googleClientId);
}
