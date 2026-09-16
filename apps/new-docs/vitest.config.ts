import { defineConfig } from "vitest/config";

/* Separate from `vite.config.ts` so the MDX and React Router plugins stay out of the node test run; `import.meta.glob` is vite's own. */
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
