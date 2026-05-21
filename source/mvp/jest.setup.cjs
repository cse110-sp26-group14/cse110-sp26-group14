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

// Load HTML partials for unit tests that call renderTemplate()
const fs = require('fs');
const path = require('path');
const partialsPath = path.join(__dirname, 'templates', 'partials.html');
if (typeof document !== 'undefined' && fs.existsSync(partialsPath)) {
  const host = document.createElement('div');
  host.id = 'template-host';
  host.innerHTML = fs.readFileSync(partialsPath, 'utf8');
  document.body.appendChild(host);
}
