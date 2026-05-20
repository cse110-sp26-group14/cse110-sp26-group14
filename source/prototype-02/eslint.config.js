const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-undef": "error",
      "no-redeclare": "off",
    },
  },
  {
    files: [
      "app.js",
      "mockData.js",
      "storage.js",
      "taskService.js",
    ],
    languageOptions: {
      globals: {
        BacklogStorage: "readonly",
        TaskService: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["__tests__/**/*.js", "e2e/**/*.js", "jest.setup.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
