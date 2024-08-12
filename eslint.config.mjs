import globals from "globals";
import pluginJs from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import sonarjs from "eslint-plugin-sonarjs";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  sonarjs.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
  },
  {
    ignores: ["contrib/", "build/", "docs/static/"],
  },
  eslintPluginUnicorn.configs["flat/recommended"],
  {
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "unicorn/better-regex": "warn",
      "unicorn/filename-case": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-lonely-if": "off",
      "unicorn/prefer-module": "off",
      "unicorn/numeric-separators-style": "warn",
      "unicorn/prefer-number-properties": "warn",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-null": "off",
      "unicorn/no-array-method-this-argument": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-anonymous-default-export": "off",
      "unicorn/no-this-assignment": "off",
      "unicorn/prefer-top-level-await": "off",
      "sonarjs/no-duplicate-string": "off",
      "prefer-arrow-callback": "warn",
      "arrow-body-style": ["warn", "as-needed"],
      "object-shorthand": ["error", "always", { avoidExplicitReturnArrows: true }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
