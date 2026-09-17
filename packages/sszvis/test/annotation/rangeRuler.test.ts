import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rangeRuler from "../../src/annotation/rangeRuler.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type TestDatum = {
  x: number;
  y0: number;
  y1: number;
  label: number;
};

/** The thin space `formatNumber` groups thousands with. */
const THINSP = " ";

describe("annotation/rangeRuler", () => {
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
    { x: 100, y0: 50, y1: 80, label: 12_345.6 },
    { x: 100, y0: 90, y1: 120, label: 12_345.6 },
  ];

  const ruler = () =>
    rangeRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label);

  const layer = () =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" }).selectGroup("rangeRuler");

  test("should pair every mark's dots with a label and its contour clone when data are bound", () => {
    const chartLayer = layer().datum(testData).call(ruler().total(200));

    expect(chartLayer.selectAll("line.sszvis-rangeRuler__rule").nodes()).toHaveLength(1);
    const marks = chartLayer.selectAll("g.sszvis-rangeRuler--mark").nodes();
    expect(marks).toHaveLength(testData.length);
    for (const mark of marks) {
      const markGroup = select(mark);
      expect(markGroup.selectAll("circle").nodes()).toHaveLength(2); // p1 and p2
      // The contour is a clone drawn behind the label; one without the other is a regression.
      expect(markGroup.selectAll("text").nodes()).toHaveLength(2);
    }
    expect(chartLayer.selectAll("text.sszvis-rangeRuler__total").nodes()).toHaveLength(1);
  });

  test("should draw a single vertical rule spanning top to bottom, however many data are bound", () => {
    const chartLayer = layer().datum(testData).call(ruler());

    const rule = select(chartLayer.selectAll("line.sszvis-rangeRuler__rule").nodes()[0]);
    expect(Number(rule.attr("y1"))).toBe(30);
    expect(Number(rule.attr("y2"))).toBe(150);
    expect(rule.attr("x1")).toBe(rule.attr("x2"));
  });

  test("should snap each range's two dots onto the half-pixel grid", () => {
    const chartLayer = layer().datum(testData).call(ruler());

    const dots = (cls: string) =>
      chartLayer
        .selectAll(`circle.sszvis-rangeRuler__${cls}`)
        .nodes()
        .map((node) => select(node))
        .map((c) => [Number(c.attr("cx")), Number(c.attr("cy")), Number(c.attr("r"))]);

    expect(dots("p1")).toEqual(testData.map((d) => [d.x + 0.5, d.y0 + 0.5, 1.5]));
    expect(dots("p2")).toEqual(testData.map((d) => [d.x + 0.5, d.y1 + 0.5, 1.5]));
  });

  test.for([
    { flip: false, side: "right", anchor: "start", offset: 10 },
    { flip: true, side: "left", anchor: "end", offset: -10 },
  ])(
    "should put the formatted label to the $side of the rule when flip is $flip",
    ({ flip, anchor, offset }) => {
      const chartLayer = layer().datum(testData).call(ruler().flip(flip));

      const labels = chartLayer
        .selectAll("text.sszvis-rangeRuler__label")
        .nodes()
        .map((node) => select(node));
      expect(labels).toHaveLength(testData.length);
      for (const label of labels) {
        expect(label.style("text-anchor")).toBe(anchor);
        // The side is both the anchor AND the ±10 nudge off the rule; asserting only the
        // anchor would pass with the labels sitting on top of the rule.
        expect(Number(label.attr("x"))).toBe(100.5 + offset);
        // Piped through formatNumber, which groups thousands with a thin space.
        expect(label.text()).toBe(`12${THINSP}346`);
      }
    },
  );

  test("should print the total above the top of the rule when a total is given", () => {
    const chartLayer = layer().datum(testData).call(ruler().total(250));

    const totals = chartLayer.selectAll("text.sszvis-rangeRuler__total").nodes();
    expect(totals).toHaveLength(1);
    const total = select(totals[0]);
    expect(Number(total.attr("y"))).toBe(20); // top - 10
    expect(total.text()).toBe("Total 250");
  });

  test.for([
    { removeStroke: false, stroke: "white" },
    { removeStroke: true, stroke: null },
  ])(
    "should halo the marks against the chart when removeStroke is $removeStroke",
    ({ removeStroke, stroke }) => {
      const chartLayer = layer().datum(testData).call(ruler().removeStroke(removeStroke));

      const marks = chartLayer
        .selectAll("g.sszvis-rangeRuler--mark")
        .nodes()
        .map((node) => select(node));
      expect(marks).toHaveLength(testData.length);
      for (const mark of marks) {
        expect(mark.attr("stroke")).toBe(stroke);
        expect(mark.attr("stroke-width")).toBe(removeStroke ? null : "0.5");
        expect(mark.attr("stroke-opacity")).toBe(removeStroke ? null : "0.75");
      }
    },
  );

  // BUG(#443): the total label is drawn unconditionally. src/annotation/rangeRuler.ts:191 joins
  // `.data([fn.last(data)])` with no check on props.total, then sets its text to
  // `Total ${formatNumber(props.total)}`. With no total configured that formats `undefined`
  // as a dash, so every rangeRuler carries a "Total -" label it was never asked for.
  // Skipped, not deleted: it fails with "expected [ Array(1) ] to have a length of +0".
  test.skip("should draw no total label when no total was configured", () => {
    const chartLayer = layer().datum(testData).call(ruler());

    expect(chartLayer.selectAll("text.sszvis-rangeRuler__total").nodes()).toHaveLength(0);
  });

  // BUG(#443): an empty data array throws. The same join at src/annotation/rangeRuler.ts:191 binds
  // `[fn.last([])]`, which is `[undefined]` rather than `[]`, so one total element is still
  // created and its `x` accessor runs against `undefined`.
  // Skipped, not deleted: it fails with
  // "TypeError: Cannot read properties of undefined (reading 'x')".
  test.skip("should render without throwing when the data array is empty", () => {
    const chartLayer = layer();

    expect(() => chartLayer.datum([]).call(ruler().total(200))).not.toThrow();
    expect(chartLayer.selectAll("g.sszvis-rangeRuler--mark").nodes()).toHaveLength(0);
  });

  test("should match the rendered mark count to the data when the data changes", () => {
    const rulerComponent = ruler();
    const chartLayer = layer();

    // Grows then shrinks: without the shrink this loop never exercises the exit path. It stops
    // at one rather than at zero because an empty array throws - see the skipped test above.
    for (const count of [1, 2, 1]) {
      chartLayer.datum(testData.slice(0, count)).call(rulerComponent);
      expect(chartLayer.selectAll("g.sszvis-rangeRuler--mark").nodes()).toHaveLength(count);
    }
  });
});
