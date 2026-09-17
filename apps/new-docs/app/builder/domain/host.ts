import { str } from "./emit";
import type { Asset } from "./spec";

const D3 = "https://unpkg.com/d3@7/dist/d3.min.js";
const SSZVIS = "https://unpkg.com/sszvis@3/build/sszvis.js";
const SSZVIS_CSS = "https://unpkg.com/sszvis@3/build/sszvis.css";

export const BUNDLE = {
  html: "index.html",
  chart: "chart.js",
  data: "data.csv",
  fallback: "fallback.png",
} as const;

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** The CDN scripts a recipe may ask for, by the bare name it asks under. */
export const LIBRARIES = {
  topojson: "https://unpkg.com/topojson-client@3/dist/topojson-client.min.js",
} satisfies Readonly<Record<string, string>>;

export type Library = keyof typeof LIBRARIES;

/* A recipe names its libraries as plain strings, so the set is closed here rather than in the schema. */
export const isLibrary = (name: string): name is Library => Object.hasOwn(LIBRARIES, name);

export const libraryTags = (scripts: readonly string[]): string =>
  scripts
    .filter(isLibrary)
    .map((name) => `    <script src="${LIBRARIES[name]}"></script>\n`)
    .join("");

export const host = (
  title: string,
  assets: readonly Asset[] = [],
  scripts: readonly string[] = [],
): string => {
  const libraries = libraryTags(scripts);
  /* Each extra file sits beside the data, named the same way the chart asks for it. */
  const extras = assets.map((asset) => `        ${asset.key}: ${str(asset.path)},\n`).join("");
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link href="${SSZVIS_CSS}" rel="stylesheet" />
    <style>
      /* sszvis draws dark text and axes and sets no background of its own. */
      html {
        color-scheme: light;
      }
      html,
      body {
        margin: 0;
        background: #fff;
      }
      body {
        box-sizing: border-box;
        padding: 24px;
      }
      /* Marks overhang the bounds (a point is centred on its value), so paint into the padding. */
      svg {
        overflow: visible;
      }
      html {
        overflow-x: hidden;
      }
    </style>
  </head>
  <body>
    <div id="sszvis-chart"></div>

    <script src="${D3}"></script>
    <script src="${SSZVIS}"></script>
${libraries}    <script>
      /*
       * Browsers refuse to fetch ${BUNDLE.data} over file://, so serve the
       * folder (e.g. \`npx serve\` or \`python3 -m http.server\`).
       */
      var config = {
        data: ${str(BUNDLE.data)},
        id: "#sszvis-chart",
        /* Drawn in place of the chart when the data fails to load; it is in the bundle. */
        fallback: ${str(BUNDLE.fallback)},
${extras}      };
    </script>
    <script src="${BUNDLE.chart}"></script>
  </body>
</html>
`;
};
