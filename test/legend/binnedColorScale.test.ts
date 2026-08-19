import { scaleThreshold } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import legendColorBinned from "../../src/legend/binnedColorScale.js";
import "../../src/d3-selectgroup.js";

describe("legend/binnedColorScale", () => {
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

  const render = (legend: ReturnType<typeof legendColorBinned>) => {
    const group = createSvgLayer("#chart-container", undefined, {
      key: `binned-${++layerKey}`,
    }).selectGroup("legend");
    group.call(legend);
    return group.node() as SVGGElement;
  };

  /** Four bins split at 25/50/75 across an 0-100 domain. */
  const scale = () =>
    scaleThreshold<number, string>().domain([25, 50, 75]).range(["#a", "#b", "#c", "#d"]);

  const standard = () =>
    legendColorBinned().scale(scale()).displayValues([25, 50, 75]).endpoints([0, 100]).width(200);

  const attrs = (node: Element, selector: string, attr: string) =>
    [...node.querySelectorAll(selector)].map((e) => e.getAttribute(attr));

  test("should render one rect per bin, including the bin after the last display value", () => {
    const node = render(standard());
    // three display values produce three rects, plus a final rect running to the endpoint
    expect(node.querySelectorAll("rect.sszvis-legend__crispmark").length).toBe(4);
  });

  test("should lay the bins out across the width inset by the end circles", () => {
    const node = render(standard());
    // innerRange is [0, width - 2 * circleRad] = [0, 190], offset by circleRad = 5
    expect(attrs(node, "rect.sszvis-legend__crispmark", "x")).toEqual(["5", "52", "100", "147"]);
    expect(attrs(node, "rect.sszvis-legend__crispmark", "width")).toEqual([
      "47.5",
      "48",
      "47.5",
      "47.5",
    ]);
  });

  test("should colour each bin with the scale value below its upper edge", () => {
    const node = render(standard());
    // the first rect covers [0, 25) so it takes scale(0), and so on
    expect(attrs(node, "rect.sszvis-legend__crispmark", "fill")).toEqual(["#a", "#b", "#c", "#d"]);
  });

  test("should give every bin the same height and sit them at y=0", () => {
    const node = render(standard());
    expect(attrs(node, "rect.sszvis-legend__crispmark", "height")).toEqual([
      "10",
      "10",
      "10",
      "10",
    ]);
    expect(attrs(node, "rect.sszvis-legend__crispmark", "y")).toEqual(["0", "0", "0", "0"]);
  });

  test("should cap each end with a circle coloured from the endpoints", () => {
    const node = render(standard());
    const circles = [...node.querySelectorAll("circle.sszvis-legend__circle")];
    expect(circles.length).toBe(2);
    expect(circles.map((c) => c.getAttribute("cx"))).toEqual(["5", "195"]);
    expect(circles.map((c) => c.getAttribute("cy"))).toEqual(["5", "5"]);
    expect(circles.map((c) => c.getAttribute("r"))).toEqual(["5", "5"]);
    expect(circles.map((c) => c.getAttribute("fill"))).toEqual(["#a", "#d"]);
  });

  test("should draw a tick line at each internal bin edge but not after the last bin", () => {
    const node = render(standard());
    const lines = [...node.querySelectorAll("line.sszvis-legend__crispmark")];
    expect(lines.length).toBe(3);
    // snapped to the half-pixel grid so the 1px rules stay crisp
    expect(lines.map((l) => l.getAttribute("x1"))).toEqual(["52.5", "100.5", "147.5"]);
    expect(lines.map((l) => l.getAttribute("x2"))).toEqual(["52.5", "100.5", "147.5"]);
    expect(lines.map((l) => l.getAttribute("y1"))).toEqual(["11", "11", "11"]);
    expect(lines.map((l) => l.getAttribute("y2"))).toEqual(["16", "16", "16"]);
    // NOTE: the tick colour is hardcoded inline rather than coming from sszvis.css,
    // unlike every other visual property of this legend.
    expect(lines.map((l) => l.getAttribute("stroke"))).toEqual(["#B8B8B8", "#B8B8B8", "#B8B8B8"]);
  });

  test("should label each internal bin edge with its display value", () => {
    const node = render(standard());
    const labels = [...node.querySelectorAll("text.sszvis-legend__axislabel")];
    expect(labels.length).toBe(3);
    expect(labels.map((l) => l.textContent)).toEqual(["25", "50", "75"]);
    expect(labels.map((l) => l.getAttribute("transform"))).toEqual([
      "translate(52.5,30)",
      "translate(100,30)",
      "translate(147.5,30)",
    ]);
  });

  test("should format labels with labelFormat", () => {
    const node = render(
      legendColorBinned()
        .scale(scale())
        .displayValues([25, 50, 75])
        .endpoints([0, 100])
        .labelFormat((d: number) => `${d}%`)
    );
    expect(
      [...node.querySelectorAll("text.sszvis-legend__axislabel")].map((l) => l.textContent)
    ).toEqual(["25%", "50%", "75%"]);
  });

  test("should scale the layout with the width property", () => {
    const node = render(
      legendColorBinned().scale(scale()).displayValues([50]).endpoints([0, 100]).width(100)
    );
    // innerRange becomes [0, 90]; the single display value splits it in half
    expect(attrs(node, "rect.sszvis-legend__crispmark", "x")).toEqual(["5", "50"]);
    expect(
      [...node.querySelectorAll("circle.sszvis-legend__circle")].map((c) => c.getAttribute("cx"))
    ).toEqual(["5", "95"]);
  });

  test("should default the width to 200", () => {
    const node = render(legendColorBinned().scale(scale()).displayValues([50]).endpoints([0, 100]));
    expect(
      [...node.querySelectorAll("circle.sszvis-legend__circle")].map((c) => c.getAttribute("cx"))
    ).toEqual(["5", "195"]);
  });

  test("should re-render in place rather than appending duplicates", () => {
    const legend = standard();
    const group = createSvgLayer("#chart-container", undefined, {
      key: "binned-rerender",
    }).selectGroup("legend");
    group.call(legend);
    group.call(legend);
    const node = group.node() as SVGGElement;
    expect(node.querySelectorAll("rect.sszvis-legend__crispmark").length).toBe(4);
    expect(node.querySelectorAll("circle.sszvis-legend__circle").length).toBe(2);
    expect(node.querySelectorAll("line.sszvis-legend__crispmark").length).toBe(3);
  });

  describe("required properties", () => {
    test("should log an error and render nothing without a scale", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const node = render(legendColorBinned().displayValues([50]).endpoints([0, 100]));
      expect(spy).toHaveBeenCalled();
      expect(node.querySelectorAll("rect").length).toBe(0);
    });

    test("should log an error and render nothing without displayValues", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const node = render(legendColorBinned().scale(scale()).endpoints([0, 100]));
      expect(spy).toHaveBeenCalled();
      expect(node.querySelectorAll("rect").length).toBe(0);
    });

    test("should log an error and render nothing without endpoints", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const node = render(legendColorBinned().scale(scale()).displayValues([50]));
      expect(spy).toHaveBeenCalled();
      expect(node.querySelectorAll("rect").length).toBe(0);
    });
  });

  describe("known quirks", () => {
    test("a bin edge line and its label can sit half a pixel apart", () => {
      // NOTE: documented in the binnedColorScale.ts JSDoc. The line is snapped with
      // halfPixel() while the label sits on the raw edge, so when the edge lands on a
      // whole pixel they disagree by 0.5px - here the middle edge (line 100.5, label 100).
      // Cosmetic, but the rule is not centred under its label.
      const node = render(standard());
      const lineX = node.querySelectorAll("line.sszvis-legend__crispmark")[1].getAttribute("x1");
      const labelT = node
        .querySelectorAll("text.sszvis-legend__axislabel")[1]
        .getAttribute("transform");
      expect(lineX).toBe("100.5");
      expect(labelT).toBe("translate(100,30)");
    });

    test("widens a bin by its subpixel remainder, so adjacent bins overlap slightly", () => {
      // NOTE: deliberate, documented in the binnedColorScale.ts JSDoc. `offset = sum % 1`
      // is added to the width so flooring x never leaves a visible gap. The cost is a
      // sub-pixel overlap: the second bin spans 52 to 100 while the third starts at 100.
      const node = render(standard());
      const xs = attrs(node, "rect.sszvis-legend__crispmark", "x").map(Number);
      const ws = attrs(node, "rect.sszvis-legend__crispmark", "width").map(Number);
      expect(xs[1] + ws[1]).toBeGreaterThanOrEqual(xs[2]);
    });
  });
});
