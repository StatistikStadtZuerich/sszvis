import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/* A real browser, not jsdom: sszvis measures its container, and the app runs in a sandboxed frame. */
export default defineConfig({
  test: {
    include: ["test/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
