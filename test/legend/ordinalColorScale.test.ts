import { scaleOrdinal } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import {
  DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
  legendColorOrdinal,
  type OrdinalColorScaleComponent,
} from "../../src/legend/ordinalColorScale.js";
import "../../src/d3-selectgroup.js";

describe("legend/ordinalColorScale", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  const layer = (key: string) =>
    createSvgLayer("#chart-container", undefined, { key }).selectGroup("legend");

  const render = (legend: OrdinalColorScaleComponent<string>) => {
    const group = layer(`ordinal-${++layerKey}`);
    group.call(legend);
    return group.node() as SVGGElement;
  };

  const scale = () =>
    scaleOrdinal<string, string>()
      .domain(["A", "B", "C", "D", "E"])
      .range(["#111", "#222", "#333", "#444", "#555"]);

  const entries = (node: Element) => [...node.querySelectorAll("g.sszvis-legend--entry")];
  const transforms = (node: Element) => entries(node).map((e) => e.getAttribute("transform"));
  const labels = (node: Element) =>
    [...node.querySelectorAll("text.sszvis-legend__label")].map((t) => t.textContent);

  test("should export the default row height", () => {
    expect(DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT).toBe(21);
  });

  test("should render one entry per domain member, in domain order", () => {
    const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
    expect(entries(node).length).toBe(5);
    expect(labels(node)).toEqual(["A", "B", "C", "D", "E"]);
  });

  test("should give each entry a colour swatch filled and stroked from the scale", () => {
    const s = scale();
    const node = render(legendColorOrdinal().scale(s).orientation("horizontal"));
    const marks = [...node.querySelectorAll("circle.sszvis-legend__mark")];
    expect(marks.length).toBe(5);
    expect(marks.map((m) => m.getAttribute("fill"))).toEqual(["A", "B", "C", "D", "E"].map(s));
    expect(marks.map((m) => m.getAttribute("stroke"))).toEqual(["A", "B", "C", "D", "E"].map(s));
    expect(marks.map((m) => m.getAttribute("r"))).toEqual(["5", "5", "5", "5", "5"]);
    expect(marks.map((m) => m.getAttribute("stroke-width"))).toEqual(["1", "1", "1", "1", "1"]);
  });

  test("should place the swatch before the label and centre both on the row", () => {
    const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
    const mark = node.querySelector("circle.sszvis-legend__mark");
    const label = node.querySelector("text.sszvis-legend__label");
    // rowHeight 21 -> halfPixel(10.5) === 10.5
    expect(mark?.getAttribute("cx")).toBe("6");
    expect(mark?.getAttribute("cy")).toBe("10.5");
    expect(label?.getAttribute("transform")).toBe("translate(18,10.5)");
    expect(label?.getAttribute("dy")).toBe("0.35em");
    expect((label as SVGTextElement).style.textAnchor).toBe("start");
  });

  test("should mirror the swatch and label when rightAlign is set", () => {
    const node = render(
      legendColorOrdinal().scale(scale()).orientation("horizontal").rightAlign(true)
    );
    const mark = node.querySelector("circle.sszvis-legend__mark");
    const label = node.querySelector("text.sszvis-legend__label");
    expect(mark?.getAttribute("cx")).toBe("-6");
    expect(label?.getAttribute("transform")).toBe("translate(-18,10.5)");
    expect((label as SVGTextElement).style.textAnchor).toBe("end");
  });

  describe("horizontal orientation", () => {
    test("should fill rows left to right, wrapping after the column count", () => {
      const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3));
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(200,0)",
        "translate(400,0)",
        "translate(0,21)",
        "translate(200,21)",
      ]);
    });

    test("should respect columnWidth and rowHeight", () => {
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .orientation("horizontal")
          .columns(2)
          .columnWidth(80)
          .rowHeight(30)
      );
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(80,0)",
        "translate(0,30)",
        "translate(80,30)",
        "translate(0,60)",
      ]);
    });

    test("should default to 3 columns", () => {
      const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(200,0)",
        "translate(400,0)",
        "translate(0,21)",
        "translate(200,21)",
      ]);
    });

    test("should round a fractional column count up", () => {
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(2.2)
      );
      // Math.ceil(2.2) === 3 columns
      expect(transforms(node)?.[3]).toBe("translate(0,21)");
    });
  });

  describe("vertical orientation", () => {
    test("should fill columns top to bottom, wrapping after the row count", () => {
      const node = render(legendColorOrdinal().scale(scale()).orientation("vertical").rows(2));
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(0,21)",
        "translate(200,0)",
        "translate(200,21)",
        "translate(400,0)",
      ]);
    });

    test("should respect columnWidth and rowHeight", () => {
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .orientation("vertical")
          .rows(3)
          .columnWidth(50)
          .rowHeight(10)
      );
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(0,10)",
        "translate(0,20)",
        "translate(50,0)",
        "translate(50,10)",
      ]);
    });
  });

  test("should reverse the entry order without changing the layout positions", () => {
    const node = render(
      legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3).reverse(true)
    );
    expect(labels(node)).toEqual(["E", "D", "C", "B", "A"]);
    expect(transforms(node)?.[0]).toBe("translate(0,0)");
  });

  test("should not mutate the scale domain when reversing", () => {
    const s = scale();
    render(legendColorOrdinal().scale(s).orientation("horizontal").reverse(true));
    expect(s.domain()).toEqual(["A", "B", "C", "D", "E"]);
  });

  test("should shift the whole legend up by half its height when verticallyCentered", () => {
    const node = render(
      legendColorOrdinal()
        .scale(scale())
        .orientation("horizontal")
        .columns(3)
        .verticallyCentered(true)
    );
    // 5 entries * 21px / 2 === 52.5, prepended to each entry's own translate
    expect(transforms(node)?.[0]).toBe("translate(0,-52.5) translate(0,0)");
    expect(transforms(node)?.[4]).toBe("translate(0,-52.5) translate(200,21)");
  });

  describe("horizontal float layout", () => {
    /** Pins every entry to a fixed measured width so positions are deterministic. */
    const mockEntryWidth = (width: number) =>
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);

    test("should pack entries left to right and wrap at floatWidth", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(200)
      );
      // 50px entries with 20px padding: three fit in 200px, the fourth starts a new row
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(70,0)",
        "translate(140,0)",
        "translate(0,21)",
        "translate(70,21)",
      ]);
    });

    test("should keep an entry that lands exactly on floatWidth", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(150).floatPadding(0)
      );
      // the third entry ends at exactly 150, which still fits - the wrap is strictly ">"
      expect(transforms(node)?.slice(0, 4)).toEqual([
        "translate(0,0)",
        "translate(50,0)",
        "translate(100,0)",
        "translate(0,21)",
      ]);
    });

    test("should respect floatPadding", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(200).floatPadding(5)
      );
      expect(transforms(node)?.slice(0, 3)).toEqual([
        "translate(0,0)",
        "translate(55,0)",
        "translate(110,0)",
      ]);
    });

    test("should combine with verticallyCentered", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .horizontalFloat(true)
          .floatWidth(200)
          .verticallyCentered(true)
      );
      expect(transforms(node)?.[0]).toBe("translate(0,-52.5) translate(0,0)");
    });

    test("should ignore orientation when floating", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .horizontalFloat(true)
          .floatWidth(200)
          .orientation("vertical")
      );
      expect(transforms(node)?.[1]).toBe("translate(70,0)");
    });
  });

  test("should re-render in place rather than appending duplicates", () => {
    const legend = legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3);
    const group = layer("ordinal-rerender");
    group.call(legend);
    group.call(legend);
    const node = group.node() as SVGGElement;
    expect(entries(node).length).toBe(5);
    expect(node.querySelectorAll("circle.sszvis-legend__mark").length).toBe(5);
    expect(node.querySelectorAll("text.sszvis-legend__label").length).toBe(5);
  });

  describe("known quirks", () => {
    test("omits the transform entirely when no orientation is set", () => {
      // BUG: `orientation` has no default, and rows/cols are only computed for the
      // "horizontal" and "vertical" cases. With neither set (and horizontalFloat off) the
      // transform callback falls through and returns undefined, so d3 removes the
      // attribute and every entry is drawn at the origin, stacked on top of one another.
      // The layout silently produces an unreadable legend instead of warning.
      // current: transform absent on all entries. expected: a default layout, or a
      // logger.warn like the other components use for missing required props.
      const node = render(legendColorOrdinal().scale(scale()));
      expect(transforms(node)).toEqual([null, null, null, null, null]);
    });

    test("does not clamp the layout to the number of entries", () => {
      // NOTE: `columns` is a target, not a maximum bound on content - asking for more
      // columns than there are entries simply spreads them along one row. Documented
      // behaviour, pinned because the property names suggest a grid rather than a target.
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(10)
      );
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(200,0)",
        "translate(400,0)",
        "translate(600,0)",
        "translate(800,0)",
      ]);
    });
  });
});
