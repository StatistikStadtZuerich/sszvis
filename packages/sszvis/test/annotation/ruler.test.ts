import { type Selection, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { annotationRuler } from "../../src/annotation/ruler.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

type TestDatum = {
  x: number;
  y: number;
  label: string;
  color?: string;
};

/** Reads a label's placement without depending on how d3 serialises the transform. */
const translateOf = (transform: string | null): [number, number] => {
  const match = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(transform ?? "");
  if (!match) throw new Error(`no translate in ${transform}`);
  return [Number(match[1]), Number(match[2])];
};

describe("annotation/ruler", () => {
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
    { x: 100, y: 50, label: "Point A", color: "red" },
    { x: 100, y: 80, label: "Point B", color: "blue" },
    { x: 100, y: 110, label: "Point C", color: "green" },
  ];

  const ruler = () =>
    annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label);

  const layer = (key = "test-layer") =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("ruler");

  const all = <D>(chartLayer: Layer<D>, selector: string) =>
    chartLayer
      .selectAll(selector)
      .nodes()
      .map((node) => select(node));

  test("should pair every datum's rule and dot with a label and its outline", () => {
    const chartLayer = layer()
      .datum(testData)
      .call(ruler().color((d: unknown) => (d as TestDatum).color || "black"));

    expect(all(chartLayer, "line.sszvis-ruler__rule")).toHaveLength(3);
    expect(all(chartLayer, "circle.sszvis-ruler__dot")).toHaveLength(3);
    expect(all(chartLayer, "text.sszvis-ruler__label")).toHaveLength(3);
    // The outline is drawn behind the label; one without the other is a regression.
    expect(all(chartLayer, "text.sszvis-ruler__label-outline")).toHaveLength(3);
  });

  test("should run each rule from its own datum down to the shared bottom", () => {
    const chartLayer = layer().datum(testData).call(ruler().color("black"));

    expect(
      all(chartLayer, "line.sszvis-ruler__rule").map((l) => [
        Number(l.attr("x1")),
        Number(l.attr("y1")),
        Number(l.attr("x2")),
        Number(l.attr("y2")),
      ]),
    ).toEqual(testData.map((d) => [d.x + 0.5, d.y, d.x + 0.5, 150]));
  });

  test("should clamp the rule to top for a datum above it", () => {
    const chartLayer = layer()
      .datum([{ x: 40, y: 10, label: "Above", color: "red" }])
      .call(
        annotationRuler()
          .x((d: unknown) => (d as TestDatum).x)
          .y((d: unknown) => (d as TestDatum).y)
          .top(50)
          .bottom(200)
          .label((d: unknown) => (d as TestDatum).label),
      );

    const line = select(chartLayer.select("line.sszvis-ruler__rule").node());
    expect(Number(line.attr("y1"))).toBe(50);
    expect(Number(line.attr("y2"))).toBe(200);

    // The dot and its label mark the datum, so they stay where the datum is.
    const dot = select(chartLayer.select("circle.sszvis-ruler__dot").node());
    expect(Number(dot.attr("cy"))).toBe(10.5);
    const label = select(chartLayer.select("text.sszvis-ruler__label").node());
    expect(translateOf(label.attr("transform"))).toEqual([50.5, 15.5]);
  });

  test("should treat a top of 0 as a real boundary", () => {
    const chartLayer = layer()
      .datum([{ x: 40, y: -20, label: "Overflow" }])
      .call(
        annotationRuler()
          .x((d: unknown) => (d as TestDatum).x)
          .y((d: unknown) => (d as TestDatum).y)
          .top(0)
          .bottom(200),
      );

    const line = select(chartLayer.select("line.sszvis-ruler__rule").node());
    expect(Number(line.attr("y1"))).toBe(0);
  });

  test("should start the rule at the datum when no top is supplied", () => {
    const chartLayer = layer()
      .datum([{ x: 40, y: -20, label: "Unbounded" }])
      .call(
        annotationRuler()
          .x((d: unknown) => (d as TestDatum).x)
          .y((d: unknown) => (d as TestDatum).y)
          .bottom(200),
      );

    const line = select(chartLayer.select("line.sszvis-ruler__rule").node());
    expect(Number(line.attr("y1"))).toBe(-20);
  });

  test("should snap each dot onto the half-pixel grid and fill it from the colour accessor", () => {
    const chartLayer = layer()
      .datum(testData)
      .call(ruler().color((d: unknown) => (d as TestDatum).color || "black"));

    expect(
      all(chartLayer, "circle.sszvis-ruler__dot").map((dot) => [
        Number(dot.attr("cx")),
        Number(dot.attr("cy")),
        Number(dot.attr("r")),
        dot.attr("fill"),
      ]),
    ).toEqual(testData.map((d) => [d.x + 0.5, d.y + 0.5, 3.5, d.color]));
  });

  test("should pass the index to the color accessor", () => {
    const chartLayer = layer("color-index-layer")
      .datum(testData)
      .call(ruler().color((_d: unknown, i: number) => ["red", "blue", "green"][i]));

    expect(all(chartLayer, "circle.sszvis-ruler__dot").map((dot) => dot.attr("fill"))).toEqual([
      "red",
      "blue",
      "green",
    ]);
  });

  test.for([
    { flip: false, side: "right", anchor: "start", x: 110.5 },
    { flip: true, side: "left", anchor: "end", x: 90.5 },
  ])("should set the label to the $side of the rule when flip is $flip", ({ flip, anchor, x }) => {
    const chartLayer = layer().datum(testData).call(ruler().color("black").flip(flip));

    const labels = all(chartLayer, "text.sszvis-ruler__label");
    expect(labels).toHaveLength(testData.length);
    labels.forEach((label, i) => {
      expect(translateOf(label.attr("transform"))[0]).toBe(x);
      expect(label.style("text-anchor")).toBe(anchor);
      // `.html()`, not `.text()`: labels are rendered as HTML.
      expect(label.html()).toBe(testData[i].label);
    });
  });

  test("should decide the side per datum when flip is an accessor", () => {
    const chartLayer = layer()
      .datum([
        { x: 100, y: 50, label: "Right Label" },
        { x: 100, y: 80, label: "Left Label" },
      ])
      .call(
        ruler()
          .color("black")
          .flip((d: unknown) => (d as TestDatum).label.includes("Left")),
      );

    expect(
      all(chartLayer, "text.sszvis-ruler__label").map((label) => [
        translateOf(label.attr("transform"))[0],
        label.style("text-anchor"),
      ]),
    ).toEqual([
      [110.5, "start"],
      [90.5, "end"],
    ]);
  });

  test.for([
    // The label nudge used to be `2 * y` for a dot above `top`, which pushed the label
    // well below its own dot. src/control/handleRuler.ts carries the same expression.
    { where: "above the top", y: 10, expected: 15.5 },
    // The worst case for the old arithmetic: y = 29 with top = 30 landed at 63.5.
    { where: "just below the top threshold", y: 29, expected: 34.5 },
    { where: "on the ruler", y: 80, expected: 85.5 },
    // Only a dot past `bottom` drops the nudge entirely.
    { where: "below the bottom", y: 160, expected: 160.5 },
  ])("should nudge the label by a constant when the dot is $where", ({ y, expected }) => {
    const chartLayer = layer()
      .datum([{ x: 100, y, label: "label" }])
      .call(ruler());

    const label = all(chartLayer, "text.sszvis-ruler__label")[0];
    expect(translateOf(label.attr("transform"))).toEqual([110.5, expected]);
  });

  test.for([
    { reduceOverlap: true, separated: true },
    { reduceOverlap: false, separated: false },
  ])(
    "should pull overlapping labels apart when reduceOverlap is $reduceOverlap",
    ({ reduceOverlap, separated }) => {
      const chartLayer = layer()
        .datum([
          { x: 100, y: 50, label: "Very Long Label A" },
          { x: 100, y: 52, label: "Very Long Label B" },
          { x: 100, y: 54, label: "Very Long Label C" },
        ])
        .call(ruler().color("black").reduceOverlap(reduceOverlap));

      const shifts = all(chartLayer, "text.sszvis-ruler__label").map((label) =>
        Number(label.attr("y") || 0),
      );
      expect(shifts).toHaveLength(3);

      if (separated) {
        // The three labels sit 2px apart but are a line-height tall, so the relaxation has to
        // push the outer two away from the middle one in opposite directions.
        expect(shifts[0]).toBeLessThan(0);
        expect(shifts[2]).toBeGreaterThan(0);
        expect(shifts[2] - shifts[0]).toBeGreaterThan(4);
      } else {
        expect(shifts).toEqual([0, 0, 0]);
      }
    },
  );

  test("should reuse each label element across a re-render when a labelId is given", () => {
    const rulerComponent = ruler()
      .color("black")
      .labelId((d: unknown) => (d as TestDatum).label);
    const chartLayer = layer();

    chartLayer
      .datum([
        { x: 100, y: 50, label: "Item 1" },
        { x: 100, y: 80, label: "Item 2" },
      ])
      .call(rulerComponent);
    const before = all(chartLayer, "text.sszvis-ruler__label").map((l) => l.node());

    chartLayer
      .datum([
        { x: 120, y: 60, label: "Item 1" },
        { x: 120, y: 90, label: "Item 2" },
      ])
      .call(rulerComponent);
    const after = all(chartLayer, "text.sszvis-ruler__label").map((l) => l.node());

    // Element identity, not just the count: an index key also keeps two labels, so only
    // identity shows the labelId matched the data across the update.
    expect(after).toEqual(before);
    expect(translateOf(after.map((n) => select(n).attr("transform"))[0])[0]).toBe(130.5);
  });

  test("should render no rules, dots or labels when the data is empty", () => {
    const chartLayer = layer().datum([]).call(ruler().color("black"));

    expect(all(chartLayer, "line.sszvis-ruler__rule")).toHaveLength(0);
    expect(all(chartLayer, "circle.sszvis-ruler__dot")).toHaveLength(0);
    expect(all(chartLayer, "text.sszvis-ruler__label")).toHaveLength(0);
  });

  test("should match the rendered rule and dot count to the data when the data changes", () => {
    const rulerComponent = ruler().color("black");
    const chartLayer = layer();

    for (const count of [1, 3, 0]) {
      chartLayer.datum(testData.slice(0, count)).call(rulerComponent);
      expect(all(chartLayer, "line.sszvis-ruler__rule")).toHaveLength(count);
      expect(all(chartLayer, "circle.sszvis-ruler__dot")).toHaveLength(count);
    }
  });
});
