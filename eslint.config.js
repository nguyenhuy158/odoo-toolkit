const globals = require("globals");

module.exports = [
  {
    files: ["interceptor.js", "ui.js", "src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        chrome: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
      eqeqeq: ["warn", "smart"],
      "prefer-const": "warn",
      "no-var": "warn"
    }
  },
  {
    files: ["**/*.config.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node }
    }
  }
];
