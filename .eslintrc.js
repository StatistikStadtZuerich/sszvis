module.exports = {
  env: {
    browser: true,
    jest: true,
    es2017: true,
    node: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-extra-semi": "off",
    "no-shadow": "error",
  },
};
