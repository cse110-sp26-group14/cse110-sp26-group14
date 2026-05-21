// Runs before each test file — force local auth (no fetch) in CI
const util = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = util.TextDecoder;
}
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
}

global.window = global.window || {};
global.window.SITREP_CONFIG = {
  dataMode: 'local',
  apiBaseUrl: '',
};

if (typeof global.fetch === 'undefined' && typeof globalThis.fetch === 'function') {
  global.fetch = globalThis.fetch.bind(globalThis);
}
