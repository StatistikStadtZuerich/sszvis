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

/*
 * A blocked eval does not always throw where anyone sees it - a library that probes for
 * eval and falls back passes every assertion - but a host still reports it, as MCP Jam's
 * Strict mode does. So the frame records every violation, before any other script runs.
 */
const RECORDER = `window.__violations=[];document.addEventListener("securitypolicyviolation",function(e){window.__violations.push(e.effectiveDirective+" "+e.blockedURI+" at "+e.sourceFile+":"+e.lineNumber+":"+e.columnNumber+" "+e.sample)});`;

const page = Object.entries(LOCAL)
  .reduce(
    (source, [cdn, local]) => source.replaceAll(cdn, new URL(local, location.href).href),
    html,
  )
  .replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="${CSP}"><script>${RECORDER}</script>`,
  );

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
  const violations = (frame?.contentWindow as (Window & { __violations?: string[] }) | null)
    ?.__violations;
  frame?.remove();
  frame = undefined;
  expect(violations ?? [], "CSP violations in the app").toEqual([]);
});

/** Mounts the app, hands it a render_chart call, and resolves once it has connected. */
interface HostOptions {
  /** Send the tool result the moment the app says it is initialised, as a fast host may. */
  readonly eager?: boolean;
  /** Milliseconds to hold a tool call back, so an older request can finish after a newer one. */
  readonly delay?: (name: string, args: Record<string, unknown> | undefined) => number;
  /** The display mode the host connects in. */
  readonly displayMode?: "inline" | "fullscreen";
  /** Cancel the call instead of sending its result. */
  readonly cancel?: string;
  /** Changes the spec render_chart returned before the host passes it on. */
  readonly spec?: (spec: Record<string, unknown>) => Record<string, unknown>;
}

async function host(args: Record<string, unknown>, options: HostOptions = {}) {
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
    {
      hostContext: {
        displayMode: options.displayMode ?? "inline",
        availableDisplayModes: ["inline", "fullscreen"],
      },
    },
  );
  /* As Claude does: grant the mode asked for, so the app can open its editing panels. */
  bridge.onrequestdisplaymode = async ({ mode }) => ({ mode });
  /* Through the SDK's own schemas, which also checks Effect's wire shape satisfies them. */
  bridge.oncalltool = async (params) => {
    const wait = options.delay?.(params.name, params.arguments) ?? 0;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return CallToolResultSchema.parse(wire(await Effect.runPromise(client.callTool(params))));
  };
  bridge.onreadresource = async (params) =>
    ReadResourceResultSchema.parse(wire(await Effect.runPromise(client.readResource(params))));
  const rendered = CallToolResultSchema.parse(
    wire(await Effect.runPromise(client.callTool({ name: "render_chart", arguments: args }))),
  );
  const content = rendered.structuredContent as { spec?: Record<string, unknown> } | undefined;
  const result =
    options.spec === undefined || content?.spec === undefined
      ? rendered
      : { ...rendered, structuredContent: { spec: options.spec(content.spec) } };
  const initialized = new Promise<void>((resolve) => {
    bridge.oninitialized = () => {
      if (options.eager === true) {
        void bridge.sendToolInput({ arguments: args });
        void bridge.sendToolResult(result);
      }
      resolve();
    };
  });

  /* Listening before the page loads, since the app introduces itself as soon as it runs. */
  await bridge.connect(new PostMessageTransport(view, view));
  iframe.srcdoc = page;
  await initialized;

  if (options.cancel !== undefined) {
    await bridge.sendToolInput({ arguments: args });
    await bridge.sendToolCancelled({ reason: options.cancel });
  } else if (options.eager !== true) {
    await bridge.sendToolInput({ arguments: args });
    await bridge.sendToolResult(result);
  }
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
    /* The spinner stays until the frame after the chart has drawn. */
    expect(
      await settle(
        () => status(view),
        (text) => text === "",
      ),
    ).toBe("");
  });

  test("should draw a map from the topology it reads as a resource", async () => {
    const view = await host({ recipe: "map-choropleth" });

    const areas = await settle(
      () => count(view, "path.sszvis-map__area"),
      (n) => n > 0,
    );
    expect(areas).toBeGreaterThan(0);
    /* The spinner stays until the frame after the chart has drawn. */
    expect(
      await settle(
        () => status(view),
        (text) => text === "",
      ),
    ).toBe("");
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

  test("should hold the chart in place while it redraws", async () => {
    const view = await host({ recipe: "bar-chart-vertical" });
    await settle(
      () => status(view),
      (text) => text === "",
    );
    const card = view.document.querySelector<HTMLElement>(".chart-card");
    if (card === null) throw new Error("no chart card");
    const before = card.getBoundingClientRect();

    /* Sampled every frame from the click until the new chart is up. */
    const samples: DOMRect[] = [];
    button(view, "Edit").click();
    const legend = await settle(
      () => view.document.querySelector<HTMLElement>('[role="checkbox"]'),
      (found) => found !== null,
    );
    if (legend === null) throw new Error("no feature checkbox after Edit");
    const left = card.getBoundingClientRect().left;
    legend.click();
    await new Promise<void>((resolve) => {
      const sample = () => {
        samples.push(card.getBoundingClientRect());
        if (status(view) === "") resolve();
        else view.requestAnimationFrame(sample);
      };
      view.requestAnimationFrame(sample);
    });

    expect(samples.length).toBeGreaterThan(1);
    for (const rect of samples.slice(0, -1)) {
      expect(rect.top).toBe(before.top);
      expect(rect.left).toBe(left);
      expect(rect.height).toBeGreaterThanOrEqual(before.height);
    }
  });

  test("should draw a result the host sends the moment the app is ready", async () => {
    const view = await host({ recipe: "bar-chart-vertical" }, { eager: true });

    expect(
      await settle(
        () => count(view, "rect.sszvis-bar"),
        (n) => n === 6,
      ),
    ).toBe(6);
  });

  test("should show why render_chart failed rather than drawing forever", async () => {
    const view = await host({ recipe: "line-chart", fields: { date: "Nope" } });

    expect(
      await settle(
        () => status(view),
        (text) => text.includes("Nope"),
      ),
    ).toContain('The data has no column "Nope"');
    expect(view.document.querySelector('[role="alert"]')?.textContent).toContain("Nope");
  });

  test("should drop an older edit that finishes after a newer one", async () => {
    /* The switch to horizontal bars is slow, and the feature edit after it is not. */
    const view = await host(
      { recipe: "bar-chart-vertical" },
      {
        delay: (name, args) =>
          name === "update_chart" && args?.["recipe"] !== undefined ? 800 : 0,
      },
    );
    await settle(
      () => status(view),
      (text) => text === "",
    );
    button(view, "Edit").click();
    const horizontal = await settle(
      () => findButton(view, "Horizontal bar"),
      (found) => found !== undefined,
    );
    horizontal?.click();
    /* Let the slow request go out: two clicks in one task are batched into a single request. */
    await new Promise((resolve) => setTimeout(resolve, 100));
    view.document.querySelector<HTMLElement>('[role="checkbox"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const bars = [
      ...view.document.querySelectorAll<SVGRectElement>("#sszvis-chart rect.sszvis-bar"),
    ];
    /* Still vertical: the bars share one width, where horizontal ones would share a height. */
    expect(new Set(bars.map((bar) => bar.getAttribute("width"))).size).toBe(1);
    expect(new Set(bars.map((bar) => bar.getAttribute("height"))).size).toBeGreaterThan(1);
  });

  test("should redraw at full width a chart edited while Code was showing", async () => {
    const view = await host({ recipe: "bar-chart-vertical" });
    await settle(
      () => status(view),
      (text) => text === "",
    );
    button(view, "Edit").click();
    await settle(
      () => view.document.querySelector('[role="checkbox"]'),
      (found) => found !== null,
    );
    button(view, "Code").click();
    view.document.querySelector<HTMLElement>('[role="checkbox"]')?.click();
    await settle(
      () => status(view),
      (text) => text === "",
    );
    button(view, "Preview").click();
    await new Promise((resolve) => setTimeout(resolve, 600));

    const widths = [...view.document.querySelectorAll("#sszvis-chart rect.sszvis-bar")].map((bar) =>
      Number(bar.getAttribute("width")),
    );
    expect(widths).toHaveLength(6);
    expect(Math.min(...widths)).toBeGreaterThan(10);
  });

  test("should report a chart that throws while it renders", async () => {
    const view = await host({ recipe: "bar-chart-vertical" });
    await settle(
      () => status(view),
      (text) => text === "",
    );
    button(view, "Edit").click();
    const box = await settle(
      () => view.document.querySelector<HTMLElement>('[role="checkbox"]'),
      (found) => found !== null,
    );
    /* sszvis calls render from requestAnimationFrame, after the chart's script has returned. */
    (view as Window & { sszvis: Record<string, unknown> }).sszvis["createSvgLayer"] = () => {
      throw new Error("boom in render");
    };
    box?.click();

    expect(
      await settle(
        () => status(view),
        (text) => text.includes("boom"),
      ),
    ).toContain("boom in render");
    expect(view.document.querySelector('[role="alert"]')?.textContent).toContain("boom in render");
  });

  test("should draw the table's text as written, and only as text in a tooltip", async () => {
    const payload = "<img src=x onerror=window.__pwned=1>";
    const view = await host(
      { recipe: "bar-chart-vertical", csv: `Sektor,Anzahl\nR&D,10\n"${payload}",20` },
      /* The default tooltip shows only the value; this one names the category too. */
      { spec: (spec) => ({ ...spec, tooltip: { header: "value", body: ["category"] } }) },
    );
    await settle(
      () => count(view, "rect.sszvis-bar"),
      (n) => n === 2,
    );

    /* The axis is SVG text: escaping the cells used to draw this as R&amp;D. */
    const ticks = [...view.document.querySelectorAll("#sszvis-chart .tick text")].map(
      (tick) => tick.textContent,
    );
    expect(ticks).toContain("R&D");

    /* Hover each bar until the payload's tooltip is up. */
    let shown = "";
    for (const bar of view.document.querySelectorAll<SVGRectElement>(
      "#sszvis-chart rect.sszvis-bar",
    )) {
      const box = bar.getBoundingClientRect();
      const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, bubbles: true };
      const target = view.document.elementFromPoint(at.clientX, at.clientY);
      target?.dispatchEvent(new MouseEvent("mouseover", { ...at, view }));
      target?.dispatchEvent(new MouseEvent("mousemove", { ...at, view }));
      shown = await settle(
        () => view.document.querySelector(".sszvis-tooltip")?.textContent ?? "",
        (text) => text.includes("img"),
        1000,
      );
      if (shown.includes("img")) break;
    }

    expect(shown).toContain(payload);
    expect(view.document.querySelector(".sszvis-tooltip img")).toBeNull();
    expect((view as Window & { __pwned?: number }).__pwned).toBeUndefined();
  });

  test("should end the wait and say so when the host cancels the call", async () => {
    const view = await host({ recipe: "bar-chart-vertical" }, { cancel: "user action" });

    expect(
      await settle(
        () => status(view),
        (text) => text.includes("cancelled"),
      ),
    ).toBe("The chart was cancelled: user action.");
  });

  test("should open with its panels when the host starts it fullscreen", async () => {
    const view = await host({ recipe: "bar-chart-vertical" }, { displayMode: "fullscreen" });
    await settle(
      () => status(view),
      (text) => text === "",
    );

    expect(findButton(view, "Horizontal bar")).toBeDefined();
    expect(findButton(view, "Done")).toBeDefined();
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
