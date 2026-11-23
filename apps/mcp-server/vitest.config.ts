import { defineConfig } from "vitest/config";

/* Vitest rather than plain node: chart-builder's recipe loader uses vite's `import.meta.glob`. */
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/*.browser.test.ts"],
    environment: "node",
  },
});
