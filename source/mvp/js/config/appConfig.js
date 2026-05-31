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
  googleClientId: '736502651505-7i3bu30t7b2djm1rq9v62ds6bsmsihrd.apps.googleusercontent.com',
};

/**
 * Reads the effective configuration by cloning the defaults and applying any
 * non-empty overrides from `window.SITREP_CONFIG` (when present).
 * @returns {typeof defaults} The merged configuration object.
 */
function readConfig() {
  const result = { ...defaults };
  const overrides = typeof window !== 'undefined' && window.SITREP_CONFIG ? window.SITREP_CONFIG : {};
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== '' && v !== null && v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Live configuration accessor: each property read re-evaluates `readConfig()`,
 * so it always reflects the current `window.SITREP_CONFIG` overrides.
 * @type {typeof defaults}
 */
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
 * Returns a plain snapshot of the runtime configuration, merging defaults with
 * `window.SITREP_CONFIG` when available; otherwise returns the live `appConfig`.
 * @returns {typeof defaults} The resolved configuration.
 */
export function getRuntimeConfig() {
  if (typeof window !== 'undefined' && window.SITREP_CONFIG) {
    return { ...defaults, ...window.SITREP_CONFIG };
  }
  return appConfig;
}

/**
 * Indicates whether remote data should be used, i.e. data mode is `'api'` and
 * an API base URL is configured.
 * @returns {boolean} `true` when remote data is enabled.
 */
export function useRemoteData() {
  const cfg = readConfig();
  return cfg.dataMode === 'api' && Boolean(cfg.apiBaseUrl);
}

/**
 * Indicates whether Google Calendar integration is enabled, i.e. a Google
 * client ID is configured.
 * @returns {boolean} `true` when a Google client ID is present.
 */
export function useGoogleCalendar() {
  return Boolean(readConfig().googleClientId);
}