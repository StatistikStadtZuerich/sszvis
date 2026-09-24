import * as d3 from "d3";
import * as sszvis from "sszvis";
import tsBlankSpace from "ts-blank-space";
import { afterEach, describe, expect, test } from "vitest";

/*
 * What the library's own examples draw, for the one thing no other suite can see.
 *
 * `tsc -p examples/tsconfig.json` proves every example type-checks against the real
 * library, and the Playwright suite screenshots them at rest. Neither notices a colour
 * that is wrong: `sszvis.scaleQual12()` has an `unknown` value, so an ordinal scale
 * without a domain answers the same colour for every key, before and after `darker()`.
 * A chart built that way highlights the hovered bar in the colour it already had -
 * valid TypeScript, an identical screenshot, and an interaction that does nothing.
 *
 * So this runs the examples the way the generated page does and reads the fills back.
 */

/* The same `?raw` sources the examples plugin inlines into the page it generates. */
const SOURCES = import.meta.glob<string>("../examples/*/*/chart.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

const DATA = import.meta.glob<string>("../examples/*/*/data.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The data marks, as against the legend circles and tooltip anchors a bar chart also draws. */
const BARS = "rect.sszvis-bar";

/** The chart's interaction surface, which is what the move behaviour listens on. */
const SURFACE = "rect.sszvis-interactive";

const fills = (container: HTMLElement) =>
  [...container.querySelectorAll(BARS)].map((bar) => bar.getAttribute("fill"));

/** How many colours the bars are drawn in: one at rest, two once one is picked out. */
const distinctFills = (container: HTMLElement) => new Set(fills(container)).size;

/** The width the chart lays itself out for; sszvis measures the container, so it needs one. */
const WIDTH = 800;

/** How long to let a chart finish drawing before reading it. */
const PAINT_TIMEOUT_MS = 5000;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/* The chart reads its data over the network. A data: URL keeps that real without a server. */
const csvUrl = (csv: string) => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

const sourceOrThrow = (files: Record<string, string>, example: string, file: string): string => {
  const source = files[`../examples/${example}/${file}`];
  if (source === undefined) throw new Error(`No ${file} for the example "${example}"`);
  return source;
};

/** The apps drawn by the current test, so that `afterEach` can release them. */
const apps: sszvis.AppHandle[] = [];

/* Annotated rather than parameterised, so `props` picks up `app`'s own generics. */
const trackedApp: typeof sszvis.app = (props) => {
  const handle = sszvis.app(props);
  apps.push(handle);
  return handle;
};

const withTrackedApp = (module: typeof sszvis): typeof sszvis => ({ ...module, app: trackedApp });

afterEach(() => {
  /* The listener first, then the node it would have rendered into. */
  for (const app of apps.splice(0)) app.destroy();
  document.body.innerHTML = "";
});

/**
 * Waits until the chart has drawn the marks it is going to draw.
 *
 * `sszvis.app` renders on an animation frame and its `init` awaits a fetch first, so a
 * test that reads the container straight after mounting sees it empty. It waits for the
 * count to reach `expected` and then settle for a frame rather than for a duration, so a
 * loaded machine slows the run down instead of failing it. A chart that draws the wrong
 * number still fails, by timing out and asserting whatever it did draw.
 */
const painted = async (container: HTMLElement, expected: number) => {
  const deadline = Date.now() + PAINT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await frame();
    if (container.querySelectorAll(BARS).length >= expected) {
      await frame();
      return;
    }
  }
};

/** Runs an example in a container of its own and hands back that container. */
const draw = async (example: string, bars: number): Promise<HTMLElement> => {
  const js = tsBlankSpace(sourceOrThrow(SOURCES, example, "chart.ts"));

  const container = document.createElement("div");
  /* The id every example.json names, so the example's own `config.id` finds it. */
  container.id = "sszvis-chart";
  container.style.width = `${WIDTH}px`;
  document.body.append(container);

  const config = {
    data: csvUrl(sourceOrThrow(DATA, example, "data.csv")),
    id: `#${container.id}`,
    fallback: "",
  };

  /*
   * The example is a script, not a module: it reads `d3`, `sszvis` and `config` as
   * globals, exactly as the page the examples plugin generates supplies them. Running it
   * through `new Function` rather than an import is what keeps this the real artefact.
   *
   * The `sszvis` it is handed is the real module with `app` wrapped, so the handle the
   * example throws away is kept for `afterEach`. A chart holds its container through a
   * resize listener on the window, which removing the DOM does not release.
   */
  new Function("d3", "sszvis", "config", js)(d3, withTrackedApp(sszvis), config);

  await painted(container, bars);
  return container;
};

/** Moves the pointer onto the chart, over the first band of whichever axis is categorical. */
const hover = async (container: HTMLElement) => {
  const surface = container.querySelector(SURFACE);
  if (surface === null) throw new Error("the chart has no interaction surface");
  const box = surface.getBoundingClientRect();
  for (const type of ["mouseover", "mousemove"]) {
    surface.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        clientX: box.left + box.width / 12,
        clientY: box.top + box.height / 12,
      }),
    );
  }
  await frame();
  await frame();
};

describe("the highlight on a hovered bar", () => {
  /* The examples that pick a bar out under the pointer, and how many bars they draw. */
  const HOVERED: ReadonlyArray<{ readonly example: string; readonly count: number }> = [
    /* Seven sectors, one bar each - including "Bau", which has no value and so
       draws a bar of no height rather than none at all. */
    { example: "bar-chart-vertical/basic", count: 7 },
    /* Thirteen sectors, for the year the button group opens on. */
    { example: "bar-chart-horizontal/interactive", count: 13 },
    /* Ninety-four years of hotel nights, one narrow bar each. */
    { example: "bar-chart-vertical/many-years", count: 94 },
  ];

  for (const { example, count } of HOVERED) {
    test(`should not be the colour the bar already was in ${example}`, async () => {
      const container = await draw(example, count);

      expect(fills(container)).toHaveLength(count);
      expect(distinctFills(container), "the bars start out one colour").toBe(1);

      await hover(container);

      /*
       * One bar picked out and the rest left alone. A count of one here is the bug: the
       * chart selected a bar, drew it in `barFillHighlight`, and that was the same colour.
       */
      expect(distinctFills(container)).toBe(2);
    });
  }
});

describe("the highlight on the bar a button group selects", () => {
  test("should not be the colour the bar already was", async () => {
    /* Seven categories, and the button group opens on the first of them. */
    const container = await draw("bar-chart-horizontal/long-labels", 7);

    expect(fills(container)).toHaveLength(7);

    /* Selected from the first render, so no interaction is needed to see the highlight. */
    expect(distinctFills(container)).toBe(2);
  });
});
