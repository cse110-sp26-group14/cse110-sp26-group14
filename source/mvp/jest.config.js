export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testRegex: '/(__tests__|e2e)/.*\\.test\\.js$',
  moduleFileExtensions: ['js'],
  transform: {},
};
