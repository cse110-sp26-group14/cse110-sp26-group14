// jest.setup.cjs — test environment (CommonJS for Jest setupFilesAfterEnv)
if (typeof globalThis.window !== 'undefined') {
  globalThis.window.SITREP_CONFIG = {
    dataMode: 'local',
    apiBaseUrl: '',
    googleClientId: '',
  };
}

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
