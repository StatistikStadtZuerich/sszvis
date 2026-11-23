import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/* A real browser, not jsdom: sszvis measures itself with getBBox, which jsdom lacks. */
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
