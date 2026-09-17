import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import circle from "../../src/annotation/circle.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheAnnotation } from "../support/annotationConformance.js";
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

  const layer = (key = "test-layer") =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("circles");

  const positioned = () =>
    circle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .r((d) => d.r);

  const circleNodes = (node: Element) => [...node.querySelectorAll("circle.sszvis-dataareacircle")];
  const captionNodes = (node: Element) => [
    ...node.querySelectorAll("text.sszvis-dataareacircle__caption"),
  ];

  describesTheAnnotation<TestDatum, { x: number; y: number; text: string }>(() => ({
    make: positioned,
    renderInto: (key, component, data) =>
      layer(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ circles: circleNodes(node).length, captions: captionNodes(node).length }),
    full: { data: testData, marks: { circles: 3, captions: 0 } },
    smaller: { data: testData.slice(0, 1), marks: { circles: 1, captions: 0 } },
    patternFill: { marks: circleNodes, patternId: "data-area-pattern" },
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
        x: d.x,
        y: d.y,
        text: d.caption ?? "",
      })),
      expectedOffsets: testDataWithCaptions.map((d) => [d.dx ?? 0, d.dy ?? 0]),
    },
  }));

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
});
