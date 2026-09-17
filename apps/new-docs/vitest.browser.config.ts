import fs from "node:fs";
import path from "node:path";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type Plugin } from "vitest/config";

const TOPO_DIR = "../../packages/geodata/dist/topo";
const TOPO_PREFIX = "/preview/_static/topo/";

/*
 * The map recipe names its topology by the URL the app serves it under, and a test
 * that fetched a fixture instead could pass while the app asked for a file that is
 * not there. This serves the same directory the examples plugin does, so the test
 * reads the bytes through the URL the recipe actually emits.
 */
const topo = (): Plugin => ({
  name: "sszvis-topo",
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = request.url ?? "";
      if (!url.startsWith(TOPO_PREFIX)) return next();
      const file = path.join(TOPO_DIR, path.basename(url));
      if (!fs.existsSync(file)) return next();
      response.setHeader("Content-Type", "application/json");
      response.end(fs.readFileSync(file));
    });
  },
});

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
  plugins: [topo()],
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
