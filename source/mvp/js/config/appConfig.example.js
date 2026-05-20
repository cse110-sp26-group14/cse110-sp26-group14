/**
 * Copy to `appConfig.local.js` and load from index.html BEFORE main.js:
 *   <script src="js/config/appConfig.local.js"></script>
 *
 * Or set on window:
 *   window.SITREP_CONFIG = { ... };
 */
window.SITREP_CONFIG = {
  dataMode: 'api',
  apiBaseUrl: 'https://YOUR_BACKEND_HOST',
  googleClientId: 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
};
