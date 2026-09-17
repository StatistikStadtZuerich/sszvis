import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import circle from "../../src/annotation/circle.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

type TestDatum = {
  x: number;
  y: number;
  r: number;
  caption?: string;
  dx?: number;
  dy?: number;
};

describe("annotation/circle", () => {
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

  const testData: TestDatum[] = [
    { x: 100, y: 150, r: 30 },
    { x: 200, y: 100, r: 25 },
    { x: 300, y: 200, r: 40 },
  ];

  const testDataWithCaptions: TestDatum[] = [
    { x: 100, y: 150, r: 30, caption: "Area A", dx: 15, dy: -10 },
    { x: 200, y: 100, r: 25, caption: "Area B", dx: -20, dy: 8 },
  ];

  const layer = () =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" }).selectGroup("circles");

  const circles = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("circle.sszvis-dataareacircle")
      .nodes()
      .map((node) => select(node));

  const captions = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("text.sszvis-dataareacircle__caption")
      .nodes()
      .map((node) => select(node));

  test("should render one patterned circle per datum at the position its accessors report", () => {
    const chartLayer = layer()
      .datum(testData)
      .call(
        circle<TestDatum>()
          .x((d) => d.x)
          .y((d) => d.y)
          .r((d) => d.r),
      );

    const rendered = circles(chartLayer);
    expect(rendered).toHaveLength(testData.length);
    expect(
      rendered.map((c) => ({
        cx: Number(c.attr("cx")),
        cy: Number(c.attr("cy")),
        r: Number(c.attr("r")),
        fill: c.attr("fill"),
      })),
    ).toEqual(testData.map((d) => ({ cx: d.x, cy: d.y, r: d.r, fill: "url(#data-area-pattern)" })));
    // The pattern the fill points at has to exist in the layer's defs, or the fill resolves to nothing.
    expect(chartLayer.select("defs pattern#data-area-pattern").node()).not.toBeNull();
  });

  test("should render a caption at each circle's centre when a caption accessor is set", () => {
    const chartLayer = layer()
      .datum(testDataWithCaptions)
      .call(
        circle<TestDatum>()
          .x((d) => d.x)
          .y((d) => d.y)
          .r((d) => d.r)
          .caption((d) => d.caption || ""),
      );

    expect(
      captions(chartLayer).map((c) => ({
        x: Number(c.attr("x")),
        y: Number(c.attr("y")),
        text: c.text(),
      })),
    ).toEqual(testDataWithCaptions.map((d) => ({ x: d.x, y: d.y, text: d.caption })));
  });

  test("should render no captions when no caption accessor is set", () => {
    const chartLayer = layer()
      .datum(testDataWithCaptions)
      .call(
        circle<TestDatum>()
          .x((d) => d.x)
          .y((d) => d.y)
          .r((d) => d.r),
      );

    expect(captions(chartLayer)).toHaveLength(0);
  });

  test("should shift each caption off the centre by its own dx and dy when offsets are set", () => {
    const chartLayer = layer()
      .datum(testDataWithCaptions)
      .call(
        circle<TestDatum>()
          .x((d) => d.x)
          .y((d) => d.y)
          .r((d) => d.r)
          .caption((d) => d.caption || "")
          .dx((d) => d.dx ?? 0)
          .dy((d) => d.dy ?? 0),
      );

    expect(captions(chartLayer).map((c) => [Number(c.attr("dx")), Number(c.attr("dy"))])).toEqual(
      testDataWithCaptions.map((d) => [d.dx, d.dy]),
    );
  });

  test("should read fixed values when scalars are passed instead of accessors", () => {
    const chartLayer = layer()
      .datum([{}])
      .call(circle().x(150).y(125).r(35).caption("Fixed Circle"));

    const [rendered] = circles(chartLayer);
    expect([
      Number(rendered.attr("cx")),
      Number(rendered.attr("cy")),
      Number(rendered.attr("r")),
    ]).toEqual([150, 125, 35]);
    expect(captions(chartLayer).map((c) => c.text())).toEqual(["Fixed Circle"]);
  });

  test("should render neither circles nor captions when the data is empty", () => {
    const chartLayer = layer()
      .datum([])
      .call(
        circle<TestDatum>()
          .x((d) => d.x)
          .y((d) => d.y)
          .r((d) => d.r)
          .caption((d) => d.caption || ""),
      );

    expect(circles(chartLayer)).toHaveLength(0);
    expect(captions(chartLayer)).toHaveLength(0);
  });

  test("should match the rendered circle count to the data when the data changes", () => {
    const circleComponent = circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);
    const chartLayer = layer();

    for (const count of [2, 3, 1, 0]) {
      chartLayer.datum(testData.slice(0, count)).call(circleComponent);
      expect(circles(chartLayer)).toHaveLength(count);
    }
  });
});
