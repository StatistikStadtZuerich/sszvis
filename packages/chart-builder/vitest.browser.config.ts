import fs from "node:fs";
import path from "node:path";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type Plugin } from "vitest/config";

const TOPO_DIR = "../geodata/dist/topo";
/* Must match `TOPO` in test/marks.browser.test.ts. */
const TOPO_PREFIX = "/topo/";

/* Serves the real built geodata files, so a recipe naming one the package does not build fails here. */
const topo = (): Plugin => ({
  name: "sszvis-topo",
  /* Fail loudly: otherwise the server falls back to index.html and the map silently draws no marks. */
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

/* A real browser, not jsdom: sszvis measures its container and calls getBBox, so jsdom reports zero marks. */
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
