import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rectangle from "../../src/annotation/rectangle.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheAnnotation } from "../support/annotationConformance.js";
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

  const layer = (key = "test-layer") =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("rectangles");

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

  const rectNodes = (node: Element) => [...node.querySelectorAll("rect.sszvis-dataarearectangle")];
  const captionNodes = (node: Element) => [
    ...node.querySelectorAll("text.sszvis-dataarearectangle__caption"),
  ];

  describesTheAnnotation<TestDatum, { x: number; y: number; text: string }>(() => ({
    make: positioned,
    renderInto: (key, component, data) =>
      layer(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ rects: rectNodes(node).length, captions: captionNodes(node).length }),
    full: { data: testData, marks: { rects: 3, captions: 0 } },
    smaller: { data: testData.slice(0, 1), marks: { rects: 1, captions: 0 } },
    patternFill: { marks: rectNodes, patternId: "data-area-pattern" },
    captions: {
      withCaptions: () => positioned().caption((d) => d.caption ?? ""),
      withOffsets: () =>
        positioned()
          .caption((d) => d.caption ?? "")
          .dx((d) => d.dx ?? 0)
          .dy((d) => d.dy ?? 0),
      withoutCaptions: positioned,
      data: testDataWithCaptions,
      marks: captionNodes,
      placementOf: (mark) => ({
        x: Number(mark.getAttribute("x")),
        y: Number(mark.getAttribute("y")),
        text: mark.textContent ?? "",
      }),
      expectedPlacements: testDataWithCaptions.map((d) => ({
        x: d.x + d.width / 2,
        y: d.y + d.height / 2,
        text: d.caption ?? "",
      })),
      expectedOffsets: testDataWithCaptions.map((d) => [d.dx ?? 0, d.dy ?? 0]),
    },
  }));

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
