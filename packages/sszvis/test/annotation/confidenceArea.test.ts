import { type Selection, easePolyOut, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import confidenceArea from "../../src/annotation/confidenceArea.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

type TestDatum = {
  x: number;
  y0: number;
  y1: number;
};

type KeyedTestDatum = TestDatum & {
  id: string;
};

type WrappedTestData = {
  values: TestDatum[];
};

describe("annotation/confidenceArea", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /**
   * Resolves once a transition has actually moved `attr` on `node`, rather than after a fixed
   * delay. A fixed delay can overshoot the whole 300ms transition under load, which would let
   * these tests pass with the interrupt removed.
   */
  const untilMoved = (node: Element, attr: string) =>
    new Promise<void>((resolve) => {
      const from = node.getAttribute(attr);
      const check = () => (node.getAttribute(attr) === from ? setTimeout(check, 0) : resolve());
      check();
    });

  const testData: TestDatum[] = [
    { x: 0, y0: 50, y1: 80 },
    { x: 50, y0: 60, y1: 90 },
    { x: 100, y0: 40, y1: 70 },
    { x: 150, y0: 55, y1: 85 },
  ];

  const multiAreaData: TestDatum[][] = [
    [
      { x: 0, y0: 50, y1: 80 },
      { x: 50, y0: 60, y1: 90 },
    ],
    [
      { x: 0, y0: 30, y1: 40 },
      { x: 50, y0: 35, y1: 45 },
    ],
  ];

  const bounded = () =>
    confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

  const layer = (key = "test-layer") =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("areas");

  const paths = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("path.sszvis-area")
      .nodes()
      .map((node) => select(node));

  test("should trace one patterned path per series along its upper then lower bound", () => {
    const chartLayer = layer().datum(multiAreaData).call(bounded().transition(false));

    const rendered = paths(chartLayer);
    expect(rendered).toHaveLength(multiAreaData.length);
    expect(rendered.map((p) => p.attr("fill"))).toEqual([
      "url(#data-area-pattern)",
      "url(#data-area-pattern)",
    ]);
    // The emitted outline IS the contract here: along y1 left-to-right, back along y0, closed.
    expect(rendered.map((p) => p.attr("d"))).toEqual([
      "M0,80L50,90L50,60L0,50Z",
      "M0,40L50,45L50,35L0,30Z",
    ]);
    // The pattern the fill points at has to exist in the layer's defs, or the fill resolves to nothing.
    expect(chartLayer.select("defs pattern#data-area-pattern").node()).not.toBeNull();
  });

  test("should paint the outline when a stroke and a stroke width are given", () => {
    const chartLayer = layer()
      .datum([testData])
      .call(bounded().stroke("#ff0000").strokeWidth(2).transition(false));

    const [path] = paths(chartLayer);
    expect(path.style("stroke")).toBe("rgb(255, 0, 0)");
    expect(path.style("stroke-width")).toBe("2");
  });

  test("should trace the unwrapped values when a valuesAccessor is given", () => {
    const wrapped: WrappedTestData[] = [{ values: multiAreaData[0] }];

    const withAccessor = layer("wrapped")
      .datum(wrapped)
      .call(
        bounded()
          .valuesAccessor((d: unknown) => (d as WrappedTestData).values)
          .transition(false),
      );
    const plain = layer("plain").datum([multiAreaData[0]]).call(bounded().transition(false));

    // Unwrapping has to produce the same outline as passing the series directly; asserting
    // only that a path exists would pass with `valuesAccessor` ignored.
    expect(paths(withAccessor).map((p) => p.attr("d"))).toEqual(
      paths(plain).map((p) => p.attr("d")),
    );
  });

  test("should reuse each series' path element across a re-render when a key is given", () => {
    const keyed = (x: number): KeyedTestDatum[][] => [
      [
        { x, y0: 50, y1: 80, id: "area1" },
        { x: x + 50, y0: 60, y1: 90, id: "area1" },
      ],
      [
        { x, y0: 30, y1: 40, id: "area2" },
        { x: x + 50, y0: 35, y1: 45, id: "area2" },
      ],
    ];
    const areaComponent = bounded()
      .key((d: unknown) => (d as KeyedTestDatum[])[0].id)
      .transition(false);
    const chartLayer = layer();

    chartLayer.datum(keyed(0)).call(areaComponent);
    const before = paths(chartLayer).map((p) => p.node());

    chartLayer.datum(keyed(10)).call(areaComponent);
    const after = paths(chartLayer).map((p) => p.node());

    // Element identity, not just the count: an unkeyed join also keeps two paths, so only
    // identity shows the key matched the series across the update.
    expect(after).toEqual(before);
    expect(paths(chartLayer)[0].attr("d")).toBe("M10,80L60,90L60,60L10,50Z");
  });

  test("should render no paths when the data is empty", () => {
    const chartLayer = layer().datum([]).call(bounded());

    expect(paths(chartLayer)).toHaveLength(0);
  });

  test("should match the rendered path count to the data when the data changes", () => {
    const areaComponent = bounded().transition(false);
    const chartLayer = layer();

    for (const series of [[testData.slice(0, 2)], multiAreaData, []]) {
      chartLayer.datum(series).call(areaComponent);
      expect(paths(chartLayer)).toHaveLength(series.length);
    }
  });

  test("should not let an in-flight tween overwrite a later synchronous render", async () => {
    const areaOf = (transition: boolean) =>
      confidenceArea()
        .x((d: unknown) => (d as TestDatum).x)
        .y0((d: unknown) => (d as TestDatum).y0)
        .y1((d: unknown) => (d as TestDatum).y1)
        .transition(transition);
    const shifted = testData.map((d) => ({ ...d, y0: d.y0 + 100, y1: d.y1 + 100 }));

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "interrupted",
    }).selectGroup("areas");
    chartLayer.datum([testData]).call(areaOf(true));
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Schedules a tween towards the shifted outline.
    chartLayer.datum([shifted]).call(areaOf(true));
    await untilMoved(chartLayer.select("path.sszvis-area").node() as Element, "d");

    chartLayer.datum([testData]).call(areaOf(false));
    // Past the 300ms default, so an uninterrupted tween would have reached its destination.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const reference = createSvgLayer("#chart-container", undefined, { key: "reference" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaOf(false));
    expect(chartLayer.select("path.sszvis-area").attr("d")).toBe(
      reference.select("path.sszvis-area").attr("d"),
    );
  });

  test("should schedule exactly one 300ms easePolyOut tween when transitions are enabled", () => {
    const chartLayer = layer().datum([testData]).call(bounded().transition(true));

    // Deliberately coupled to d3's private `__transition`: duration and easing are only
    // observable from the outside through wall-clock sampling, which is flaky. Kept narrow
    // so the coupling is one lookup rather than a shape assertion.
    const path = chartLayer.select("path.sszvis-area").node() as Element & {
      __transition?: Record<string, unknown>;
    };
    const scheduled = Object.values(path.__transition ?? {}).filter(
      (v): v is { duration: number; ease: (t: number) => number } =>
        typeof v === "object" && v !== null && "duration" in v,
    );
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].duration).toBe(300);
    expect(scheduled[0].ease).toBe(easePolyOut);
  });
});
