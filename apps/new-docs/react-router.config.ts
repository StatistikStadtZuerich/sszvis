import type { Config } from "@react-router/dev/config";
import fs from "node:fs/promises";
import path from "node:path";
import { DOCS_BASE } from "./docs-base.ts";

export default {
  ssr: false,
  prerender: true,
  basename: DOCS_BASE,
  /*
   * Under a basename React Router prerenders into `build/client/<basename>/` while assets and
   * examples land in `build/client/`; move the pages up so a static host serves the folder as-is.
   * GitHub Pages serves `404.html` for unknown paths.
   */
  async buildEnd({ reactRouterConfig }) {
    const client = path.join(reactRouterConfig.buildDirectory, "client");
    const nested = path.join(client, DOCS_BASE);

    // Without a prerendered root page, React Router names the fallback index.html.
    const fallback = DOCS_BASE === "/" ? "__spa-fallback.html" : "index.html";
    await fs.copyFile(path.join(client, fallback), path.join(client, "404.html"));

    const top = DOCS_BASE.split("/")[1];
    if (top) {
      const publicDir = path.resolve(reactRouterConfig.appDirectory, "..", "public");
      const taken = [...(await fs.readdir(publicDir).catch(() => [])), "assets", "preview"];
      const routed = await fs.stat(path.join(nested, top)).then(
        () => true,
        () => false,
      );
      if (taken.includes(top) || routed) {
        throw new Error(
          `DOCS_BASE ${DOCS_BASE} starts with ${top}/, which the build also writes; ` +
            "relocating the pages would delete it. Choose a base path that names nothing in the site.",
        );
      }
      await fs.cp(nested, client, { recursive: true, force: true });
      await fs.rm(path.join(client, top), { recursive: true });
    }
  },
} satisfies Config;
