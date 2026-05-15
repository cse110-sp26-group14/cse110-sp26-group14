module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testRegex: "/__tests__/.*\\.test\\.js$",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
