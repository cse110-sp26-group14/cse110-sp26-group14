module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testRegex: "/(__tests__|e2e)/.*\\.test\\.js$",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
