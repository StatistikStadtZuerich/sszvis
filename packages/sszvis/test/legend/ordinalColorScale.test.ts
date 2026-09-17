import { scaleOrdinal } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import legendColorOrdinal, {
  DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
  type OrdinalColorScaleComponent,
} from "../../src/legend/ordinalColorScale.js";
import { resolvedColor, translationOf } from "../support/domValues.js";
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
  /** Entry positions as numbers, so a change of `translate` spelling is not a failure. */
  const positions = (node: Element) => entries(node).map((e) => translationOf(e));
  const labels = (node: Element) =>
    [...node.querySelectorAll("text.sszvis-legend__label")].map((t) => t.textContent);

  test("should keep the module's public names reachable from the library barrel", async () => {
    const sszvis = await import("../../src/index.js");
    expect(sszvis.legendColorOrdinal).toBe(legendColorOrdinal);
    expect(sszvis.DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT).toBe(
      DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
    );
  });

  test("should render one entry per domain member, in domain order", () => {
    const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
    expect(entries(node).length).toBe(5);
    expect(labels(node)).toEqual(["A", "B", "C", "D", "E"]);
  });

  test("should fill and stroke each entry's swatch with that member's colour", () => {
    const s = scale();
    const node = render(legendColorOrdinal().scale(s).orientation("horizontal"));
    const marks = [...node.querySelectorAll("circle.sszvis-legend__mark")];
    const expected = ["A", "B", "C", "D", "E"].map((d) => resolvedColor(s(d)));
    expect(marks.length).toBe(5);
    expect(marks.map((m) => resolvedColor(m.getAttribute("fill")))).toEqual(expected);
    expect(marks.map((m) => resolvedColor(m.getAttribute("stroke")))).toEqual(expected);
  });

  test("should place the swatch before the label and centre both on the row", () => {
    const node = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
    const mark = node.querySelector("circle.sszvis-legend__mark");
    const label = node.querySelector<SVGTextElement>("text.sszvis-legend__label");
    // rowHeight 21 -> halfPixel(10.5) === 10.5
    expect(mark?.getAttribute("cx")).toBe("6");
    expect(mark?.getAttribute("cy")).toBe("10.5");
    expect(label?.getAttribute("transform")).toBe("translate(18,10.5)");
    expect(label?.getAttribute("dy")).toBe("0.35em");
    expect(label?.style.textAnchor).toBe("start");
  });

  test("should mirror the swatch and label when rightAlign is set", () => {
    const node = render(
      legendColorOrdinal().scale(scale()).orientation("horizontal").rightAlign(true),
    );
    const mark = node.querySelector("circle.sszvis-legend__mark");
    const label = node.querySelector<SVGTextElement>("text.sszvis-legend__label");
    expect(mark?.getAttribute("cx")).toBe("-6");
    expect(label?.getAttribute("transform")).toBe("translate(-18,10.5)");
    expect(label?.style.textAnchor).toBe("end");
  });

  describe("horizontal orientation", () => {
    test("should fill rows left to right and wrap onto the next row after the column count, defaulting to three columns", () => {
      const threeAcross = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 400, y: 0 },
        { x: 0, y: 21 },
        { x: 200, y: 21 },
      ];
      const explicit = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3),
      );
      expect(positions(explicit)).toEqual(threeAcross);
      // no columns set: the default is the same three-column grid
      const byDefault = render(legendColorOrdinal().scale(scale()).orientation("horizontal"));
      expect(positions(byDefault)).toEqual(threeAcross);
    });

    test("should offset entries by columnWidth and rowHeight when both are set", () => {
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .orientation("horizontal")
          .columns(2)
          .columnWidth(80)
          .rowHeight(30),
      );
      expect(positions(node)).toEqual([
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 0, y: 30 },
        { x: 80, y: 30 },
        { x: 0, y: 60 },
      ]);
    });

    test("should read a null columnWidth as a zero column offset", () => {
      // NOTE: null does not reduce the column count, so the two entries of each
      // row overlap. `colorLegendLayout` only passes null once it has settled on
      // one column, where the horizontal offset does not matter.
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(2).columnWidth(null),
      );
      expect(transforms(node)).toEqual([
        "translate(0,0)",
        "translate(0,0)",
        "translate(0,21)",
        "translate(0,21)",
        "translate(0,42)",
      ]);
    });

    test("should stack every entry in a single column when columnWidth is null and one column is asked for", () => {
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(1).columnWidth(null),
      );
      expect(positions(node)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 21 },
        { x: 0, y: 42 },
        { x: 0, y: 63 },
        { x: 0, y: 84 },
      ]);
    });

    test("should round up to the next whole column when the column count is fractional", () => {
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(2.2),
      );
      // Math.ceil(2.2) === 3 columns
      expect(positions(node)?.[3]).toEqual({ x: 0, y: 21 });
    });
  });

  describe("vertical orientation", () => {
    test("should fill columns top to bottom and wrap into the next column after the row count", () => {
      const node = render(legendColorOrdinal().scale(scale()).orientation("vertical").rows(2));
      expect(positions(node)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 21 },
        { x: 200, y: 0 },
        { x: 200, y: 21 },
        { x: 400, y: 0 },
      ]);
    });

    test("should offset entries by columnWidth and rowHeight when both are set", () => {
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .orientation("vertical")
          .rows(3)
          .columnWidth(50)
          .rowHeight(10),
      );
      expect(positions(node)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 0, y: 20 },
        { x: 50, y: 0 },
        { x: 50, y: 10 },
      ]);
    });
  });

  test("should list the entries back to front without moving the layout slots when reverse is set", () => {
    const node = render(
      legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3).reverse(true),
    );
    expect(labels(node)).toEqual(["E", "D", "C", "B", "A"]);
    expect(positions(node)?.[0]).toEqual({ x: 0, y: 0 });
  });

  test("should leave the scale's own domain untouched when reverse is set", () => {
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
        .verticallyCentered(true),
    );
    // 5 entries * 21px / 2 === 52.5, prepended to each entry's own translate
    expect(transforms(node)?.[0]).toBe("translate(0,-52.5) translate(0,0)");
    expect(transforms(node)?.[4]).toBe("translate(0,-52.5) translate(200,21)");
  });

  describe("horizontal float layout", () => {
    /** Pins every entry to a fixed measured width so positions are deterministic. */
    const mockEntryWidth = (width: number) =>
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);

    test("should pack entries left to right and wrap at floatWidth when no orientation is set", () => {
      mockEntryWidth(50);
      // no orientation is set: the float layout needs none, and the required-orientation
      // guard must not reject it
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(200),
      );
      // 50px entries with 20px padding: three fit in 200px, the fourth starts a new row
      expect(positions(node)).toEqual([
        { x: 0, y: 0 },
        { x: 70, y: 0 },
        { x: 140, y: 0 },
        { x: 0, y: 21 },
        { x: 70, y: 21 },
      ]);
    });

    test("should keep an entry on the same row when it ends exactly on floatWidth", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(150).floatPadding(0),
      );
      // the third entry ends at exactly 150, which still fits - the wrap is strictly ">"
      expect(positions(node)?.slice(0, 4)).toEqual([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 21 },
      ]);
    });

    test("should separate packed entries by floatPadding when one is given", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal().scale(scale()).horizontalFloat(true).floatWidth(200).floatPadding(5),
      );
      expect(positions(node)?.slice(0, 3)).toEqual([
        { x: 0, y: 0 },
        { x: 55, y: 0 },
        { x: 110, y: 0 },
      ]);
    });

    test("should pack entries by float width rather than by rows when an orientation is also set", () => {
      mockEntryWidth(50);
      const node = render(
        legendColorOrdinal()
          .scale(scale())
          .horizontalFloat(true)
          .floatWidth(200)
          .orientation("vertical"),
      );
      expect(positions(node)?.[1]).toEqual({ x: 70, y: 0 });
    });
  });

  test("should keep one entry per domain member when the same legend is applied twice", () => {
    const legend = legendColorOrdinal().scale(scale()).orientation("horizontal").columns(3);
    const group = layer("ordinal-rerender");
    group.call(legend);
    group.call(legend);
    const node = group.node() as SVGGElement;
    expect(entries(node).length).toBe(5);
    expect(node.querySelectorAll("circle.sszvis-legend__mark").length).toBe(5);
    expect(node.querySelectorAll("text.sszvis-legend__label").length).toBe(5);
  });

  test.each([
    ["unset", undefined],
    // a runtime value the type system would reject
    ["unrecognised", "diagonal"],
  ])(
    "should throw a named error and render nothing when the orientation is %s",
    (label, orientation) => {
      const group = layer(`ordinal-orientation-${label}`);
      const legend = legendColorOrdinal().scale(scale());
      if (orientation !== undefined) (legend.orientation as (o: string) => unknown)(orientation);
      expect(() => group.call(legend)).toThrowError(
        '[legendColorOrdinal] orientation must be "horizontal" or "vertical" unless horizontalFloat is true',
      );
      // thrown before anything is rendered
      expect(entries(group.node() as SVGGElement).length).toBe(0);
    },
  );

  describe("known quirks", () => {
    test("does not clamp the layout to the number of entries", () => {
      // NOTE: intended - the JSDoc calls these "the target number of columns", not a
      // bound on content, so asking for more columns than entries spreads them along one
      // row. Pinned because the property name suggests a grid rather than a target.
      const node = render(
        legendColorOrdinal().scale(scale()).orientation("horizontal").columns(10),
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
