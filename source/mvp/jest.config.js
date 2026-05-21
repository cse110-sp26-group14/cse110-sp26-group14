export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testRegex: '/__tests__/.*\\.test\\.js$',
  moduleFileExtensions: ['js'],
  transform: {},
};
