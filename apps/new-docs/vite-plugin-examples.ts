/**
 * Turns every folder under `examples/<chart>/<name>/` into a standalone page at
 * `/examples/<chart>/<name>/`, and exposes the sources to the docs app through
 * the virtual module `virtual:examples`.
 *
 * The generated page is the artifact in both senses: it is what the docs
 * iframe loads, and it is exactly the file a consumer would write by hand -
 * script tags, a `config` global, and the example's own code inlined.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createHighlighter } from "shiki";
import tsBlankSpace from "ts-blank-space";
import type { Plugin } from "vite";
import type { Source, Sources } from "virtual:examples";
import { Schema } from "effect";

import { contentPages } from "./app/content-pages.ts";
import { LANGUAGES } from "./app/lib/example-languages.ts";
import { HIGHLIGHT_THEMES, highlightOptions } from "./app/lib/highlight.ts";

const CONTENT_DIR = "app/content";
const CHART_PAGES = "content/charts/";
const EXAMPLES_DIR = "examples";
const EXAMPLE_TAG = /<Example\s+id="([^"]+)"/g;
const URL_PREFIX = "/preview";
const VIRTUAL_ID = "virtual:examples";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const SOURCE_PREFIX = "virtual:example-source:";

const ASSET_FILES = ["sszvis.js", "sszvis.css"] as const;
const LIB_DIR = "../../packages/sszvis/build";
const TOPO_DIR = "../../packages/geodata/dist/topo";

const STATIC_DIR = "_static";
const STATIC_PREFIX = `${URL_PREFIX}/${STATIC_DIR}/`;
const TOPO_PREFIX = `${STATIC_PREFIX}topo/`;

const TOPOJSON_SCRIPT =
  '    <script src="https://unpkg.com/topojson-client@3/dist/topojson-client.min.js"></script>\n';

const META_FILE = "example.json";
const DATA_PREVIEW_LINES = 60;

const usesTopojson = (code: string) => /\btopojson\./.test(code);

const RUNTIME_TYPES: ReadonlyMap<string, string> = new Map([
  [".csv", "text/csv"],
  [".json", "application/json"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".svg", "image/svg+xml"],
]);

const ExampleMeta = Schema.Struct({
  title: Schema.String,
  config: Schema.Struct({
    data: Schema.optional(Schema.String),
    id: Schema.String,
    fallback: Schema.String,
  }),
});
type ExampleMeta = typeof ExampleMeta.Type;

type Example = {
  readonly id: string;
  readonly dir: string;
  readonly meta: ExampleMeta;
  readonly ts: string;
  readonly js: string;
  readonly data: string | null;
};

type CatalogEntry = {
  readonly id: string;
  readonly page: string;
  readonly pageLabel: string;
};

export function examplesPlugin(): Plugin {
  let root = "";
  let highlighter: ReturnType<typeof createHighlighter> | null = null;

  const examplesRoot = () => path.join(root, EXAMPLES_DIR);

  let cache: Promise<Example[]> | null = null;
  const readExamplesCached = () => (cache ??= readExamples());

  let catalogCache: Promise<CatalogEntry[]> | null = null;
  const readCatalogCached = () => (catalogCache ??= readCatalog());

  async function readExamples(): Promise<Example[]> {
    const base = examplesRoot();
    const charts = await readDirs(base);
    const ids = (
      await Promise.all(
        charts.map(async (chart) =>
          (await readDirs(path.join(base, chart))).map((name) => [chart, name] as const),
        ),
      )
    ).flat();

    return Promise.all(
      ids.map(async ([chart, name]) => {
        const dir = path.join(base, chart, name);
        const [ts, metaJson, data] = await Promise.all([
          fs.readFile(path.join(dir, "chart.ts"), "utf8"),
          fs.readFile(path.join(dir, "example.json"), "utf8"),
          readIfPresent(path.join(dir, "data.csv")),
        ]);
        return {
          id: `${chart}/${name}`,
          dir,
          meta: Schema.decodeUnknownSync(ExampleMeta)(JSON.parse(metaJson)),
          ts,
          js: await stripTypes(ts, root),
          data,
        };
      }),
    );
  }

  /**
   * Walks the pages in sidebar order and records the examples each one embeds.
   */
  async function readCatalog(): Promise<CatalogEntry[]> {
    const pages = await Promise.all(
      contentPages.map(async (page) => {
        const source = await readIfPresent(path.join(root, "app", page.contentPath));
        const ids = [...(source ?? "").matchAll(EXAMPLE_TAG)].map(([, id]) => id);
        return ids.map((id) => ({ id, page: page.href, pageLabel: page.label }));
      }),
    );

    const chartPages = new Set<string>(
      contentPages
        .filter((page) => page.contentPath.startsWith(CHART_PAGES))
        .map((page) => page.href),
    );
    const home = new Map<string, CatalogEntry>();
    for (const entry of pages.flat()) {
      const known = home.get(entry.id);
      if (known === undefined || (!chartPages.has(known.page) && chartPages.has(entry.page))) {
        home.set(entry.id, entry);
      }
    }
    const order = new Map(contentPages.map((page, index) => [page.href, index]));
    return [...home.values()].sort((a, b) => (order.get(a.page) ?? 0) - (order.get(b.page) ?? 0));
  }

  /** The data tab: the first lines of the file, and where to get the rest. */
  async function dataSource(example: Example): Promise<Source> {
    const lines = (example.data ?? "").split("\n");
    const shown = lines.slice(0, DATA_PREVIEW_LINES).join("\n");
    const html = await highlight(shown, "data.csv");
    if (lines.length <= DATA_PREVIEW_LINES) return { raw: shown, html };
    return { raw: shown, html, lines: lines.length, url: `${URL_PREFIX}/${example.id}/data.csv` };
  }

  /** What a page needs to put an example on screen, and nothing more. */
  async function loadIndex() {
    const examples = await readExamplesCached();

    const entries = examples.map((example) => {
      const meta = {
        id: example.id,
        title: example.meta.title,
        url: `${URL_PREFIX}/${example.id}/`,
        views: ["ts", "js", ...(example.data === null ? [] : ["csv"])],
      };
      const specifier = JSON.stringify(`${SOURCE_PREFIX}${example.id}`);
      return `  ${JSON.stringify(example.id)}: { ...${JSON.stringify(meta)}, load: () => import(${specifier}) },`;
    });
    const catalog = await readCatalogCached();
    return [
      "export const examples = {",
      ...entries,
      "};",
      `export const catalog = ${JSON.stringify(catalog)};`,
    ].join("\n");
  }
  /** Load the sources for a given example by its ID. */
  async function loadSources(exampleId: string) {
    const examples = await readExamplesCached();
    const example = examples.find((candidate) => candidate.id === exampleId);
    if (example === undefined) return null;
    const code = {
      ts: { raw: example.ts, html: await highlight(example.ts, "chart.ts") },
      js: { raw: example.js, html: await highlight(example.js, "chart.js") },
    };
    const sources: Sources =
      example.data === null ? code : { ...code, csv: await dataSource(example) };
    return `export default ${JSON.stringify(sources)};`;
  }

  /** Render a page for a given example using the provided template and assets base. */
  async function renderPage(example: Example, assetsBase: string, template: string) {
    return template
      .replaceAll("{{title}}", example.meta.title)
      .replaceAll("{{assets}}", assetsBase)
      .replaceAll("{{config}}", JSON.stringify(example.meta.config, null, 2))
      .replaceAll("{{scripts}}", usesTopojson(example.js) ? TOPOJSON_SCRIPT : "")
      .replaceAll("// {{chart}}", indent(example.js, 6).trimStart());
  }

  /** Highlighted at build time, with the site's own themes, so the source panel ships no highlighter. */
  async function highlight(code: string, filename: string) {
    const options = highlightOptions(filename);
    if (options === null) return null;
    highlighter ??= createHighlighter({ themes: HIGHLIGHT_THEMES, langs: [...LANGUAGES] });
    return (await highlighter).codeToHtml(code, options);
  }

  return {
    name: "sszvis-examples",

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      if (id.startsWith(SOURCE_PREFIX)) return `\0${id}`;
      return null;
    },

    async load(id) {
      if (id === RESOLVED_ID) return loadIndex();
      if (id.startsWith(`\0${SOURCE_PREFIX}`)) {
        return loadSources(id.slice(SOURCE_PREFIX.length + 1));
      }
      return null;
    },

    /** Dev: serve the generated pages and their assets straight from memory. */
    configureServer(server) {
      const watched = examplesRoot();
      const content = path.join(root, CONTENT_DIR);
      server.watcher.add(watched);
      const refresh = (file: string) => {
        const inExamples = file.startsWith(watched);
        const inContent = file.startsWith(content);
        if (!inExamples && !inContent) return;
        if (inExamples) cache = null;
        catalogCache = null;
        const module = server.environments.client.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.environments.client.moduleGraph.invalidateModule(module);
        server.hot.send({ type: "full-reload" });
      };
      for (const event of ["add", "change", "unlink", "addDir", "unlinkDir"] as const) {
        server.watcher.on(event, refresh);
      }

      server.middlewares.use(async (req, res, next) => {
        const [rawPath] = (req.url ?? "").split("?");
        if (!rawPath.startsWith(`${URL_PREFIX}/`)) return next();

        const missing = () => {
          res.statusCode = 404;
          res.end("Not found");
        };

        const send = (type: string, body: string | Buffer) => {
          res.setHeader("content-type", type);
          res.end(req.method === "HEAD" ? undefined : body);
        };

        try {
          let url: string;
          try {
            url = decodeURIComponent(rawPath);
          } catch {
            return missing(); // malformed percent-encoding
          }

          const asset = ASSET_FILES.find((file) => url === `${URL_PREFIX}/_assets/${file}`);
          if (asset) {
            const file = path.join(root, LIB_DIR, asset);
            const body = await fs.readFile(file).catch(() => null);
            if (!body) {
              this.error(
                `${asset} is missing from ${LIB_DIR}. The examples embed the built library, ` +
                  "so run `pnpm --filter sszvis run build` (turbo does this for you in a full build).",
              );
            }
            send(asset.endsWith(".css") ? "text/css" : "text/javascript", body);
            return;
          }

          if (url.startsWith(TOPO_PREFIX)) {
            const name = url.slice(TOPO_PREFIX.length);
            if (!/^[\w-]+\.json$/.test(name)) return missing();
            const body = await fs.readFile(path.join(root, TOPO_DIR, name)).catch(() => null);
            if (!body) return missing();
            send("application/json", body);
            return;
          }

          if (url.startsWith(STATIC_PREFIX)) {
            const name = url.slice(STATIC_PREFIX.length);
            const type = RUNTIME_TYPES.get(path.extname(name).toLowerCase());
            if (type === undefined || !/^[\w.-]+$/.test(name)) return missing();
            const body = await fs
              .readFile(path.join(root, EXAMPLES_DIR, STATIC_DIR, name))
              .catch(() => null);
            if (!body) return missing();
            send(type, body);
            return;
          }

          const examples = await readExamplesCached();
          const match = examples.find(
            (example) =>
              url === `${URL_PREFIX}/${example.id}/` || url === `${URL_PREFIX}/${example.id}`,
          );
          if (match) {
            const template = await fs.readFile(path.join(examplesRoot(), "_template.html"), "utf8");
            send("text/html", await renderPage(match, `${URL_PREFIX}/_assets`, template));
            return;
          }

          const type = RUNTIME_TYPES.get(path.extname(url).toLowerCase());
          if (type === undefined || path.basename(url) === META_FILE) return missing();

          const base = examplesRoot();
          const file = path.resolve(base, `.${url.slice(URL_PREFIX.length)}`);
          if (file !== base && !file.startsWith(base + path.sep)) return missing();

          const body = await fs.readFile(file).catch(() => null);
          if (!body) return missing();
          send(type, body);
          return;
        } catch (error) {
          return next(error);
        }
      });
    },

    /** Build: emit the same pages as static files next to the docs output. */
    async generateBundle() {
      const examples = await readExamplesCached();
      const template = await fs.readFile(path.join(examplesRoot(), "_template.html"), "utf8");

      for (const asset of ASSET_FILES) {
        const source = await fs.readFile(path.join(root, LIB_DIR, asset)).catch(() => null);
        if (!source) {
          this.error(
            `${asset} is missing from ${LIB_DIR}. The examples embed the built library, ` +
              "so build it first (`pnpm --filter sszvis run build`).",
          );
        }
        this.emitFile({ type: "asset", fileName: `preview/_assets/${asset}`, source });
      }

      for (const file of await siblingFiles(path.join(examplesRoot(), STATIC_DIR))) {
        this.emitFile({
          type: "asset",
          fileName: `preview/${STATIC_DIR}/${path.basename(file)}`,
          source: await fs.readFile(file),
        });
      }

      // A missing topo dir used to emit nothing and still "succeed", so every
      // map shipped its fallback image. Treat it like the library assets.
      const topo = await fs.readdir(path.join(root, TOPO_DIR)).catch(() => null);
      if (!topo?.some((name) => name.endsWith(".json"))) {
        this.error(
          `No TopoJSON in ${TOPO_DIR}. The map examples load it at runtime, ` +
            "so build it first (`pnpm run build:topo`).",
        );
      }

      for (const name of topo) {
        if (!name.endsWith(".json")) continue;
        this.emitFile({
          type: "asset",
          fileName: `preview/_static/topo/${name}`,
          source: await fs.readFile(path.join(root, TOPO_DIR, name)),
        });
      }

      for (const example of examples) {
        this.emitFile({
          type: "asset",
          fileName: `preview/${example.id}/index.html`,
          source: await renderPage(example, `${URL_PREFIX}/_assets`, template),
        });
        for (const file of await siblingFiles(example.dir)) {
          this.emitFile({
            type: "asset",
            fileName: `preview/${example.id}/${path.basename(file)}`,
            source: await fs.readFile(file),
          });
        }
      }
    },
  };
}

// Helpers

async function readDirs(dir: string) {
  // A folder can vanish between listing and reading it - during a move, a
  // branch switch, or a half-finished copy. Missing is empty, not fatal.
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).map((e) => e.name);
}

async function readIfPresent(file: string) {
  return fs.readFile(file, "utf8").catch(() => null);
}

/** Everything the page loads at runtime; the sources are inlined, not served. */
async function siblingFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(
      (e) =>
        e.isFile() && e.name !== META_FILE && RUNTIME_TYPES.has(path.extname(e.name).toLowerCase()),
    )
    .map((e) => path.join(dir, e.name));
}

/**
 * TypeScript to JavaScript for the JS tab and for the generated page.
 *
 * `ts-blank-space` only erases the type syntax - it never reprints the program,
 * so comments, line breaks and formatting survive exactly. It leaves the erased
 * annotations behind as whitespace, so the result goes through the repo's own
 * formatter to close the gaps. Together the two give a JS file that reads like
 * one somebody wrote, and that cannot drift from the TypeScript beside it.
 */

/** The workspace's own oxfmt; `pnpm exec` costs ~165ms more per call to find it. */
const OXFMT = path.join(import.meta.dirname, "../../node_modules/.bin/oxfmt");

function stripTypes(ts: string, root: string) {
  return new Promise<string>((resolve, reject) => {
    const [command, args] = existsSync(OXFMT)
      ? [OXFMT, ["--stdin-filepath=chart.js"]]
      : ["pnpm", ["exec", "oxfmt", "--stdin-filepath=chart.js"]];
    const oxfmt = spawn(command, args, { cwd: root });
    let out = "";
    let err = "";
    oxfmt.stdout.on("data", (chunk) => (out += chunk));
    oxfmt.stderr.on("data", (chunk) => (err += chunk));
    oxfmt.on("error", reject);
    oxfmt.on("close", (code) =>
      code === 0 ? resolve(out.trimEnd()) : reject(new Error(`oxfmt failed: ${err}`)),
    );
    oxfmt.stdin.end(tsBlankSpace(ts));
  });
}

function indent(code: string, spaces: number) {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}
