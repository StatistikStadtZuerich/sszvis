import globals from "globals";
import pluginJs from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import sonarjs from "eslint-plugin-sonarjs";

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
  {
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
