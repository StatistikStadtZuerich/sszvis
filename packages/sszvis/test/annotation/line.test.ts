import { type Selection, type ScaleLinear, scaleLinear, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import line from "../../src/annotation/line.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** Any group layer these tests render into, whatever datum is currently bound. */
type Layer<D> = Selection<SVGGElement, D, SVGGElement, number>;

/**
 * Reads the caption's placement out of its transform without depending on how d3
 * serialises it, so a whitespace or separator change cannot fail a correct render.
 */
const placementOf = (transform: string | null) => {
  const translate = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(transform ?? "");
  const rotate = /rotate\(\s*(-?[\d.]+)\s*\)/.exec(transform ?? "");
  if (!translate || !rotate) throw new Error(`no translate+rotate in ${transform}`);
  return {
    at: [Number(translate[1]), Number(translate[2])] as [number, number],
    angle: Number(rotate[1]),
  };
};

describe("annotation/line", () => {
  let container: HTMLDivElement;
  let xScale: ScaleLinear<number, number>;
  let yScale: ScaleLinear<number, number>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    xScale = scaleLinear().domain([0, 100]).range([0, 400]);
    yScale = scaleLinear().domain([0, 100]).range([300, 0]); // Inverted for typical chart coordinates
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const singleDatum = [{}];

  const layer = () =>
    createSvgLayer("#chart-container", undefined, { key: "test-layer" }).selectGroup("lines");

  const lines = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("line.sszvis-referenceline")
      .nodes()
      .map((node) => select(node));

  const captions = <D>(chartLayer: Layer<D>) =>
    chartLayer
      .selectAll("text.sszvis-referenceline__caption")
      .nodes()
      .map((node) => select(node));

  test("should scale both endpoints through the chart scales when coordinates are given in data units", () => {
    const chartLayer = layer()
      .datum(singleDatum)
      .call(line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale));

    const rendered = lines(chartLayer);
    expect(rendered).toHaveLength(1);
    expect([
      Number(rendered[0].attr("x1")),
      Number(rendered[0].attr("y1")),
      Number(rendered[0].attr("x2")),
      Number(rendered[0].attr("y2")),
    ]).toEqual([xScale(10), yScale(20), xScale(90), yScale(80)]);
  });

  test.for([
    // The angle is the slope on screen, so it follows the (non-square) scale ranges,
    // and it is negative because the y scale is inverted.
    { shape: "diagonal", x1: 0, y1: 0, x2: 60, y2: 60, angle: -36.8699 },
    { shape: "horizontal", x1: 10, y1: 50, x2: 90, y2: 50, angle: 0 },
    { shape: "vertical", x1: 50, y1: 10, x2: 50, y2: 90, angle: -90 },
  ])(
    "should place the caption at the line's midpoint rotated to its slope when the line is $shape",
    ({ x1, y1, x2, y2, angle }) => {
      const chartLayer = layer()
        .datum(singleDatum)
        .call(
          line().x1(x1).y1(y1).x2(x2).y2(y2).xScale(xScale).yScale(yScale).caption("Test Line"),
        );

      const rendered = captions(chartLayer);
      expect(rendered).toHaveLength(1);
      expect(rendered[0].text()).toBe("Test Line");

      const { at, angle: renderedAngle } = placementOf(rendered[0].attr("transform"));
      expect(at[0]).toBeCloseTo((xScale(x1) + xScale(x2)) / 2, 6);
      expect(at[1]).toBeCloseTo((yScale(y1) + yScale(y2)) / 2, 6);
      expect(renderedAngle).toBeCloseTo(angle, 4);
    },
  );

  test("should render no caption when no caption is set", () => {
    const chartLayer = layer()
      .datum(singleDatum)
      .call(line().x1(20).y1(30).x2(80).y2(70).xScale(xScale).yScale(yScale));

    expect(captions(chartLayer)).toHaveLength(0);
  });

  test.for([
    { form: "scalars", dx: 15 as number | (() => number), dy: -10 as number | (() => number) },
    { form: "accessors", dx: () => 15, dy: () => -10 },
  ])(
    "should offset the caption from the midpoint when dx and dy are given as $form",
    ({ dx, dy }) => {
      const chartLayer = layer()
        .datum(singleDatum)
        .call(
          line()
            .x1(10)
            .y1(20)
            .x2(50)
            .y2(40)
            .xScale(xScale)
            .yScale(yScale)
            .caption("Offset Line")
            .dx(dx)
            .dy(dy),
        );

      const [caption] = captions(chartLayer);
      expect([Number(caption.attr("dx")), Number(caption.attr("dy"))]).toEqual([15, -10]);
    },
  );

  test("should render one shared caption over identically placed lines when several data are bound", () => {
    const chartLayer = layer()
      .datum([{ id: "line1" }, { id: "line2" }, { id: "line3" }])
      .call(
        line().x1(25).y1(25).x2(75).y2(75).xScale(xScale).yScale(yScale).caption("Multiple Lines"),
      );

    // The coordinates are scalar props, so every datum yields the same line …
    expect(
      lines(chartLayer).map((l) => [
        Number(l.attr("x1")),
        Number(l.attr("y1")),
        Number(l.attr("x2")),
        Number(l.attr("y2")),
      ]),
    ).toEqual(Array.from({ length: 3 }, () => [xScale(25), yScale(25), xScale(75), yScale(75)]));
    // … and the caption is bound to `[0]`, not to the data, so there is exactly one.
    expect(captions(chartLayer).map((c) => c.text())).toEqual(["Multiple Lines"]);
  });

  test("should match the rendered line count to the data when the data changes", () => {
    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);
    const chartLayer = layer();

    for (const count of [1, 2, 0]) {
      chartLayer
        .datum(Array.from({ length: count }, (_, i) => ({ id: `line${i}` })))
        .call(lineComponent);
      expect(lines(chartLayer)).toHaveLength(count);
    }
  });

  test("should render neither line nor caption when the data is empty", () => {
    const chartLayer = layer()
      .datum([])
      .call(line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale));

    expect(lines(chartLayer)).toHaveLength(0);
    expect(captions(chartLayer)).toHaveLength(0);
  });
});
