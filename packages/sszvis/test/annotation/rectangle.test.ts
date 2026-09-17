import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rectangle from "../../src/annotation/rectangle.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

type TestDatum = {
  x: number;
  y: number;
  width: number;
  height: number;
  caption?: string;
  dx?: number;
  dy?: number;
};

describe("annotation/rectangle", () => {
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
    { x: 50, y: 60, width: 100, height: 80 },
    { x: 200, y: 100, width: 120, height: 60 },
    { x: 10, y: 200, width: 80, height: 40 },
  ];

  const testDataWithCaptions: TestDatum[] = [
    { x: 50, y: 60, width: 100, height: 80, caption: "Area A", dx: 15, dy: -10 },
    { x: 200, y: 100, width: 120, height: 60, caption: "Area B", dx: -20, dy: 8 },
  ];

  const layer = () =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" }).selectGroup("rectangles");

  const rects = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("rect.sszvis-dataarearectangle")
      .nodes()
      .map((node) => select(node));

  const captions = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("text.sszvis-dataarearectangle__caption")
      .nodes()
      .map((node) => select(node));

  const positioned = () =>
    rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

  test("should render one patterned rect per datum at the box its accessors report", () => {
    const chartLayer = layer().datum(testData).call(positioned());

    const rendered = rects(chartLayer);
    expect(rendered).toHaveLength(testData.length);
    expect(
      rendered.map((r) => ({
        x: Number(r.attr("x")),
        y: Number(r.attr("y")),
        width: Number(r.attr("width")),
        height: Number(r.attr("height")),
        fill: r.attr("fill"),
      })),
    ).toEqual(
      testData.map((d) => ({
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        fill: "url(#data-area-pattern)",
      })),
    );
    // The pattern the fill points at has to exist in the layer's defs, or the fill resolves to nothing.
    expect(chartLayer.select("defs pattern#data-area-pattern").node()).not.toBeNull();
  });

  test("should centre each caption inside its rect when a caption accessor is set", () => {
    const chartLayer = layer()
      .datum(testDataWithCaptions)
      .call(positioned().caption((d) => d.caption || ""));

    expect(
      captions(chartLayer).map((c) => ({
        x: Number(c.attr("x")),
        y: Number(c.attr("y")),
        text: c.text(),
      })),
    ).toEqual(
      testDataWithCaptions.map((d) => ({
        x: d.x + d.width / 2,
        y: d.y + d.height / 2,
        text: d.caption,
      })),
    );
  });

  test("should render no captions when no caption accessor is set", () => {
    const chartLayer = layer().datum(testDataWithCaptions).call(positioned());

    expect(captions(chartLayer)).toHaveLength(0);
  });

  test("should shift each caption off the centre by its own dx and dy when offsets are set", () => {
    const chartLayer = layer()
      .datum(testDataWithCaptions)
      .call(
        positioned()
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
      .call(rectangle().x(150).y(125).width(100).height(50).caption("Fixed Rectangle"));

    const [rendered] = rects(chartLayer);
    expect([
      Number(rendered.attr("x")),
      Number(rendered.attr("y")),
      Number(rendered.attr("width")),
      Number(rendered.attr("height")),
    ]).toEqual([150, 125, 100, 50]);
    expect(captions(chartLayer).map((c) => c.text())).toEqual(["Fixed Rectangle"]);
  });

  test("should render neither rects nor captions when the data is empty", () => {
    const chartLayer = layer()
      .datum([])
      .call(positioned().caption((d) => d.caption || ""));

    expect(rects(chartLayer)).toHaveLength(0);
    expect(captions(chartLayer)).toHaveLength(0);
  });

  test("should match the rendered rect count to the data when the data changes", () => {
    const rectangleComponent = positioned();
    const chartLayer = layer();

    for (const count of [2, 3, 1, 0]) {
      chartLayer.datum(testData.slice(0, count)).call(rectangleComponent);
      expect(rects(chartLayer)).toHaveLength(count);
    }
  });

  test("should still emit a rect when a datum collapses to a zero width or height", () => {
    const chartLayer = layer()
      .datum([
        { x: 50, y: 60, width: 0, height: 80 },
        { x: 200, y: 100, width: 120, height: 0 },
      ])
      .call(positioned());

    expect(
      rects(chartLayer).map((r) => [Number(r.attr("width")), Number(r.attr("height"))]),
    ).toEqual([
      [0, 80],
      [120, 0],
    ]);
  });
});
