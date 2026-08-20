import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { stackedPyramid, stackedPyramidData } from "../../src/component/stackedPyramid.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/** One row of the flat input the layout function expects. */
type Row = { side: string; row: number; series: string; value: number };

/**
 * One slice of a stack: the [y0, y1] pair d3.stack produced, rewritten in place so that
 * `data` is the single source row rather than the whole cascade row, and tagged with the
 * series, the side and the row it belongs to.
 */
type Slice = [number, number] & {
  data: Row;
  series: string;
  side: string;
  row: number;
  value: number;
};

/** All slices sharing a series key, i.e. one layer of one side's stack. */
type Series = Slice[] & { key: string; index: number };

/** One side of the pyramid: the series d3.stack produced for it. */
type Side = Series[];

/** What stackedPyramidData returns: the sides, with the overall maximum hung off the array. */
type Layout = Side[] & { maxValue: number | undefined };

describe("component/stackedPyramid", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  const sideAcc = (d: Row) => d.side;
  const rowAcc = (d: Row) => d.row;
  const seriesAcc = (d: Row) => d.series;
  const valueAcc = (d: Row) => d.value;

  /**
   * Two sides, two rows, two series. The left side ("f") stacks to 30 and 20, the right
   * side ("m") to 70 and 3, so every number below is traceable to one of these rows.
   */
  const rows: Row[] = [
    { side: "f", row: 0, series: "a", value: 10 },
    { side: "f", row: 0, series: "b", value: 20 },
    { side: "f", row: 1, series: "a", value: 5 },
    { side: "f", row: 1, series: "b", value: 15 },
    { side: "m", row: 0, series: "a", value: 30 },
    { side: "m", row: 0, series: "b", value: 40 },
    { side: "m", row: 1, series: "a", value: 1 },
    { side: "m", row: 1, series: "b", value: 2 },
  ];

  const layout = (data: Row[] = rows): Layout =>
    stackedPyramidData(sideAcc, rowAcc, seriesAcc, valueAcc)(data);

  /** The [y0, y1] pairs of one side, series by series, without the attached properties. */
  const pairs = (s: Side) => s.map((series) => series.map((d) => [d[0], d[1]]));

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `stackedpyramid-${++layerKey}`,
    }).selectGroup("pyramid");

  const render = (component: unknown, data: unknown = layout()) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * A pyramid wired to the layout above: barWidth is the identity, so a stacked value of 10
   * is 10 pixels wide, and barPosition spaces the rows 12 pixels apart.
   */
  const pyramidOf = () =>
    stackedPyramid()
      .barHeight(10)
      .barWidth((v: number) => v)
      .barPosition((row: number) => row * 12)
      .leftAccessor((d: Layout) => d[0])
      .rightAccessor((d: Layout) => d[1]);

  const sideGroup = (node: Element, key: string) =>
    node.querySelector(`[data-d3-selectgroup="${key}"]`) as SVGGElement | null;
  const stacks = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("[data-sszvis-stack]") ?? []),
  ];
  const bars = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("rect.sszvis-bar") ?? []),
  ];
  const attrs = (node: Element, key: string, attr: string) =>
    bars(node, key).map((b) => b.getAttribute(attr));
  const anchors = (node: Element, key: string) =>
    [...(sideGroup(node, key)?.querySelectorAll("[data-tooltip-anchor]") ?? [])].map((a) =>
      a.getAttribute("transform")
    );
  const lines = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("path.sszvis-path") ?? []),
  ];
  /** The reference line's `d` is applied through a transition, so it lands a frame later. */
  const lineD = (node: Element, key: string) =>
    vi.waitFor(() => {
      const d = lines(node, key)[0]?.getAttribute("d");
      expect(d).not.toBeNull();
      return d;
    });

  describe("stackedPyramidData", () => {
    test("should return one entry per side", () => {
      const sides = layout();
      expect(sides.length).toBe(2);
      expect(sides[0][0][0].side).toBe("f");
      expect(sides[1][0][0].side).toBe("m");
    });

    test("should stack each side independently, one series per series key", () => {
      const sides = layout();
      // The default stack order is stackOrderNone, so the keys stack front to back: "a"
      // sits on the baseline and "b" on top of it.
      expect(pairs(sides[0])).toEqual([
        [
          [0, 10],
          [0, 5],
        ],
        [
          [10, 30],
          [5, 20],
        ],
      ]);
      expect(pairs(sides[1])).toEqual([
        [
          [0, 30],
          [0, 1],
        ],
        [
          [30, 70],
          [1, 3],
        ],
      ]);
    });

    test("should tag every slice with its series, side, row and value", () => {
      const sides = layout();
      expect(sides[0].map((series) => series.map((d) => d.series))).toEqual([
        ["a", "a"],
        ["b", "b"],
      ]);
      expect(sides[0].map((series) => series.map((d) => d.side))).toEqual([
        ["f", "f"],
        ["f", "f"],
      ]);
      expect(sides[0].map((series) => series.map((d) => d.row))).toEqual([
        [0, 1],
        [0, 1],
      ]);
      expect(sides[0].map((series) => series.map((d) => d.value))).toEqual([
        [10, 5],
        [20, 15],
      ]);
    });

    test("should narrow each slice's data down to the single source row", () => {
      const sides = layout();
      expect(sides[0][0][0].data).toBe(rows[0]);
      expect(sides[0][1][1].data).toBe(rows[3]);
      expect(sides[1][1][0].data).toBe(rows[5]);
    });

    test("should carry d3's own key and index on each series", () => {
      const sides = layout();
      expect(sides[0].map((series) => series.key)).toEqual(["a", "b"]);
      expect(sides[0].map((series) => series.index)).toEqual([0, 1]);
    });

    test("should report the highest stacked total across both sides as maxValue", () => {
      expect(layout().maxValue).toBe(70);
    });

    test("should return an empty layout for empty data", () => {
      const sides = layout([]);
      expect(sides.length).toBe(0);
      expect(sides.maxValue).toBeUndefined();
    });

    test("should not mutate the input rows", () => {
      const data = rows.map((d) => ({ ...d }));
      layout(data);
      expect(data).toEqual(rows);
      for (const d of data) expect(Object.keys(d)).toEqual(["side", "row", "series", "value"]);
    });

    test("should accept sides of different shapes", () => {
      // The two sides are stacked independently, so they need neither the same rows nor the
      // same series count.
      const sides = layout([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "m", row: 0, series: "a", value: 2 },
        { side: "m", row: 0, series: "b", value: 3 },
        { side: "m", row: 1, series: "a", value: 4 },
        { side: "m", row: 1, series: "b", value: 5 },
      ]);
      expect(sides[0].length).toBe(1);
      expect(sides[1].length).toBe(2);
      expect(sides.maxValue).toBe(9);
    });

    describe("known quirks", () => {
      test("takes the series keys from each side's first row only", () => {
        // BUG: `keys` is Object.keys(rows[0]) rather than the union across rows, so a series
        // that is absent from the first row of a side is dropped from that whole side.
        // stackedBarData takes the union of the keys across every row - though its own
        // unguarded cell read then throws on the sparse data that survives.
        // current: side "f" has one series and its "b" values are silently discarded.
        // expected: the union of the side's series keys, with the missing cell contributing 0.
        const sides = layout([
          { side: "f", row: 0, series: "a", value: 1 },
          { side: "f", row: 1, series: "a", value: 2 },
          { side: "f", row: 1, series: "b", value: 3 },
        ]);
        expect(sides[0].length).toBe(1);
        expect(sides[0].map((series) => series.key)).toEqual(["a"]);
        // The 3 is nowhere in the layout, so it is missing from maxValue too.
        expect(sides.maxValue).toBe(2);
      });

      test("throws when a later row is missing a series the first row has", () => {
        // BUG: the stack value accessor reads x[key][0] unguarded, so a row that does not
        // carry every key of the first row dies on an undefined cell. Together with the
        // quirk above this means every row of a side has to carry every series, and the
        // first row decides which - callers with sparse data have to pad it with zero rows.
        // current: TypeError. expected: the missing cell contributes 0.
        expect(() =>
          layout([
            { side: "f", row: 0, series: "a", value: 1 },
            { side: "f", row: 0, series: "b", value: 2 },
            { side: "f", row: 1, series: "a", value: 3 },
          ])
        ).toThrow(TypeError);
      });

      test("numbers the rows by position rather than by the row accessor's value", () => {
        // BUG: `d.row = row` is the index of the row within the side, not the value the row
        // accessor returned, and that index is what the component feeds to barPosition. It
        // only lines up with the data when the row values happen to be a dense 0-based
        // range, which is what the population pyramid example relies on: it builds its
        // position scale over d3.range(0, 101) and its ages happen to be 0...100.
        // current: rows valued 40 and 80 are numbered 0 and 1. expected: 40 and 80, or a
        // documented contract that barPosition receives an index.
        const sides = layout([
          { side: "f", row: 40, series: "a", value: 1 },
          { side: "f", row: 80, series: "a", value: 2 },
        ]);
        expect(sides[0][0].map((d) => d.row)).toEqual([0, 1]);
        // The source row still knows its real value; only the tag on the slice is an index.
        expect(sides[0][0].map((d) => d.data.row)).toEqual([40, 80]);
      });

      test("orders the rows by their stringified keys, not by the order they arrive in", () => {
        // NOTE: the cascade groups the rows into a plain object keyed by String(row), and
        // JavaScript iterates array-index keys in ascending numeric order regardless of
        // insertion order. Dense non-negative integer rows therefore sort themselves, which
        // is what makes the index-as-position quirk above survivable. Row values that are
        // not array-index keys - negatives, floats, plain strings - fall back to insertion
        // order and are laid out in whatever order the input happened to be in, which this
        // test does not cover.
        const sorted = layout([
          { side: "f", row: 2, series: "a", value: 1 },
          { side: "f", row: 0, series: "a", value: 2 },
          { side: "f", row: 1, series: "a", value: 3 },
        ]);
        expect(sorted[0][0].map((d) => d.data.row)).toEqual([0, 1, 2]);
      });

      test("orders the sides the same way, so which side is index 0 depends on the keys", () => {
        // NOTE: the sides are an array, so the caller picks them positionally -
        // leftAccessor(prop("0")) in docs/population-pyramid/pyramid-stacked.js. Which side
        // that is comes from the same key ordering: numeric side values sort ascending,
        // string ones keep insertion order. A dataset whose first row is male therefore
        // puts men on the left, silently mirroring the chart.
        const strings = layout([
          { side: "m", row: 0, series: "a", value: 1 },
          { side: "f", row: 0, series: "a", value: 2 },
        ]);
        expect(strings[0][0][0].side).toBe("m");
        const numbers = layout([
          { side: 1 as unknown as string, row: 0, series: "a", value: 1 },
          { side: 0 as unknown as string, row: 0, series: "a", value: 2 },
        ]);
        expect(numbers[0][0][0].side).toBe(0);
      });

      test("stringifies the series keys, losing a numeric series order", () => {
        // BUG: the same key coercion applies to the series, and the key order is the
        // stacking order, so a series accessor returning years or numeric codes silently
        // restacks the chart in ascending numeric order. Shared with stackedBarData, where
        // it is filed as a bug for the same reason.
        // current: 2010 arrives first but stacks on top of 2000. expected: the accessor's
        // order decides the stacking order.
        const sides = layout([
          { side: "f", row: 0, series: 2010 as unknown as string, value: 1 },
          { side: "f", row: 0, series: 2000 as unknown as string, value: 2 },
        ]);
        expect(sides[0].map((series) => series.key)).toEqual(["2000", "2010"]);
        // ...and the series key is now a string even though the accessor returned a number.
        expect(sides[0][0][0].series).toBe("2000");
      });

      test("stacks only the first row of a cell", () => {
        // BUG: the stack value is read as x[key][0], so data that is not already aggregated
        // to one row per (side, row, series) triplet is silently truncated rather than
        // summed. The header says the triplet "MUST appear only once" and that the function
        // "makes no effort to normalize the data if that's not the case", but nothing
        // reports a violation. Shared with stackedBarData.
        // current: the second 100 is dropped. expected: 101, or a reported error.
        const sides = layout([
          { side: "f", row: 0, series: "a", value: 1 },
          { side: "f", row: 0, series: "a", value: 100 },
        ]);
        expect(sides[0][0][0][1]).toBe(1);
        expect(sides[0][0].length).toBe(1);
      });

      test("does not check that there are exactly two sides", () => {
        // NOTE: the header requires the side accessor to have a cardinality of two, but
        // nothing enforces it. One side leaves rightAccessor(prop("1")) returning undefined,
        // which throws from d3's data join. Three sides are all returned, and it is the
        // caller's positional accessors that then ignore the third, so it disappears from
        // the chart without a word.
        expect(layout([{ side: "f", row: 0, series: "a", value: 1 }]).length).toBe(1);
        expect(
          layout([
            { side: "f", row: 0, series: "a", value: 1 },
            { side: "m", row: 0, series: "a", value: 2 },
            { side: "x", row: 0, series: "a", value: 3 },
          ]).length
        ).toBe(3);
      });

      test("hangs maxValue off the array, so any array operation drops it", () => {
        // NOTE: maxValue is a property on the returned array rather than a field of a
        // wrapper object, so a spread, a map, a filter or a trip through JSON loses it. The
        // examples read it straight off the layout, so this only bites a caller who
        // transforms the layout first. stackedBarData does the same and is filed as a bug for
        // it, but it also hangs a `keys` property off the array, which shadows
        // Array.prototype.keys and makes that layout actively badly behaved. This layout
        // attaches only maxValue, so the loss on copy is all there is to it - hence a note
        // here and a bug there.
        const sides = layout();
        expect(sides.maxValue).toBe(70);
        expect(([...sides] as Layout).maxValue).toBeUndefined();
        expect((JSON.parse(JSON.stringify(sides)) as Layout).maxValue).toBeUndefined();
      });

      test("reports maxValue as undefined rather than 0 for an empty layout", () => {
        // BUG: maxValue is d3.max over an empty array, which is undefined rather than 0. The
        // example feeds it straight into a scale domain - `domain([0, state.maxStackedValue])`
        // - where undefined coerces to NaN, so the scale maps every value to NaN and the axis
        // draws its domain line with no ticks at all. An empty data state is ordinary, not an
        // edge case: any filter that can match nothing reaches it. Shared with stackedBarData.
        // current: undefined. expected: 0, so a domain built from it stays valid.
        expect(layout([]).maxValue).toBeUndefined();
      });

      test("computes maxValue from the upper bounds only", () => {
        // NOTE: max over row[1], so only the upper bounds enter. Here the lower bound of
        // -50 is invisible and maxValue is -40, which is not the extent of the data. Neither
        // side of the pyramid supports values below the baseline anyway - see the
        // negative-value quirk below.
        expect(
          layout([
            { side: "f", row: 0, series: "a", value: -50 },
            { side: "f", row: 0, series: "b", value: 10 },
          ]).maxValue
        ).toBe(-40);
      });

      test("attaches a value that duplicates the pair it was computed from", () => {
        // NOTE: the component reads only `row` and `data` off a slice; `side`, `series` and
        // `value` are attached for the caller's benefit. `value` duplicates d[1] - d[0], so
        // it goes stale if a caller ever rewrites the pair.
        const sides = layout();
        const slice = sides[0][0][0];
        expect(slice.value).toBe(slice[1] - slice[0]);
      });

      test("merges keys that differ only in type", () => {
        // NOTE: the cascade groups on String(key), so the number 1 and the string "1" land
        // in the same group - for the sides, the rows and the series alike. The two rows
        // below become one cell, and only the first of them is stacked, so the second value
        // vanishes. Shared with stackedBarData.
        const sides = layout([
          { side: 1 as unknown as string, row: 0, series: "a", value: 1 },
          { side: "1", row: 0, series: "a", value: 2 },
        ]);
        expect(sides.length).toBe(1);
        expect(sides[0][0].length).toBe(1);
        expect(sides[0][0][0][1]).toBe(1);
        // The side tag comes from the first row of the merged group, so it keeps its type.
        expect(sides[0][0][0].side).toBe(1);
      });
    });
  });

  describe("props", () => {
    test("should expose every prop the renderer reads", () => {
      const component = stackedPyramid();
      for (const prop of [
        "barHeight",
        "barWidth",
        "barPosition",
        "barFill",
        "tooltipAnchor",
        "leftAccessor",
        "rightAccessor",
        "leftRefAccessor",
        "rightRefAccessor",
      ]) {
        expect(typeof component[prop]).toBe("function");
      }
    });

    test("should default barFill to black and tooltipAnchor to the centre", () => {
      const component = stackedPyramid();
      expect(component.barFill()()).toBe("#000");
      expect(component.tooltipAnchor()).toEqual([0.5, 0.5]);
    });
  });

  describe("groups", () => {
    test("should render a group per side plus a group per reference line", () => {
      const node = render(pyramidOf());
      expect(sideGroup(node, "leftStack")).not.toBeNull();
      expect(sideGroup(node, "rightStack")).not.toBeNull();
      expect(sideGroup(node, "leftReference")).not.toBeNull();
      expect(sideGroup(node, "rightReference")).not.toBeNull();
    });

    test("should render the reference groups after the bars, so lines draw on top", () => {
      const node = render(pyramidOf());
      const keys = [...node.querySelectorAll("[data-d3-selectgroup]")].map((g) =>
        g.getAttribute("data-d3-selectgroup")
      );
      expect(keys).toEqual(["leftStack", "rightStack", "leftReference", "rightReference"]);
    });

    test("should create the reference groups even when no reference data is configured", () => {
      const node = render(pyramidOf());
      expect(sideGroup(node, "leftReference")?.childElementCount).toBe(0);
      expect(sideGroup(node, "rightReference")?.childElementCount).toBe(0);
    });

    test("should render one stack group per series on each side", () => {
      const node = render(pyramidOf());
      expect(stacks(node, "leftStack").length).toBe(2);
      expect(stacks(node, "rightStack").length).toBe(2);
      expect(stacks(node, "leftStack")[0].tagName).toBe("g");
    });

    test("should mark the stack groups with a data attribute rather than a class", () => {
      // stackedBar uses a .sszvis-stack class for the same job; this component uses
      // [data-sszvis-stack] and sets no class at all.
      const node = render(pyramidOf());
      expect(stacks(node, "leftStack")[0].getAttribute("data-sszvis-stack")).toBe("");
      expect(stacks(node, "leftStack")[0].getAttribute("class")).toBeNull();
    });
  });

  describe("bars", () => {
    test("should render one bar per row per series on each side", () => {
      const node = render(pyramidOf());
      expect(bars(node, "leftStack").length).toBe(4);
      expect(bars(node, "rightStack").length).toBe(4);
    });

    test("should mirror the left bars across the spine", () => {
      const node = render(pyramidOf());
      // x = -SPINE_PADDING - barWidth(d[1]): the bar's outer edge, since it grows leftwards
      expect(attrs(node, "leftStack", "x")).toEqual(["-10.5", "-5.5", "-30.5", "-20.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["10", "5", "20", "15"]);
    });

    test("should place the right bars outwards from the spine", () => {
      const node = render(pyramidOf());
      // x = SPINE_PADDING + barWidth(d[0]): the bar's inner edge
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5", "0.5", "30.5", "1.5"]);
      expect(attrs(node, "rightStack", "width")).toEqual(["30", "1", "40", "2"]);
    });

    test("should leave a one pixel gap across the spine", () => {
      const node = render(pyramidOf());
      // 2 * SPINE_PADDING: the innermost left bar ends at -0.5, the right one starts at 0.5
      const leftEdge =
        Number(attrs(node, "leftStack", "x")[0]) + Number(attrs(node, "leftStack", "width")[0]);
      expect(leftEdge).toBe(-0.5);
      expect(Number(attrs(node, "rightStack", "x")[0])).toBe(0.5);
    });

    test("should stack the segments of one row without a gap between them", () => {
      const node = render(pyramidOf());
      // Series "a" of row 0 on the right runs 0.5...30.5, series "b" starts exactly there.
      const firstEnd =
        Number(attrs(node, "rightStack", "x")[0]) + Number(attrs(node, "rightStack", "width")[0]);
      expect(firstEnd).toBe(30.5);
      expect(Number(attrs(node, "rightStack", "x")[2])).toBe(30.5);
    });

    test("should take the vertical position from barPosition and the row index", () => {
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "y")).toEqual(["0", "12", "0", "12"]);
      expect(attrs(node, "rightStack", "y")).toEqual(["0", "12", "0", "12"]);
    });

    test("should take the height from barHeight", () => {
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "height")).toEqual(["10", "10", "10", "10"]);
    });

    test("should apply barFill to the slice's source row", () => {
      const node = render(
        pyramidOf().barFill((d: Row) => (d.series === "a" ? "#f00" : "#00f")),
        layout()
      );
      expect(attrs(node, "leftStack", "fill")).toEqual(["#f00", "#f00", "#00f", "#00f"]);
      expect(attrs(node, "rightStack", "fill")).toEqual(["#f00", "#f00", "#00f", "#00f"]);
    });

    test("should default barFill to black", () => {
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "fill")).toEqual(["#000", "#000", "#000", "#000"]);
    });

    test("should not set a stroke on the bars", () => {
      // Unlike stackedBar, which paints a 1px white separator between segments, this
      // component leaves bar's stroke unset, so the segments touch without a seam.
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "stroke")).toEqual([null, null, null, null]);
    });

    test("should render nothing for an empty layout", () => {
      const empty = layout([]);
      const node = render(
        stackedPyramid()
          .barHeight(10)
          .barWidth((v: number) => v)
          .barPosition((row: number) => row * 12)
          .leftAccessor(() => [])
          .rightAccessor(() => []),
        empty
      );
      expect(stacks(node, "leftStack").length).toBe(0);
      expect(bars(node, "leftStack").length).toBe(0);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = pyramidOf();
      const g = group("rerender");
      g.datum(layout()).call(component as never);
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="leftStack"]').length).toBe(1);
      expect(stacks(node, "leftStack").length).toBe(2);
      expect(bars(node, "leftStack").length).toBe(4);
      expect(anchors(node, "leftStack").length).toBe(4);
    });

    test("should remove stacks when a side loses a series", () => {
      const component = pyramidOf();
      const g = group("shrink-series");
      g.datum(layout()).call(component as never);
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 10 },
          { side: "f", row: 1, series: "a", value: 5 },
          { side: "m", row: 0, series: "a", value: 30 },
          { side: "m", row: 1, series: "a", value: 1 },
        ])
      ).call(component as never);
      const node = g.node() as SVGGElement;
      expect(stacks(node, "leftStack").length).toBe(1);
      expect(bars(node, "leftStack").length).toBe(2);
    });

    test("should remove bars when a side loses a row", () => {
      const component = pyramidOf();
      const g = group("shrink-rows");
      g.datum(layout()).call(component as never);
      g.datum(layout(rows.filter((d) => d.row === 0))).call(component as never);
      const node = g.node() as SVGGElement;
      expect(bars(node, "leftStack").length).toBe(2);
      expect(attrs(node, "leftStack", "y")).toEqual(["0", "0"]);
    });

    test("should update the geometry when the data changes", () => {
      const component = pyramidOf();
      const g = group("update");
      g.datum(layout()).call(component as never);
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 99 },
          { side: "m", row: 0, series: "a", value: 7 },
        ])
      ).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "leftStack", "x")).toEqual(["-99.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["99"]);
      expect(attrs(node, "rightStack", "width")).toEqual(["7"]);
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per bar, inside the bar's stack group", () => {
      const node = render(pyramidOf());
      expect(anchors(node, "leftStack").length).toBe(4);
      expect(
        [...stacks(node, "leftStack")[0].querySelectorAll("[data-tooltip-anchor]")].length
      ).toBe(2);
    });

    test("should centre the anchors on the bars by default", () => {
      const node = render(pyramidOf());
      // The default tooltipAnchor of [0.5, 0.5] overrides bar's own top-centre default:
      // x + 0.5 * width, y + 0.5 * height
      expect(anchors(node, "leftStack")).toEqual([
        "translate(-5.5,5)",
        "translate(-3,17)",
        "translate(-20.5,5)",
        "translate(-13,17)",
      ]);
      expect(anchors(node, "rightStack")).toEqual([
        "translate(15.5,5)",
        "translate(1,17)",
        "translate(50.5,5)",
        "translate(2.5,17)",
      ]);
    });

    test("should pass a custom tooltipAnchor through to both sides", () => {
      const node = render(pyramidOf().tooltipAnchor([0, 0]));
      expect(anchors(node, "leftStack")[0]).toBe("translate(-10.5,0)");
      expect(anchors(node, "rightStack")[0]).toBe("translate(0.5,0)");
    });

    test("should not mirror tooltipAnchor for the left side", () => {
      // NOTE: tooltipAnchor is handed to both bar components unchanged, and bar measures
      // from its own upper left corner, which on the left side is the segment's outer edge.
      // The same setting therefore lands on visually opposite sides of the pyramid, and
      // only x = 0.5 is mirror-safe. Shared with pyramid.
      const node = render(pyramidOf().tooltipAnchor([1, 0.5]));
      expect(anchors(node, "rightStack")[0]).toBe("translate(30.5,5)");
      expect(anchors(node, "leftStack")[0]).toBe("translate(-0.5,5)");
    });

    test("should yield a NaN coordinate for a tooltipAnchor with fewer than two entries", () => {
      // NOTE: inherited from bar, and documented on bar's tooltipAnchor property. The
      // component adds no validation of its own.
      const node = render(pyramidOf().tooltipAnchor([0.5]));
      expect(anchors(node, "rightStack")[0]).toBe("translate(15.5,NaN)");
    });
  });

  describe("reference lines", () => {
    /**
     * A reference series has to be an array of values that barWidth accepts, because the
     * line generator hands each element to barWidth for x and to barPosition for y. With
     * the identity barWidth and the row-index barPosition used here, that means row
     * indices, which give a y that lines up with the bars and an x that is meaningless. No
     * shape satisfies both - see the quirk below.
     */
    const withRefs = () =>
      pyramidOf()
        .leftRefAccessor(() => [0, 1])
        .rightRefAccessor(() => [0, 1]);

    test("should render no path when no reference accessor is set", () => {
      const node = render(pyramidOf());
      expect(lines(node, "leftReference").length).toBe(0);
      expect(lines(node, "rightReference").length).toBe(0);
    });

    test("should render exactly one classed path per configured side", () => {
      const node = render(withRefs());
      expect(lines(node, "leftReference").length).toBe(1);
      expect(lines(node, "rightReference").length).toBe(1);
      expect(lines(node, "leftReference")[0].tagName).toBe("path");
    });

    test("should render only the configured side", () => {
      const node = render(pyramidOf().rightRefAccessor(() => [0, 1]));
      expect(lines(node, "leftReference").length).toBe(0);
      expect(lines(node, "rightReference").length).toBe(1);
    });

    test("should mirror the left reference line only", () => {
      const node = render(withRefs());
      expect(lines(node, "leftReference")[0].getAttribute("transform")).toBe("scale(-1, 1)");
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("should draw the path from barWidth and barPosition", async () => {
      const node = render(withRefs());
      // x = barWidth(d), y = barPosition(d), both called with the reference element itself
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");
    });

    test("should inline the line's appearance rather than relying on a stylesheet", () => {
      // The opposite choice from pyramid, whose reference line sets only a class and takes
      // all four values from .sszvis-pyramid__referenceline in sszvis.css.
      const node = render(withRefs());
      const path = lines(node, "rightReference")[0];
      expect(path.getAttribute("fill")).toBe("none");
      expect(path.getAttribute("stroke")).toBe("#aaa");
      expect(path.getAttribute("stroke-width")).toBe("2");
      expect(path.getAttribute("stroke-dasharray")).toBe("3 3");
    });

    test("should re-render the reference line in place", async () => {
      const component = withRefs();
      const g = group("ref-rerender");
      g.datum(layout()).call(component as never);
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(lines(node, "rightReference").length).toBe(1);
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");
    });

    test("should animate the reference line when the data changes", async () => {
      let ref = [0, 1];
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("ref-animate");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");

      ref = [2, 3];
      g.datum(layout()).call(component as never);
      // Unlike the bars, the line really does transition: the old path is still in place on
      // the tick the re-render happens.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M0,0L1,12");
      await vi.waitFor(() =>
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M2,24L3,36")
      );
    });
  });

  describe("required props", () => {
    /** Both side accessors wired up, but no bar dimensions set. */
    const bare = () =>
      stackedPyramid()
        .leftAccessor((d: Layout) => d[0])
        .rightAccessor((d: Layout) => d[1]);

    test("should throw when leftAccessor is missing", () => {
      expect(() =>
        render(
          stackedPyramid()
            .barHeight(10)
            .barWidth((v: number) => v)
            .barPosition(0)
        )
      ).toThrow(TypeError);
    });

    test("should throw when barWidth is missing", () => {
      // barWidth is called by the component itself, for both the x and the width of every
      // bar, so an unset prop dies immediately.
      expect(() => render(bare().barHeight(10).barPosition(0))).toThrow(TypeError);
    });

    test("should throw when barPosition is missing", () => {
      // barPosition is composed with the row accessor - fn.compose(props.barPosition,
      // rowAcc) - and compose calls it as fns[0].call, so an unset prop throws too, but
      // from inside fn.compose ("Cannot read properties of undefined (reading 'call')")
      // rather than from the component's own closure the way barWidth does. Both surface
      // while bar is applying its attributes.
      expect(() =>
        render(
          bare()
            .barHeight(10)
            .barWidth((v: number) => v)
        )
      ).toThrow(TypeError);
    });

    describe("known quirks", () => {
      test("silently renders zero-height bars when barHeight is missing", () => {
        // BUG: barHeight is the one dimension passed straight through to bar, which runs it
        // through its NaN guard, so an unset prop becomes 0 instead of an error. The chart
        // renders as an empty axis frame with no visible bars and no warning. Of the three
        // required dimensions only this one fails silently; the other two throw, with two
        // different messages. Shared with pyramid.
        // current: height="0". expected: an error naming the missing prop.
        const node = render(
          bare()
            .barWidth((v: number) => v)
            .barPosition(0)
        );
        expect(attrs(node, "rightStack", "height")).toEqual(["0", "0", "0", "0"]);
      });

      test("throws when a side accessor returns undefined", () => {
        // NOTE: the error comes from d3's data join, so the message names neither the prop
        // nor the component: "undefined is not iterable".
        expect(() => render(pyramidOf().leftAccessor(() => undefined))).toThrow(TypeError);
      });
    });
  });

  describe("known quirks", () => {
    test("collapses every bar to zero width when barWidth is a constant", () => {
      // BUG: the width is computed as barWidth(d[1]) - barWidth(d[0]), so a constant - which
      // fn.functor turns into a function ignoring its argument - subtracts the constant from
      // itself and every segment disappears. pyramid accepts a constant barWidth happily,
      // and every other bar dimension here still does, so the asymmetry is silent.
      // current: width="0" for every segment. expected: a constant width, or an error.
      const node = render(
        stackedPyramid()
          .barHeight(10)
          .barWidth(20)
          .barPosition(0)
          .leftAccessor((d: Layout) => d[0])
          .rightAccessor((d: Layout) => d[1])
      );
      expect(attrs(node, "rightStack", "width")).toEqual(["0", "0", "0", "0"]);
      // The bars are still positioned, so they sit invisibly at the constant offset.
      expect(attrs(node, "rightStack", "x")).toEqual(["20.5", "20.5", "20.5", "20.5"]);
    });

    test("calls barWidth with a stacked value rather than with the datum", () => {
      // NOTE: pyramid calls barWidth with the bar's datum; here it is called with the
      // numbers out of the [y0, y1] pair, so barWidth has to be a scale over values, not an
      // accessor over data. This component's header documents the property as just "The
      // width of a bar", so nothing warns of the difference, and an accessor written for
      // pyramid silently misbehaves here - it would read properties off a number and
      // produce NaN, which bar's guard turns into 0.
      const seen: unknown[] = [];
      render(
        pyramidOf().barWidth((v: number) => {
          seen.push(v);
          return v;
        })
      );
      expect(seen.every((v) => typeof v === "number")).toBe(true);
      expect(seen).toContain(30);
    });

    test("drops d3's index when computing the bars' width and x", () => {
      // BUG: barWidth is invoked as props.barWidth(d[1]) with a single argument, while bar
      // passes (d, i, nodes) to the accessors it owns. An index-aware or node-aware barWidth
      // therefore sees undefined for i on every bar of both sides, and 30 + undefined is
      // NaN, which bar's guard turns into 0. Shared with pyramid, which has it on the left
      // side only.
      // current: every width and every x collapses to 0. expected: the index is forwarded.
      const node = render(pyramidOf().barWidth((v: number, i: number) => v + i));
      expect(attrs(node, "rightStack", "width")).toEqual(["0", "0", "0", "0"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0", "0", "0", "0"]);
    });

    test("drops d3's index when computing the bars' vertical position and fill too", () => {
      // BUG: the same happens for barPosition and barFill, with the same consequence - an
      // index-aware accessor returns NaN and bar's guard flattens it to 0 - but by a
      // different route: they are composed with an accessor, fn.compose(props.barPosition,
      // rowAcc), and fn.compose forwards every argument only to the innermost function.
      // barPosition and barFill are the outer ones, so they receive exactly one.
      // current: every argument after the first is dropped. expected: the index is
      // forwarded, as it is to the accessors bar owns.
      const positionArgs: unknown[][] = [];
      const fillArgs: unknown[][] = [];
      render(
        pyramidOf()
          .barPosition((...args: unknown[]) => {
            positionArgs.push(args);
            return 0;
          })
          .barFill((...args: unknown[]) => {
            fillArgs.push(args);
            return "#000";
          })
      );
      expect(positionArgs.every((args) => args.length === 1)).toBe(true);
      expect(fillArgs.every((args) => args.length === 1)).toBe(true);
    });

    test("the reference line reads barWidth and barPosition off the same element", async () => {
      // BUG: the line generator is d3.line().x(props.barWidth).y(props.barPosition), so both
      // props are called with the same reference element. In the bars, though, barWidth is
      // called with a stacked value and barPosition with a row index, so a reference element
      // has to be both at once. There is no shape that satisfies both for real data, and
      // the only stackedPyramid example (docs/population-pyramid/pyramid-stacked.js) sets
      // neither reference accessor - the reference-line example uses the plain pyramid
      // instead, where both props read the datum and the problem does not arise.
      // current: the reference line can only be drawn in a coordinate system the bars do not
      // use. expected: dedicated accessors for the reference series.
      const node = render(
        pyramidOf().rightRefAccessor(() => [10, 20]),
        layout()
      );
      // These are stacked values, so x is right...
      expect(await lineD(node, "rightReference")).toBe("M10,120L20,240");
      // ...but barPosition read them as row indices, so y is 10 and 20 rows down, far below
      // the two rows the chart actually has at y = 0 and y = 12.
      expect(attrs(node, "rightStack", "y")).toEqual(["0", "12", "0", "12"]);
    });

    test("the reference line ignores the spine padding", async () => {
      // NOTE: the bars are offset outwards by SPINE_PADDING (0.5) but the line is drawn
      // straight from barWidth, so a reference value equal to a bar's outer edge lands half
      // a pixel inside it. The line is the side that agrees with the axis scale - the
      // padding is a deliberate cosmetic gap at the spine. pyramid makes the identical
      // choice.
      const node = render(pyramidOf().rightRefAccessor(() => [70]));
      const outerEdge =
        Number(attrs(node, "rightStack", "x")[2]) + Number(attrs(node, "rightStack", "width")[2]);
      expect(outerEdge).toBe(70.5);
      // d3.line closes a single-point path with Z
      expect(await lineD(node, "rightReference")).toBe("M70,840Z");
    });

    test("has no d attribute on the tick the reference line is first rendered", async () => {
      // NOTE: the path's `d` is only ever applied through a transition, so the element
      // exists with no geometry until the first animation frame. Anything that measures the
      // chart synchronously after render - getBBox, a snapshot, an export to PNG - sees an
      // empty path. Shared with pyramid.
      const node = render(pyramidOf().rightRefAccessor(() => [0, 1]));
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull();
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");
    });

    test("crashes when a reference accessor returns undefined", () => {
      // BUG: the reference line is guarded on the accessor existing, not on it returning
      // data - `props.rightRefAccessor ? [props.rightRefAccessor(data)] : []`. An accessor
      // that returns undefined for some states throws instead of hiding the line.
      // current: TypeError. expected: no line. Shared with pyramid.
      expect(() => render(pyramidOf().rightRefAccessor(() => undefined))).toThrow(TypeError);
      expect(() => render(pyramidOf().rightRefAccessor(() => null))).toThrow(TypeError);
    });

    test("leaves an empty path element behind for empty reference data", async () => {
      // NOTE: an empty array is handled, but the path is still created - d3.line returns
      // null for no points, so `d` is simply absent. Shared with pyramid.
      const node = render(pyramidOf().rightRefAccessor(() => []));
      expect(lines(node, "rightReference").length).toBe(1);
      await vi.waitFor(() => expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull());
    });

    test("never removes a reference path once it has been rendered", async () => {
      // BUG: the reference datum is wrapped in an array - [props.rightRefAccessor(data)] -
      // so the join always has exactly one element and the exit selection can never fire.
      // When the reference series goes away the stale path stays in the DOM; only `d` is
      // dropped. The same wrapping caps each side at one reference line. Shared with pyramid.
      let ref: number[] = [0, 1];
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("ref-removal");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");

      ref = [];
      g.datum(layout()).call(component as never);
      await vi.waitFor(() => expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull());
      expect(lines(node, "rightReference").length).toBe(1);
    });

    test("does not guard the reference line against missing values", async () => {
      // BUG: bar runs every geometry value through a NaN guard, but the reference line
      // passes barWidth and barPosition straight to d3.line. One missing value poisons the
      // path string; the browser renders the valid prefix and drops the rest of the line.
      // current: d="MNaN,NaNL1,12". expected: the point is skipped, or coerced to 0.
      // Shared with pyramid.
      const node = render(pyramidOf().rightRefAccessor(() => [Number.NaN, 1]));
      expect(await lineD(node, "rightReference")).toBe("MNaN,NaNL1,12");
    });

    test("traces the top edges of the bars, not their mid-lines", async () => {
      // BUG: the reference line takes y straight from barPosition, which is a bar's top
      // edge, and never accounts for barHeight. The outline is drawn half a bar height above
      // the values it describes, and the error grows with barHeight. Shared with pyramid.
      // current: the line passes through the bars' top edges. expected: through their
      // mid-height, or as a step path along their outer edges.
      const node = render(pyramidOf().rightRefAccessor(() => [0, 1]));
      expect(attrs(node, "rightStack", "y")).toEqual(["0", "12", "0", "12"]);
      expect(attrs(node, "rightStack", "height")).toEqual(["10", "10", "10", "10"]);
      // Bar mid-lines are at y = 5 and y = 17, but the line is drawn at 0 and 12.
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");
    });

    test("the bars jump while the reference line animates", async () => {
      // BUG: bar's transition property is inert (see test/component/bar.test.ts), but the
      // reference line's transition is real. On a state change the outline eases into place
      // over 300ms while the bars underneath it snap immediately, so the line visibly
      // detaches from the bars for the length of the transition. Shared with pyramid.
      let ref = [0, 1];
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("mixed-transitions");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0,0L1,12");

      ref = [2, 3];
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 10 },
          { side: "m", row: 0, series: "a", value: 99 },
        ])
      ).call(component as never);
      // The bar is already at its new width on this tick...
      expect(attrs(node, "rightStack", "width")).toEqual(["99"]);
      // ...while the line still describes the old state.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M0,0L1,12");
    });

    test("attaches a discarded transition to every rect on every render", () => {
      // NOTE: bar defaults `transition` to true and this component neither sets it nor
      // exposes it, so every render creates a d3 transition per rect and then overwrites the
      // geometry on the plain selection immediately - nothing animates, but the transition
      // state is still attached and interrupts any transition already running on those
      // rects. Not configurable from here. Shared with stackedBar.
      expect(stackedPyramid().transition).toBeUndefined();
      const node = render(pyramidOf());
      for (const r of bars(node, "leftStack")) {
        expect(Object.keys(r).some((key) => key.startsWith("__transition"))).toBe(true);
      }
    });

    test("adopts a foreign path that happens to carry the reference line's class", () => {
      // NOTE: the reference join is selectAll(".sszvis-path") with no key function, so a
      // path another component left in the same group is bound as the reference line and
      // repainted rather than left alone. Harmless while each component owns its own
      // selectGroup, which is how every example is written. The same collision is documented
      // on pie and stackedArea, which use the same class.
      const g = group("ref-adopt");
      g.datum(layout()).call(pyramidOf() as never);
      const node = g.node() as SVGGElement;
      const planted = document.createElementNS("http://www.w3.org/2000/svg", "path");
      planted.setAttribute("class", "sszvis-path");
      planted.setAttribute("stroke", "#f00");
      sideGroup(node, "rightReference")?.append(planted);

      g.datum(layout()).call(pyramidOf().rightRefAccessor(() => [0, 1]) as never);
      expect(lines(node, "rightReference")).toEqual([planted]);
      expect(planted.getAttribute("stroke")).toBe("#aaa");
    });

    test("forwards the index to barWidth on the reference line but not on the bars", async () => {
      // NOTE: d3.line calls its x accessor as (d, i, data), so barWidth does receive the
      // index there - the one place in this component where it does. The same accessor
      // therefore behaves differently on the line and on the bars, which drop the index and
      // collapse to 0. Two coordinate systems and now two calling conventions for one prop.
      const node = render(
        pyramidOf()
          .barWidth((v: number, i: number) => v + i)
          .rightRefAccessor(() => [10, 20])
      );
      expect(await lineD(node, "rightReference")).toBe("M10,120L21,240");
      expect(attrs(node, "rightStack", "width")).toEqual(["0", "0", "0", "0"]);
    });

    test("gives the right reference line an empty transform attribute", () => {
      // NOTE: the mirror prop writes `transform=""` rather than omitting the attribute.
      // Harmless, but it means the attribute is always present. Shared with pyramid.
      const node = render(pyramidOf().rightRefAccessor(() => [0, 1]));
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("uses a class for the reference path that no stylesheet defines", () => {
      // NOTE: the path is classed .sszvis-path, which sszvis.css does not style - the
      // appearance comes from the four inlined attributes instead. The class collides with
      // the one pie, stackedArea and stackedAreaMultiples use for their own paths, so a
      // selector written for one of those components also matches a stackedPyramid
      // reference line.
      const node = render(pyramidOf().rightRefAccessor(() => [0, 1]));
      expect(lines(node, "rightReference")[0].getAttribute("class")).toBe("sszvis-path");
    });

    test("puts a negative-width left bar on the wrong side of the spine", () => {
      // NOTE: bar guards NaN but not negative numbers. A negative stacked value inverts the
      // pair, so the width goes negative - which the browser rejects, dropping the segment -
      // and on the left side the double sign flip moves x to the right of the spine.
      // Reaching this needs negative input data, which a population pyramid should not see.
      const node = render(
        pyramidOf(),
        layout([
          { side: "f", row: 0, series: "a", value: -5 },
          { side: "m", row: 0, series: "a", value: 5 },
        ])
      );
      expect(attrs(node, "leftStack", "x")).toEqual(["4.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["-5"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5"]);
    });

    test("matches surviving stacks and bars by index rather than by series", () => {
      // NOTE: neither join uses a key function, so on a re-render the stack groups and the
      // rects inside them are matched positionally. When a series is dropped from anywhere
      // but the end, the groups that remain are re-bound to different series and every bar in
      // them is rewritten. Only the geometry moves, so it is invisible here, but any state
      // held on a stack group - a class, a listener, an in-flight transition - follows the
      // position rather than the series. Shared with stackedBar.
      const component = pyramidOf();
      const g = group("rebind");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      const firstStack = stacks(node, "leftStack")[0];
      g.datum(
        layout([
          { side: "f", row: 0, series: "b", value: 20 },
          { side: "f", row: 1, series: "b", value: 15 },
          { side: "m", row: 0, series: "b", value: 40 },
          { side: "m", row: 1, series: "b", value: 2 },
        ])
      ).call(component as never);
      // The group that used to hold series "a" now holds series "b".
      expect(stacks(node, "leftStack")[0]).toBe(firstStack);
      expect(attrs(node, "leftStack", "width")).toEqual(["20", "15"]);
    });

    test("captures nested stack groups and then crashes on them", () => {
      // BUG: selectAll("[data-sszvis-stack]") is unscoped, so a stack group nested at any
      // depth below a side's group is captured by the join alongside the direct children.
      // The exit selection then removes a legitimate series group, and the reorder that
      // follows has to sort a selection in which one element is an ancestor of another, so
      // it throws a HierarchyRequestError from d3 and aborts the whole render rather than
      // just that side. stackedBar's version of the same unscoped selector only re-binds;
      // this one destroys a group and then crashes, which is why it is a bug here and a
      // note there. A child selector - ":scope > [data-sszvis-stack]" - would make it
      // unreachable. Nothing nests stack groups today, so this needs a caller to have put
      // something of its own inside one.
      // current: HierarchyRequestError from d3's join. expected: only direct children take
      // part in the join.
      const component = pyramidOf();
      const g = group("descendant");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;

      const planted = document.createElementNS("http://www.w3.org/2000/svg", "g");
      planted.setAttribute("data-sszvis-stack", "");
      stacks(node, "leftStack")[0].append(planted);
      expect(stacks(node, "leftStack").length).toBe(3);

      expect(() => g.datum(layout()).call(component as never)).toThrow(DOMException);
    });
  });
});
