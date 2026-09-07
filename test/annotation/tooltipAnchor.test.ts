/**
 * @module test/annotation/tooltipAnchor
 */
import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import tooltipAnchor from "../../src/annotation/tooltipAnchor.js";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("annotation/tooltipAnchor", () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "300");
    document.body.append(svg);
  });

  afterEach(() => {
    svg.remove();
  });

  const renderAnchors = (data: [number, number][]) => {
    const group = select(svg).append("g");
    group.datum(data).call(tooltipAnchor<[number, number]>().position((d) => d));
    return [...svg.querySelectorAll("[data-tooltip-anchor]")];
  };

  test("should render one rect per datum", () => {
    const anchors = renderAnchors([
      [10, 20],
      [30, 40],
    ]);
    expect(anchors).toHaveLength(2);
    expect(anchors[0].tagName).toBe("rect");
    expect(anchors[0].getAttribute("transform")).toBe("translate(10,20)");
  });

  test("should not write a visibility attribute", () => {
    // NOTE: visibility only accepts visible/hidden/collapse/inherit. The rects are already
    // invisible through fill="none" and stroke="none", so no value is written at all.
    const [anchor] = renderAnchors([[10, 20]]);
    expect(anchor.hasAttribute("visibility")).toBe(false);
  });

  test("should keep the anchor invisible but measurable", () => {
    const [anchor] = renderAnchors([[10, 20]]);
    expect(anchor.getAttribute("fill")).toBe("none");
    expect(anchor.getAttribute("stroke")).toBe("none");
    expect(anchor.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});
