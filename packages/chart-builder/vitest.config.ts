import { defineConfig } from "vitest/config";

/* Vitest rather than plain node: the recipe loader uses vite's `import.meta.glob`. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/*.browser.test.ts"],
    environment: "node",
  },
});
