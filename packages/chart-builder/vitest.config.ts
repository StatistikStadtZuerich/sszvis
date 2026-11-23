import { defineConfig } from "vitest/config";

/* `import.meta.glob`, which the recipe loader uses, is vite's own, so these run under vitest rather than plain node. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    /* `*.browser.test.ts` matches the include too, and belongs to vitest.browser.config.ts. */
    exclude: ["**/node_modules/**", "**/*.browser.test.ts"],
    environment: "node",
  },
});
