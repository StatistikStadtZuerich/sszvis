const mainConfig = require('../.eslintrc');

module.exports = Object.assign({}, mainConfig, {
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
});
