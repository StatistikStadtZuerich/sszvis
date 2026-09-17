import { defineConfig } from "vitest/config";

/* Separate from `vite.config.ts` so the MDX and React Router plugins stay out of the node test run; `import.meta.glob` is vite's own. */
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    /* `*.browser.test.ts` matches the include too, and belongs to vitest.browser.config.ts. */
    exclude: ["**/node_modules/**", "app/**/*.browser.test.ts"],
    environment: "node",
  },
});
