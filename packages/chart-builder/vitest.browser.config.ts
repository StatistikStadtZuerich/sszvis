import fs from "node:fs";
import path from "node:path";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type Plugin } from "vitest/config";

const TOPO_DIR = "../geodata/dist/topo";
/* `TOPO` in test/marks.browser.test.ts. */
const TOPO_PREFIX = "/topo/";

/*
 * The map recipe names its topology by `@sszvis/geodata` file, and where those are
 * served is each app's to say. The test serves the built files themselves, so a recipe
 * naming a file the package does not build fails here rather than in an app.
 */
const topo = (): Plugin => ({
  name: "sszvis-topo",
  /*
   * Loudly, because falling through to the dev server's index.html gave the chart an
   * HTML page where it expected a topology: it failed on "Unexpected end of JSON input"
   * and reported no marks, which reads exactly like a recipe that draws nothing.
   */
  buildStart() {
    const built =
      fs.existsSync(TOPO_DIR) && fs.readdirSync(TOPO_DIR).some((n) => n.endsWith(".json"));
    if (!built) {
      throw new Error(
        `No TopoJSON in ${TOPO_DIR}. The map recipe loads it at runtime, ` +
          "so build it first (`pnpm run build:topo`).",
      );
    }
  },
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = request.url ?? "";
      if (!url.startsWith(TOPO_PREFIX)) return next();
      const file = path.join(TOPO_DIR, path.basename(url));
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end(`No such topology: ${path.basename(url)}`);
        return;
      }
      response.setHeader("Content-Type", "application/json");
      response.end(fs.readFileSync(file));
    });
  },
});

/*
 * The package's unit tests run under node and finish in seconds; these run a real
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
    include: ["src/**/*.browser.test.ts", "test/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
