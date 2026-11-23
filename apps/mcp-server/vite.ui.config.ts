import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

import { CDN, LIBRARIES } from "@sszvis/chart-builder/host";

/*
 * The libraries load from the same published URLs the generated page uses, and before the
 * app's own script, which renders with them. The server declares their origin in the CSP.
 */
const libraries = (): Plugin => ({
  name: "sszvis-libraries",
  transformIndexHtml: () => [
    { tag: "link", attrs: { rel: "stylesheet", href: CDN.sszvisCss }, injectTo: "head" },
    ...[CDN.d3, CDN.sszvis, ...Object.values(LIBRARIES)].map((src) => ({
      tag: "script",
      attrs: { src },
      injectTo: "head-prepend" as const,
    })),
  ],
});

export default defineConfig({
  root: "ui",
  plugins: [tailwindcss(), libraries(), viteSingleFile()],
  build: { outDir: "dist", emptyOutDir: true },
});
