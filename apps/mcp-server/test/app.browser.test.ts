import { CallToolResultSchema, ReadResourceResultSchema } from "@modelcontextprotocol/core";
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import { Effect, Exit, Scope } from "effect";
import { McpProtocol, McpTest } from "effect/ai";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

/* By path rather than specifier: neither d3 nor sszvis exports its browser build as a subpath. */
import d3Url from "../node_modules/d3/dist/d3.min.js?url";
import sszvisCssUrl from "../node_modules/sszvis/build/sszvis.css?url";
import sszvisUrl from "../node_modules/sszvis/build/sszvis.js?url";
import topojsonUrl from "../node_modules/topojson-client/dist/topojson-client.min.js?url";

import { CDN, LIBRARIES } from "@sszvis/chart-builder/host";
import html from "../ui/dist/index.html?raw";
import { Capabilities } from "../src/capabilities.ts";
import { EXTENSION } from "../src/mcpApp.ts";

/*
 * The app in a host, as far as a test can be one: the real server runs in this page over
 * Effect's in-memory client, ext-apps' own AppBridge relays the app's calls to it, and the
 * app runs in a sandboxed frame under the CSP the MCP Apps spec gives an app that declares
 * no domains - so a d3.csv or d3.json that reaches the network fails here as it would in
 * Claude. Only the CDN URLs change, to the workspace's copies, so the test needs no network.
 */
const LOCAL: Readonly<Record<string, string>> = {
  [CDN.d3]: d3Url,
  [CDN.sszvis]: sszvisUrl,
  [CDN.sszvisCss]: sszvisCssUrl,
  [LIBRARIES.topojson]: topojsonUrl,
};

const CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline' ${location.origin}`,
  `style-src 'unsafe-inline' ${location.origin}`,
  "img-src data:",
  "connect-src 'none'",
].join("; ");

const page = Object.entries(LOCAL)
  .reduce(
    (source, [cdn, local]) => source.replaceAll(cdn, new URL(local, location.href).href),
    html,
  )
  .replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="${CSP}">`);

const scope = Effect.runSync(Scope.make());
let client: McpTest.Client;

beforeAll(async () => {
  client = await Effect.runPromise(
    McpTest.makeClient(Capabilities, {
      protocols: [McpProtocol.v2025_11_25],
      extensions: { [EXTENSION]: {} },
    }).pipe(Scope.provide(scope)),
  );
});

afterAll(() => Effect.runPromise(Scope.close(scope, Exit.void)));

/** Effect's and the MCP SDK's types for the same JSON, crossed the way a transport would. */
const wire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

let frame: HTMLIFrameElement | undefined;

afterEach(() => {
  frame?.remove();
  frame = undefined;
});

/** Mounts the app, hands it a render_chart call, and resolves once it has connected. */
async function host(args: Record<string, unknown>) {
  const iframe = document.createElement("iframe");
  /*
   * allow-same-origin only so the test can read the frame's DOM; a real host isolates the
   * app on its own domain instead. The CSP, which is what this file is about, still holds.
   */
  iframe.sandbox.add("allow-scripts", "allow-same-origin");
  iframe.style.width = "800px";
  iframe.style.height = "800px";
  document.body.append(iframe);
  frame = iframe;
  const view = iframe.contentWindow;
  if (view === null) throw new Error("the frame has no window");

  const bridge = new AppBridge(
    null,
    { name: "test host", version: "0" },
    { serverTools: {}, serverResources: {} },
    { hostContext: { displayMode: "inline", availableDisplayModes: ["inline", "fullscreen"] } },
  );
  /* As Claude does: grant the mode asked for, so the app can open its editing panels. */
  bridge.onrequestdisplaymode = async ({ mode }) => ({ mode });
  /* Through the SDK's own schemas, which also checks Effect's wire shape satisfies them. */
  bridge.oncalltool = async (params) =>
    CallToolResultSchema.parse(wire(await Effect.runPromise(client.callTool(params))));
  bridge.onreadresource = async (params) =>
    ReadResourceResultSchema.parse(wire(await Effect.runPromise(client.readResource(params))));
  const initialized = new Promise<void>((resolve) => (bridge.oninitialized = () => resolve()));

  /* Listening before the page loads, since the app introduces itself as soon as it runs. */
  await bridge.connect(new PostMessageTransport(view, view));
  iframe.srcdoc = page;
  await initialized;

  const result = CallToolResultSchema.parse(
    wire(await Effect.runPromise(client.callTool({ name: "render_chart", arguments: args }))),
  );
  await bridge.sendToolInput({ arguments: args });
  await bridge.sendToolResult(result);
  return view;
}

/** Polls the frame, since the chart draws after a round trip and a render. */
async function settle<T>(read: () => T, done: (value: T) => boolean, ms = 10_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const value = read();
    if (done(value) || Date.now() > until) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

const count = (view: Window, selector: string) =>
  view.document.querySelectorAll(`#sszvis-chart ${selector}`).length;

const findButton = (view: Window, label: string) =>
  [...view.document.querySelectorAll("button")].find((candidate) =>
    candidate.textContent?.trim().endsWith(label),
  );

const button = (view: Window, label: string) => {
  const found = findButton(view, label);
  if (found === undefined) throw new Error(`no "${label}" button`);
  return found;
};

const status = (view: Window) => view.document.getElementById("status")?.textContent ?? "";

describe("the chart app in a host", () => {
  test("should draw a bar chart from render_chart's result", async () => {
    const view = await host({ recipe: "bar-chart-vertical" });

    /* `beschaeftigte-sektor` has six rows, so six bars. */
    expect(
      await settle(
        () => count(view, "rect.sszvis-bar"),
        (n) => n === 6,
      ),
    ).toBe(6);
    expect(status(view)).toBe("");
  });

  test("should draw a map from the topology it reads as a resource", async () => {
    const view = await host({ recipe: "map-choropleth" });

    const areas = await settle(
      () => count(view, "path.sszvis-map__area"),
      (n) => n > 0,
    );
    expect(areas).toBeGreaterThan(0);
    expect(status(view)).toBe("");
  });

  test("should open its panels fullscreen and redraw as the recipe the reader picks", async () => {
    const view = await host({ recipe: "bar-chart-vertical" });
    await settle(
      () => count(view, "rect.sszvis-bar"),
      (n) => n === 6,
    );

    button(view, "Edit").click();
    const horizontal = await settle(
      () => findButton(view, "Horizontal bar"),
      (found) => found !== undefined,
    );
    if (horizontal === undefined) throw new Error("no chart type buttons after Edit");
    horizontal.click();
    await settle(
      () => status(view),
      (text) => text === "",
    );

    /*
     * A resize redraws the chart. NOTE: this cannot tell whether the vertical chart's app
     * was destroyed - its listener runs first, so the new chart draws last either way.
     */
    frame?.style.setProperty("width", "1000px");
    view.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 500));

    const bars = [
      ...view.document.querySelectorAll<SVGRectElement>("#sszvis-chart rect.sszvis-bar"),
    ];
    const heights = new Set(bars.map((bar) => bar.getAttribute("height")));
    expect(status(view)).toBe("");
    expect(bars).toHaveLength(6);
    /* Horizontal bars share one height and differ in width. */
    expect(heights.size).toBe(1);
  });

  test("should show the generated code", async () => {
    const view = await host({ recipe: "line-chart" });
    await settle(
      () => count(view, "path"),
      (n) => n > 0,
    );
    button(view, "Code").click();
    await settle(
      () => view.document.getElementById("source"),
      (found) => found !== null,
    );

    expect(view.document.getElementById("source")?.textContent).toContain("sszvis.app<");
  });
});
