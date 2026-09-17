import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rangeFlag from "../../src/annotation/rangeFlag.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

type TestDatum = {
  x: number;
  y0: number;
  y1: number;
};

describe("annotation/rangeFlag", () => {
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
    { x: 100, y0: 50, y1: 80 },
    // Same x as the first, so a flag that positioned by index rather than by datum shows up.
    { x: 100, y0: 60, y1: 90 },
  ];

  const flag = () =>
    rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

  const layer = () =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" }).selectGroup("rangeFlags");

  const marksOf = <D>(chartLayer: Layer<D>, edge: "top" | "bottom") =>
    chartLayer
      .selectAll(`circle.sszvis-rangeFlag__mark.${edge}`)
      .nodes()
      .map((node) => select(node))
      .map((c) => [Number(c.attr("cx")), Number(c.attr("cy")), Number(c.attr("r"))]);

  test("should snap a top and a bottom mark per datum onto the half-pixel grid", () => {
    const chartLayer = layer().datum(testData).call(flag());

    // The half-pixel offset is the crispness policy: a mark on a whole pixel straddles two
    // device pixels and renders blurred.
    expect(marksOf(chartLayer, "bottom")).toEqual(
      testData.map((d) => [d.x + 0.5, d.y0 + 0.5, 3.5]),
    );
    expect(marksOf(chartLayer, "top")).toEqual(testData.map((d) => [d.x + 0.5, d.y1 + 0.5, 3.5]));
  });

  test("should place a tooltip anchor midway between the two marks of each datum", () => {
    const chartLayer = layer().datum(testData).call(flag());

    // The exact `translate(x,y)` string is the anchor's contract: the tooltip measures the
    // rect this transform places, so any other serialisation is a different anchor.
    expect(
      chartLayer
        .selectAll("[data-tooltip-anchor]")
        .nodes()
        .map((node) => select(node).attr("transform")),
    ).toEqual(testData.map((d) => `translate(${d.x + 0.5},${(d.y0 + d.y1) / 2 + 0.5})`));
  });

  test("should render neither marks nor anchors when the data is empty", () => {
    const chartLayer = layer().datum([]).call(flag());

    expect(marksOf(chartLayer, "bottom")).toHaveLength(0);
    expect(marksOf(chartLayer, "top")).toHaveLength(0);
    expect(chartLayer.selectAll("[data-tooltip-anchor]").nodes()).toHaveLength(0);
  });

  test("should match the rendered flag count to the data when the data changes", () => {
    const flagComponent = flag();
    const chartLayer = layer();

    for (const count of [1, 2, 0]) {
      chartLayer.datum(testData.slice(0, count)).call(flagComponent);
      expect(marksOf(chartLayer, "bottom")).toHaveLength(count);
      expect(marksOf(chartLayer, "top")).toHaveLength(count);
    }
  });
});
