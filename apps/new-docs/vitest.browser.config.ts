import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/*
 * The builder's domain tests run under node and finish in seconds; these run a real
 * browser, because what they check cannot be checked anywhere else. A generated chart
 * that type-checks and reads correctly can still draw nothing - an unbound scale, a
 * datum shape the accessors miss - and only laying it out in a browser tells them
 * apart. jsdom would not: sszvis measures its own dimensions and calls getBBox, and
 * neither exists there, so every chart would report zero marks for reasons that have
 * nothing to do with the chart.
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
