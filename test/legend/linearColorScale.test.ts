import { scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import legendColorLinear from "../../src/legend/linearColorScale.js";
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

  const render = (legend: ReturnType<typeof legendColorLinear>) => {
    const group = layer(`linear-${++layerKey}`);
    group.call(legend);
    return group.node() as SVGGElement;
  };

  const scale = () => scaleLinear<string>().domain([0, 100]).range(["#ffffff", "#000000"]);

  const attrs = (node: Element, selector: string, attr: string) =>
    [...node.querySelectorAll(selector)].map((e) => e.getAttribute(attr));

  test("should render one rect per displayed value", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
    // the two supplied values, plus the domain maximum the component appends
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(3);
  });

  test("should fall back to scale.ticks when no displayValues are given", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).segments(8));
    // segments(8) asks scale.ticks(7), which yields 6 values on [0, 100]
    expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBe(s.ticks(7).length + 1);
  });

  test("should default segments to 8", () => {
    const s = scale();
    const withDefault = render(legendColorLinear().scale(s));
    const withExplicit = render(legendColorLinear().scale(s).segments(8));
    expect(withDefault.querySelectorAll("rect.sszvis-legend__mark").length).toBe(
      withExplicit.querySelectorAll("rect.sszvis-legend__mark").length
    );
    expect(withDefault.querySelectorAll("rect.sszvis-legend__mark").length).toBe(
      s.ticks(7).length + 1
    );
  });

  test("should divide the width evenly between the segments", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]).width(300));
    // three values across 300px
    const widths = attrs(node, "rect.sszvis-legend__mark", "width").map(Number);
    for (const w of widths) expect(w).toBeCloseTo(300 / 3 + 1, 10);
    const xs = attrs(node, "rect.sszvis-legend__mark", "x").map(Number);
    expect(xs).toEqual([-1, 99, 199]);
  });

  test("should overlap the segments by a pixel to hide antialiasing seams", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]).width(300));
    const xs = attrs(node, "rect.sszvis-legend__mark", "x").map(Number);
    const ws = attrs(node, "rect.sszvis-legend__mark", "width").map(Number);
    // each segment starts 1px early and runs 1px long
    expect(xs[0]).toBe(-1);
    expect(xs[1] + ws[1]).toBeGreaterThan(xs[2]);
  });

  test("should default the width to 200", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0]));
    // one supplied value plus the appended maximum, so two segments of 100
    expect(attrs(node, "rect.sszvis-legend__mark", "x").map(Number)).toEqual([-1, 99]);
  });

  test("should colour each segment by passing its value through the scale", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).displayValues([0, 50]));
    expect(attrs(node, "rect.sszvis-legend__mark", "fill")).toEqual([s(0), s(50), s(100)]);
  });

  test("should give every segment the same height at y=0", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
    expect(attrs(node, "rect.sszvis-legend__mark", "height")).toEqual(["10", "10", "10"]);
    expect(attrs(node, "rect.sszvis-legend__mark", "y")).toEqual(["0", "0", "0"]);
  });

  test("should cap both ends with a circle coloured from the domain extent", () => {
    const s = scale();
    const node = render(legendColorLinear().scale(s).displayValues([0, 50]).width(200));
    const caps = [...node.querySelectorAll("circle")];
    expect(caps.length).toBe(2);
    expect(caps.map((c) => c.getAttribute("cx"))).toEqual(["0", "200"]);
    expect(caps.map((c) => c.getAttribute("cy"))).toEqual(["5", "5"]);
    expect(caps.map((c) => c.getAttribute("r"))).toEqual(["5", "5"]);
    expect(caps.map((c) => c.getAttribute("fill"))).toEqual([s(0), s(100)]);
  });

  test("should label the endpoints with the domain extent by default", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
    const labels = [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")];
    expect(labels.map((l) => l.textContent)).toEqual(["0", "100"]);
  });

  test("should anchor the endpoint labels outwards", () => {
    const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]).width(200));
    const labels = [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")];
    expect(labels.map((l) => l.style.textAnchor)).toEqual(["end", "start"]);
    // 16px of padding, outwards from each end of the ramp
    expect(labels.map((l) => l.getAttribute("transform"))).toEqual([
      "translate(-16, 5)",
      "translate(216, 5)",
    ]);
    expect(labels.map((l) => l.getAttribute("dy"))).toEqual(["0.35em", "0.35em"]);
  });

  test("should use labelText when supplied", () => {
    const node = render(
      legendColorLinear().scale(scale()).displayValues([0, 50]).labelText(["wenig", "viel"])
    );
    expect(
      [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")].map(
        (l) => l.textContent
      )
    ).toEqual(["wenig", "viel"]);
  });

  test("should format labels with labelFormat, passing value and index", () => {
    const seen: [unknown, number][] = [];
    const node = render(
      legendColorLinear()
        .scale(scale())
        .displayValues([0, 50])
        .labelFormat((d, i) => {
          seen.push([d, i]);
          return `${d}@${i}`;
        })
    );
    expect(
      [...node.querySelectorAll<SVGTextElement>("text.sszvis-legend__label")].map(
        (l) => l.textContent
      )
    ).toEqual(["0@0", "100@1"]);
    expect(seen).toEqual([
      [0, 0],
      [100, 1],
    ]);
  });

  test("should log an error and render nothing without a scale", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const node = render(legendColorLinear().displayValues([0, 50]));
    expect(spy).toHaveBeenCalled();
    expect(node.querySelectorAll("rect").length).toBe(0);
  });

  describe("known quirks", () => {
    test("mutates the caller's displayValues array, growing it on every render", () => {
      // BUG: `values = props.displayValues` aliases the caller's array and then
      // `values.push(fn.last(domain))` mutates it. The prop object is cloned per render
      // but the array reference is shared, so each re-render appends another maximum and
      // adds another segment. A chart that re-renders on interaction drifts visibly.
      // current: [0, 50] becomes [0, 50, 100] then [0, 50, 100, 100].
      // expected: displayValues is left untouched; segment count stays stable.
      const shared = [0, 50];
      const legend = legendColorLinear().scale(scale()).displayValues(shared);
      const group = layer("linear-mutation");
      group.call(legend);
      expect(shared).toEqual([0, 50, 100]);
      group.call(legend);
      expect(shared).toEqual([0, 50, 100, 100]);
      expect(
        (group.node() as SVGGElement).querySelectorAll("rect.sszvis-legend__mark").length
      ).toBe(4);
    });

    test("appends the domain maximum unconditionally, duplicating the last segment", () => {
      // BUG: the domain maximum is appended even when the values already end there -
      // which is the default path, since scale.ticks() includes the upper bound. The
      // result is two adjacent segments of the same colour, so the final colour renders
      // double width and the ramp misrepresents the scale.
      // current: ticks [0..100] plus an extra 100. expected: no duplicate.
      const s = scale();
      const node = render(legendColorLinear().scale(s).segments(8));
      const fills = attrs(node, "rect.sszvis-legend__mark", "fill");
      expect(fills.at(-1)).toBe(fills.at(-2));
      expect(fills.length).toBe(s.ticks(7).length + 1);
    });

    test("misspells the end-cap class as ssvis-legend--mark", () => {
      // BUG: the end caps are classed "ssvis-legend--mark" - missing the "z", and using
      // "--" where every sibling uses "__". No such class exists in sszvis.css, so the
      // caps cannot be styled alongside the rest of the legend. They still render only
      // because the fill is set as an attribute. Renaming is a CSS-API change.
      // current: "ssvis-legend--mark". expected: "sszvis-legend__mark".
      const node = render(legendColorLinear().scale(scale()).displayValues([0, 50]));
      expect(node.querySelectorAll("circle.ssvis-legend--mark").length).toBe(2);
      expect(node.querySelectorAll("circle.sszvis-legend__mark").length).toBe(0);
    });

    test("the divide-by-zero guard on segment width is unreachable", () => {
      // NOTE: `values.length > 0 ? width / values.length : 0` can never take the zero
      // branch, because a value is always appended before it runs. Dead code rather than
      // a defect; worth removing during the port.
      const node = render(legendColorLinear().scale(scale()).displayValues([]));
      expect(node.querySelectorAll("rect.sszvis-legend__mark").length).toBeGreaterThan(0);
    });
  });
});
