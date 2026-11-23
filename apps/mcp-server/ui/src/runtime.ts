import type { ChartUpdate } from "../../src/chartTools.ts";

type Loader = (url: string, ...rest: unknown[]) => Promise<unknown>;

declare global {
  interface Window {
    config: Record<string, string>;
    d3: {
      csv: Loader;
      json: Loader;
      csvParseRows: (text: string) => string[][];
    };
    sszvis: { app: (...args: unknown[]) => { destroy(): void } };
  }
}

type Row = (datum: Record<string, string>, index: number, columns: string[]) => unknown;

function parseCsv([columns = [], ...rows]: string[][], row: Row | undefined) {
  const parsed: unknown[] = [];
  rows.forEach((cells, index) => {
    const datum = Object.fromEntries(columns.map((column, at) => [column, cells[at] ?? ""]));
    const value = row === undefined ? datum : row(datum, index, columns);
    if (value !== null && value !== undefined) parsed.push(value);
  });
  return Object.assign(parsed, { columns });
}

const DATA = "data.csv";
const CHART = "sszvis-chart";

let csv = "";
let files: Readonly<Record<string, unknown>> = {};
let running: { destroy(): void } | undefined;

/** Patches the CDN globals once, before any generated code runs. */
export function installChartRuntime() {
  const { d3, sszvis } = window;
  const csvLoader = d3.csv;
  const jsonLoader = d3.json;
  d3.csv = (url, ...rest) => {
    if (url !== DATA) return csvLoader(url, ...rest);
    /* d3.csv(url, row) or d3.csv(url, init, row): the row function is the last argument. */
    const row = rest.findLast((argument): argument is Row => typeof argument === "function");
    return Promise.resolve(parseCsv(d3.csvParseRows(csv), row));
  };
  d3.json = (url, ...rest) =>
    Object.hasOwn(files, url) ? Promise.resolve(files[url]) : jsonLoader(url, ...rest);

  const app = sszvis.app;
  sszvis.app = (...args) => {
    running = app(...args);
    return running;
  };
}

/** Draws into `host`, which React owns and leaves empty, so the chart's own DOM is never React's. */
export function runChart(
  host: HTMLElement,
  update: ChartUpdate,
  assets: Readonly<Record<string, unknown>>,
) {
  running?.destroy();
  running = undefined;
  csv = update.csv;
  files = assets;

  /* A fresh container, so nothing the last chart drew or bound survives. */
  const container = document.createElement("div");
  container.id = CHART;
  host.replaceChildren(container);

  window.config = {
    data: DATA,
    id: `#${CHART}`,
    fallback: "",
    ...Object.fromEntries(update.assets.map((asset) => [asset.key, asset.path])),
  };

  /* An inline script runs as it is appended, and what it throws reaches window, not here. */
  let thrown: unknown;
  const onError = (event: ErrorEvent) => {
    thrown = event.error ?? new Error(event.message);
  };
  window.addEventListener("error", onError);
  const script = document.createElement("script");
  /* Classic scripts share one global scope, so a second chart's top-level consts would clash. */
  script.textContent = `(() => {\n${update.js}\n})();`;
  document.body.append(script);
  script.remove();
  window.removeEventListener("error", onError);
  if (thrown !== undefined) throw thrown;
}
