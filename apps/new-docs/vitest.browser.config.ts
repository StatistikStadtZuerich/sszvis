import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/*
 * The node tests finish in seconds; these run a real browser, because what they check
 * cannot be checked anywhere else. jsdom would not do: sszvis measures its own
 * dimensions and calls getBBox, and neither exists there, so every chart would report
 * zero marks for reasons that have nothing to do with the chart. The generated charts'
 * own browser suite lives with them, in packages/chart-builder.
 */
export default defineConfig({
  test: {
    include: ["app/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
