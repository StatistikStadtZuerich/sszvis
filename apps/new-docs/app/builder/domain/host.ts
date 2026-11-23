import { str } from "./emit";
import type { Asset } from "./spec";

/** Where the page loads d3 and sszvis from. */
export interface Cdn {
  readonly d3: string;
  readonly sszvis: string;
  readonly sszvisCss: string;
}

/** The exported page links the published releases, since it has to run anywhere. */
export const CDN: Cdn = {
  d3: "https://unpkg.com/d3@7/dist/d3.min.js",
  sszvis: "https://unpkg.com/sszvis@3/build/sszvis.js",
  sszvisCss: "https://unpkg.com/sszvis@3/build/sszvis.css",
};

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

/**
 * Where the chart reads its files, as `config` hands them over. The exported page names
 * them beside itself; a preview, with no folder around it, passes URLs instead.
 */
export interface HostFiles {
  readonly data: string;
  readonly fallback: string;
  readonly asset: (asset: Asset) => string;
}

const BESIDE: HostFiles = {
  data: BUNDLE.data,
  fallback: BUNDLE.fallback,
  /* Each extra file sits beside the data, named the same way the chart asks for it. */
  asset: (asset) => asset.path,
};

export interface HostPage {
  readonly title: string;
  /** The extra files the chart loads, each a key on `config`. */
  readonly assets?: readonly Asset[];
  /** The libraries the chart expects as globals besides d3 and sszvis, by `LIBRARIES` name. */
  readonly scripts?: readonly string[];
  /** Overrides `CDN`, e.g. to preview against an unreleased build of sszvis. */
  readonly cdn?: Partial<Cdn>;
  /** Overrides where `config` points the chart; defaults to the bundle's own file names. */
  readonly files?: Partial<HostFiles>;
  /**
   * The chart's JavaScript, written into the page instead of loaded from `chart.js`
   * beside it. A `srcdoc` frame has no folder to load from.
   */
  readonly inline?: string;
  /** Markup placed before every script, so it sees whatever they throw; a preview's error reporter. */
  readonly before?: string;
}

/** The page that runs a generated chart: the exported `index.html`, or a preview of it. */
export const host = ({
  title,
  assets = [],
  scripts = [],
  cdn = {},
  files = {},
  inline,
  before = "",
}: HostPage): string => {
  const urls = { ...CDN, ...cdn };
  const where = { ...BESIDE, ...files };
  const libraries = libraryTags(scripts);
  const extras = assets
    .map((asset) => `        ${asset.key}: ${str(where.asset(asset))},\n`)
    .join("");
  const chart =
    inline === undefined
      ? `    <script src="${BUNDLE.chart}"></script>\n`
      : `    <script>\n${indent(inline, 6)}\n    </script>\n`;
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link href="${urls.sszvisCss}" rel="stylesheet" />
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

${before}    <script src="${urls.d3}"></script>
    <script src="${urls.sszvis}"></script>
${libraries}    <script>
      /*
       * Browsers refuse to fetch ${BUNDLE.data} over file://, so serve the
       * folder (e.g. \`npx serve\` or \`python3 -m http.server\`).
       */
      var config = {
        data: ${str(where.data)},
        id: "#sszvis-chart",
        /* Drawn in place of the chart when the data fails to load; it is in the bundle. */
        fallback: ${str(where.fallback)},
${extras}      };
    </script>
${chart}  </body>
</html>
`;
};

const indent = (code: string, spaces: number) => {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() === "" ? line : pad + line))
    .join("\n");
};
