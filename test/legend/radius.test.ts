import { scaleLinear, scaleOrdinal, scaleSqrt } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import legendRadius from "../../src/legend/radius.js";
import "../../src/d3-selectgroup.js";

describe("legend/radius", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

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

  /** Renders the legend into a fresh layer and returns the group holding it. */
  const render = (legend: ReturnType<typeof legendRadius>) => {
    const group = createSvgLayer("#chart-container", undefined, {
      key: `radius-${++layerKey}`,
    }).selectGroup("legend");
    group.call(legend);
    return group.node() as SVGGElement;
  };

  const linear = () => scaleLinear().domain([0, 100]).range([0, 20]);
  const attrs = (node: Element, selector: string, attr: string) =>
    [...node.querySelectorAll(selector)].map((e) => e.getAttribute(attr));

  test("should render a group offset onto the half-pixel grid by the largest radius", () => {
    const node = render(legendRadius().scale(linear()));
    const group = node.querySelector("g.sszvis-legend__elementgroup");
    expect(group).not.toBeNull();
    // maxRadius is 20, so the group is nudged to 20.5 to keep strokes crisp.
    expect(group?.getAttribute("transform")).toBe("translate(20.5,20.5)");
  });

  test("should default to three ticks: domain max, midpoint of the range, domain min", () => {
    const node = render(legendRadius().scale(linear()));
    // scale.invert(mean([0, 20])) === invert(10) === 50 for a linear scale.
    expect(attrs(node, "text.sszvis-legend__label", "y")).toEqual(["-20", "0", "20"]);
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100",
      "50",
      "0",
    ]);
  });

  test("should derive the middle tick through the scale, not the domain", () => {
    // A sqrt scale inverts the range midpoint to 25 rather than 50.
    const node = render(legendRadius().scale(scaleSqrt().domain([0, 100]).range([0, 20])));
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100",
      "25",
      "0",
    ]);
  });

  test("should bottom-align the circles by offsetting cy by the radius", () => {
    const node = render(legendRadius().scale(linear()));
    expect(attrs(node, "circle.sszvis-legend__greyline", "r")).toEqual(["20", "10", "0"]);
    // cy = maxRadius - r, so every circle rests on the same baseline.
    expect(attrs(node, "circle.sszvis-legend__greyline", "cy")).toEqual(["0", "10", "20"]);
    expect(attrs(node, "circle.sszvis-legend__greyline", "stroke-width")).toEqual(["1", "1", "1"]);
  });

  test("should draw each leader line at the top edge of its circle", () => {
    const node = render(legendRadius().scale(linear()));
    // y = maxRadius - 2r, i.e. the top of a circle whose bottom sits at maxRadius.
    expect(attrs(node, "line.sszvis-legend__dashedline", "y1")).toEqual(["-20", "0", "20"]);
    expect(attrs(node, "line.sszvis-legend__dashedline", "y2")).toEqual(["-20", "0", "20"]);
    expect(attrs(node, "line.sszvis-legend__dashedline", "x1")).toEqual(["0", "0", "0"]);
    // lines extend 15px past the widest circle
    expect(attrs(node, "line.sszvis-legend__dashedline", "x2")).toEqual(["35", "35", "35"]);
  });

  test("should place labels 18px past the widest circle, vertically centered", () => {
    const node = render(legendRadius().scale(linear()));
    expect(attrs(node, "text.sszvis-legend__label", "dx")).toEqual(["38", "38", "38"]);
    expect(attrs(node, "text.sszvis-legend__label", "dy")).toEqual(["0.35em", "0.35em", "0.35em"]);
  });

  test("should give labels both the label and the small-label class", () => {
    const node = render(legendRadius().scale(linear()));
    const label = node.querySelector("text");
    expect(label?.getAttribute("class")).toBe("sszvis-legend__label sszvis-legend__label--small");
  });

  test("should honor explicit tickValues", () => {
    const node = render(legendRadius().scale(linear()).tickValues([100, 25]));
    expect(node.querySelectorAll("circle").length).toBe(2);
    expect(node.querySelectorAll("line").length).toBe(2);
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["100", "25"]);
    expect(attrs(node, "circle.sszvis-legend__greyline", "r")).toEqual(["20", "5"]);
  });

  test("should format labels with tickFormat", () => {
    const node = render(
      legendRadius()
        .scale(linear())
        .tickValues([100, 0])
        .tickFormat((d) => `${d} Einwohner`)
    );
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100 Einwohner",
      "0 Einwohner",
    ]);
  });

  test("should render one circle, line and label per tick", () => {
    const node = render(legendRadius().scale(linear()).tickValues([100, 75, 50, 25]));
    expect(node.querySelectorAll("circle").length).toBe(4);
    expect(node.querySelectorAll("line").length).toBe(4);
    expect(node.querySelectorAll("text").length).toBe(4);
  });

  test("should re-render in place rather than appending duplicates", () => {
    const legend = legendRadius().scale(linear()).tickValues([100, 50]);
    const group = createSvgLayer("#chart-container", undefined, {
      key: `radius-rerender`,
    }).selectGroup("legend");
    group.call(legend);
    group.call(legend);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("circle").length).toBe(2);
    expect(node.querySelectorAll("g.sszvis-legend__elementgroup").length).toBe(1);
  });

  describe("known quirks", () => {
    test("renders an invisible zero-radius circle for a zero domain value", () => {
      // NOTE: intended - documented in the radius.ts JSDoc. The default ticks include
      // domain[0]; when that maps to a zero radius the circle is invisible, but its
      // leader line and label still mark the value.
      const node = render(legendRadius().scale(linear()));
      const last = [...node.querySelectorAll("circle.sszvis-legend__greyline")].at(-1);
      expect(last?.getAttribute("r")).toBe("0");
    });

    test("requires a scale with .invert unless tickValues are supplied", () => {
      // NOTE: intended - documented in the radius.ts JSDoc. Deriving the default middle
      // tick needs scale.invert(), so a scale without it throws a TypeError explaining
      // that tickValues should be supplied instead.
      const ordinal = scaleOrdinal<string, number>().domain(["a", "b"]).range([5, 10]);
      expect(() => render(legendRadius().scale(ordinal as never))).toThrow(TypeError);
      // supplying tickValues avoids invert entirely
      expect(() =>
        render(
          legendRadius()
            .scale(ordinal as never)
            .tickValues(["a", "b"] as never)
        )
      ).not.toThrow();
    });
  });
});
