import type { Config } from "@react-router/dev/config";
import fs from "node:fs/promises";
import path from "node:path";
import { DOCS_BASE } from "./docs-base.ts";

export default {
  ssr: false,
  prerender: true,
  basename: DOCS_BASE,
  /*
   * Shapes `build/client` into a folder a static host serves as-is.
   *
   * Under a basename React Router writes the prerendered pages to
   * `build/client/<basename>/` while Vite and the examples plugin write `assets/`,
   * `preview/` and `public/` to `build/client/` itself, so nothing lines up until
   * the pages are moved up beside them. Hosts that serve the folder at the basename
   * (GitHub Pages serves the repo at `/sszvis/`) then find every URL.
   *
   * The SPA fallback also becomes `404.html`, the page GitHub Pages serves for a
   * path it has no file for, so an unknown URL gets the site's own not-found page.
   */
  async buildEnd({ reactRouterConfig }) {
    const client = path.join(reactRouterConfig.buildDirectory, "client");
    const nested = path.join(client, DOCS_BASE);

    // Without a prerendered root page, React Router names the fallback index.html.
    const fallback = DOCS_BASE === "/" ? "__spa-fallback.html" : "index.html";
    await fs.copyFile(path.join(client, fallback), path.join(client, "404.html"));

    // The first segment of the basename, so `/a/b/` removes the whole `a/` it nested in.
    const top = DOCS_BASE.split("/")[1];
    if (top) {
      await fs.cp(nested, client, { recursive: true, force: true });
      await fs.rm(path.join(client, top), { recursive: true });
    }
  },
} satisfies Config;
