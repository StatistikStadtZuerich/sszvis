import { scaleLinear, scaleOrdinal, scaleSqrt } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { translationOf } from "../support/domValues.js";
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

  test("should offset the group onto the half-pixel grid when the scale's largest radius is 20", () => {
    const node = render(legendRadius().scale(linear()));
    const group = node.querySelector("g.sszvis-legend__elementgroup");
    expect(group).not.toBeNull();
    // maxRadius is 20, so the group is nudged to 20.5 to keep strokes crisp. Read as numbers,
    // so a change in how d3 spells the transform is not a failure.
    expect(group === null ? null : translationOf(group)).toEqual({ x: 20.5, y: 20.5 });
  });

  test("should label the domain max, the range midpoint and the domain min when no tickValues are given", () => {
    const node = render(legendRadius().scale(linear()));
    // scale.invert(mean([0, 20])) === invert(10) === 50 for a linear scale. Where the three
    // ticks are drawn is the geometry test's subject, not this one's.
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100",
      "50",
      "0",
    ]);
  });

  test("should derive the middle tick through the scale rather than the domain when the scale is non-linear", () => {
    // A sqrt scale inverts the range midpoint to 25 rather than 50.
    const node = render(legendRadius().scale(scaleSqrt().domain([0, 100]).range([0, 20])));
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100",
      "25",
      "0",
    ]);
  });

  /**
   * A tick is a circle, its leader line and its label, and all three are placed off the one
   * `getCircleEdge` formula: the circles rest on a shared baseline, and the line and the label
   * meet the top edge of the circle they belong to. Asserting them together is what makes a
   * change to that formula show up as one failure instead of three.
   */
  test("should line each tick's circle, leader and label up on the circle's top edge", () => {
    const node = render(legendRadius().scale(linear()));
    // cy = maxRadius - r, so every circle rests on the same baseline.
    expect(attrs(node, "circle.sszvis-legend__greyline", "r")).toEqual(["20", "10", "0"]);
    expect(attrs(node, "circle.sszvis-legend__greyline", "cy")).toEqual(["0", "10", "20"]);

    // y = maxRadius - 2r, i.e. the top of a circle whose bottom sits at maxRadius. The leader
    // is horizontal, starts at the centre line and extends 15px past the widest circle.
    const topEdges = ["-20", "0", "20"];
    expect(attrs(node, "line.sszvis-legend__dashedline", "y1")).toEqual(topEdges);
    expect(attrs(node, "line.sszvis-legend__dashedline", "y2")).toEqual(topEdges);
    expect(attrs(node, "line.sszvis-legend__dashedline", "x1")).toEqual(["0", "0", "0"]);
    expect(attrs(node, "line.sszvis-legend__dashedline", "x2")).toEqual(["35", "35", "35"]);

    // The label sits on the same edge, 18px past the widest circle and optically centred on it.
    expect(attrs(node, "text.sszvis-legend__label", "y")).toEqual(topEdges);
    expect(attrs(node, "text.sszvis-legend__label", "dx")).toEqual(["38", "38", "38"]);
    expect(attrs(node, "text.sszvis-legend__label", "dy")).toEqual(["0.35em", "0.35em", "0.35em"]);
  });

  test("should give labels both the label and the small-label class", () => {
    const node = render(legendRadius().scale(linear()));
    const label = node.querySelector("text");
    expect(label?.getAttribute("class")).toBe("sszvis-legend__label sszvis-legend__label--small");
  });

  // One circle, one leader and one label per tick, however many ticks the caller asks for.
  test("should draw a circle, leader and label for each tick when tickValues are given", () => {
    const node = render(legendRadius().scale(linear()).tickValues([100, 25]));
    expect(node.querySelectorAll("circle").length).toBe(2);
    expect(node.querySelectorAll("line").length).toBe(2);
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["100", "25"]);
    expect(attrs(node, "circle.sszvis-legend__greyline", "r")).toEqual(["20", "5"]);

    const four = render(legendRadius().scale(linear()).tickValues([100, 75, 50, 25]));
    expect(four.querySelectorAll("circle").length).toBe(4);
    expect(four.querySelectorAll("line").length).toBe(4);
    expect(four.querySelectorAll("text").length).toBe(4);
  });

  test("should print what tickFormat returns when a formatter is configured", () => {
    const node = render(
      legendRadius()
        .scale(linear())
        .tickValues([100, 0])
        .tickFormat((d) => `${d} Einwohner`),
    );
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "100 Einwohner",
      "0 Einwohner",
    ]);
  });

  test("should hand tickFormat the tick value and its index", () => {
    const calls: Array<[unknown, number]> = [];
    render(
      legendRadius()
        .scale(linear())
        .tickValues([100, 50, 25])
        .tickFormat((d, i) => {
          calls.push([d, i]);
          return String(d);
        }),
    );
    expect(calls).toEqual([
      [100, 0],
      [50, 1],
      [25, 2],
    ]);
    // the values arrive as numbers, not stringified or coerced away from their type
    expect(calls.map(([d]) => typeof d)).toEqual(["number", "number", "number"]);
  });

  test("should give tickFormat d3's nodes argument and the label element as `this`", () => {
    // No `this: unknown` annotation and no optional chaining on nodes: the formatter
    // type declares both, so this test only compiles while that contract holds.
    const seen: Array<{ node: SVGTextElement; count: number; self: SVGTextElement }> = [];
    const node = render(
      legendRadius()
        .scale(linear())
        .tickValues([100, 50])
        .tickFormat(function (d, _i, nodes) {
          seen.push({ node: nodes[0] as SVGTextElement, count: nodes.length, self: this });
          return String(d);
        }),
    );
    const labels = [...node.querySelectorAll("text.sszvis-legend__label")];
    expect(seen.map((s) => s.count)).toEqual([2, 2]);
    expect(seen.map((s) => s.node)).toEqual([labels[0], labels[0]]);
    // d3 binds `this` to the element being rendered
    expect(seen.map((s) => s.self)).toEqual(labels);
  });

  test("should render the value verbatim when tickFormat returns something other than a string", () => {
    const node = render(
      legendRadius()
        .scale(linear())
        .tickValues([100, 50])
        // a numeric return is stringified by d3 rather than dropped
        .tickFormat((d, i) => d / 2 + i),
    );
    expect([...node.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["50", "26"]);
  });

  test("should keep one circle, leader and label per tick when the same legend is applied twice", () => {
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
            .tickValues(["a", "b"] as never),
        ),
      ).not.toThrow();
    });
  });
});
