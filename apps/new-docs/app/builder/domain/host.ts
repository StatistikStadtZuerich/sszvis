import { str } from "./emit";

const D3 = "https://unpkg.com/d3@7/dist/d3.min.js";
const SSZVIS = "https://unpkg.com/sszvis@3/build/sszvis.js";
const SSZVIS_CSS = "https://unpkg.com/sszvis@3/build/sszvis.css";

export const BUNDLE = {
  html: "index.html",
  chart: "chart.js",
  data: "data.csv",
} as const;

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const host = (title: string): string => {
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
    <script>
      /*
       * Browsers refuse to fetch ${BUNDLE.data} over file://, so serve the
       * folder (e.g. \`npx serve\` or \`python3 -m http.server\`).
       */
      var config = {
        data: ${str(BUNDLE.data)},
        id: "#sszvis-chart",
      };
    </script>
    <script src="${BUNDLE.chart}"></script>
  </body>
</html>
`;
};
