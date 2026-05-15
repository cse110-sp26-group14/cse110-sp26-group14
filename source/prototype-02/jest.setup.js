// jest.setup.js - test environment setup
// Polyfill TextEncoder/TextDecoder for jsdom in Node
const util = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = util.TextDecoder;
}

// Optional: silence some jsdom warnings by providing minimal URL if needed
if (typeof global.URL === "undefined") {
  global.URL = require("url").URL;
}
