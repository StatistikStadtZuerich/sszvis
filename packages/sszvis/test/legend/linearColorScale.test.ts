import { scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, expectTypeOf, test, vi } from "vitest";
import { translationOf } from "../support/domValues.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import legendColorLinear from "../../src/legend/linearColorScale.js";
import type { LinearColorScaleComponent } from "../../src/legend/linearColorScale.js";
import "../../src/d3-selectgroup.js";

describe("legend/linearColorScale", () => {
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
    vi.restoreAllMocks();
  });

  const layer = (key: string) =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("legend");

  const render = <T>(legend: LinearColorScaleComponent<T>) => {
    const group = layer(`linear-${++layerKey}`);
    group.call(legend);
    return group.node() as SVGGElement;
  };

  const scale = () => scaleLinear<string>().domain([0, 100]).range(["#ffffff", "#000000"]);

  const attrs = (node: Element, selector: string, attr: string) =>
    [...node.querySelectorAll(selector)].map((e) => e.getAttribute(attr));

  // The appended maximum is why the ramp still reaches the end of the domain when the caller's
  // values stop short of it.
  test("should render one rect per displayed value, plus one for the appended maximum, when displayValues are configured", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
    // the two supplied values, plus the domain maximum the component appends
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(3);
  });

  test("should fall back to scale.ticks when no displayValues are given", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).segments(8));
    // segments(8) asks scale.ticks(7), which yields 6 values on [0, 100]
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(s.ticks(7).length);
  });

  test("should render the same segments as an explicit 8 when no segments are configured", () => {
    const s = scale();
    const withDefault = render(legendColorLinear().scale(s));
    const withExplicit = render(legendColorLinear().scale(s).segments(8));
    expect(withDefault.querySelectorAll("rect.sszvis-legend__mark").length).toBe(
      withExplicit.querySelectorAll("rect.sszvis-legend__mark").length,
    );
    expect(withDefault.querySelectorAll("rect.sszvis-legend__mark").length).toBe(s.ticks(7).length);
  });

  /**
   * A segment is one rect, so its four geometry attributes are one contract: the segments tile
   * the width evenly along a shared baseline, each starting a pixel early and running a pixel
   * long so no antialiasing seam shows between them.
   */
  test("should tile the width with segments that overlap by a pixel on a shared baseline when a width is configured", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]).width(300));
    const xs = attrs(node, "rect.sszvis-legend__mark", "x").map(Number);
    const widths = attrs(node, "rect.sszvis-legend__mark", "width").map(Number);

    // three values across 300px, each a pixel wider than its share
    for (const w of widths) expect(w).toBeCloseTo(300 / 3 + 1, 10);
    expect(xs).toEqual([-1, 99, 199]);
    // the overlap itself: a segment runs past where the next one starts
    expect(xs[1] + widths[1]).toBeGreaterThan(xs[2]);

    // Every segment shares the ramp's height and baseline, so the row reads as one band.
    expect(attrs(node, "rect.sszvis-legend__mark", "height")).toEqual(["10", "10", "10"]);
    expect(attrs(node, "rect.sszvis-legend__mark", "y")).toEqual(["0", "0", "0"]);
  });

  test("should span 200px when no width is configured", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0]));
    // one supplied value plus the appended maximum, so two segments of 100
    expect(attrs(node, "rect.sszvis-legend__mark", "x").map(Number)).toEqual([-1, 99]);
  });

  test("should colour each segment by passing its value through the scale", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).displayValues([0, 50]));
    expect(attrs(node, "rect.sszvis-legend__mark", "fill")).toEqual([s(0), s(50), s(100)]);
  });

  test("should cap both ends with a circle coloured from the domain extent when a scale is configured", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).displayValues([0, 50]).width(200));
    const caps = [...node.querySelectorAll("circle.sszvis-legend__mark")];
    expect(caps.length).toBe(2);
    expect(caps.map((c) => c.getAttribute("cx"))).toEqual(["0", "200"]);
    expect(caps.map((c) => c.getAttribute("cy"))).toEqual(["5", "5"]);
    expect(caps.map((c) => c.getAttribute("r"))).toEqual(["5", "5"]);
    expect(caps.map((c) => c.getAttribute("fill"))).toEqual([s(0), s(100)]);
  });

  test("should label the endpoints with the domain extent when no labelText is configured", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
    const labels = [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")];
    expect(labels.map((l) => l.textContent)).toEqual(["0", "100"]);
  });

  test("should push each endpoint label outwards past the end of the ramp it labels", () => {
    const width = 200;
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]).width(width));
    const labels = [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")];
    expect(labels.map((l) => l.style.textAnchor)).toEqual(["end", "start"]);
    // 16px of padding, outwards from each end: the left label sits before the ramp starts and
    // the right one after it ends. Read as numbers, so a change of spelling is not a failure.
    expect(labels.map((l) => translationOf(l))).toEqual([
      { x: -16, y: 5 },
      { x: width + 16, y: 5 },
    ]);
    expect(labels.map((l) => l.getAttribute("dy"))).toEqual(["0.35em", "0.35em"]);
  });

  test("should print the labelText entries when labelText is supplied", () => {
    const node = render(
      // A legend whose labels are words, not numbers, names that type.
      legendColorLinear<string>()
        .scale(scale())
        .displayValues([0, 50])
        .labelText(["wenig", "viel"]),
    );
    expect(
      [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")].map(
        (l) => l.textContent,
      ),
    ).toEqual(["wenig", "viel"]);
  });

  test("should print what labelFormat returns, and pass it the value and its index, when a formatter is configured", () => {
    const seen: [unknown, number][] = [];
    const node = render(
      legendColorLinear()
        .scale(scale())
        .displayValues([0, 50])
        .labelFormat((d, i) => {
          seen.push([d, i]);
          return `${d}@${i}`;
        }),
    );
    expect(
      [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")].map(
        (l) => l.textContent,
      ),
    ).toEqual(["0@0", "100@1"]);
    expect(seen).toEqual([
      [0, 0],
      [100, 1],
    ]);
  });

  test("should type labelFormat against the numbers it is really given", () => {
    // The test above proves labelFormat receives the scale's numeric domain endpoints when
    // labelText is not set. The type has to say so even for a string-labelled legend, or a
    // formatter that only handles strings compiles and then throws at render.
    expectTypeOf<
      Parameters<Parameters<LinearColorScaleComponent<string>["labelFormat"]>[0]>[0]
    >().toEqualTypeOf<string | number>();
  });

  test("should report the problem and draw nothing when it is built without a scale", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const node = render(legendColorLinear().displayValues([0, 50]));
    expect(spy).toHaveBeenCalled();
    expect(node.querySelectorAll("rect").length).toBe(0);
  });

  test("should leave the caller's displayValues untouched and the mark count steady when it renders twice", () => {
    const shared = [0, 50];
    const legend = legendColorLinear().scale(scale()).displayValues(shared);
    const group = layer("linear-mutation");
    group.call(legend);
    expect(shared).toEqual([0, 50]);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(3);
    group.call(legend);
    expect(shared).toEqual([0, 50]);
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(3);
  });

  test("should not duplicate the last segment when the values already reach the maximum", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).segments(8));
    const fills = attrs(node, "rect.sszvis-legend__mark", "fill");
    expect(fills.length).toBe(s.ticks(7).length);
    // no two adjacent segments share a fill
    for (let i = 1; i < fills.length; i++) expect(fills[i]).not.toBe(fills[i - 1]);
  });
});
