import { scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  type StackedPyramidLayout,
  type StackedPyramidSide,
  type StackedPyramidSlice,
  type StackedPyramidSidesData,
  stackedPyramid,
  stackedPyramidData,
  stackedPyramidLayout,
} from "../../src/component/stackedPyramid.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
import "../../src/d3-selectgroup.js";

/** One row of the flat input the layout function expects. */
type Row = { side: string; row: number; series: string; value: number };

/** One side of the pyramid: the series d3.stack produced for it. */
type Side = StackedPyramidSide<Row>;

/** What stackedPyramidLayout returns: the sides in `sides`, with the overall maximum beside them. */
type Layout = StackedPyramidLayout<Row>;

/** What stackedPyramidData returns: the sides array, with the overall maximum assigned onto it. */
type SidesData = StackedPyramidSidesData<Row>;

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

  const layoutOf = (data: Row[] = rows): Layout =>
    stackedPyramidLayout(sideAcc, rowAcc, seriesAcc, valueAcc)(data);

  /** The array-returning form, i.e. what existing charts bind straight to the chart layer. */
  const sidesDataOf = (data: Row[] = rows): SidesData =>
    stackedPyramidData(sideAcc, rowAcc, seriesAcc, valueAcc)(data);

  /** The sides of the layout, i.e. the array the component is handed. */
  const layout = (data: Row[] = rows): Side[] => layoutOf(data).sides;

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
      .leftAccessor((d: Side[]) => d[0])
      .rightAccessor((d: Side[]) => d[1]);

  const sideGroup = (node: Element, key: string) =>
    node.querySelector(`[data-d3-selectgroup="${key}"]`) as SVGGElement | null;
  const stacks = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("[data-sszvis-stack]") ?? []),
  ];
  /** Only the stack groups the component owns, i.e. the direct children of a side's group. */
  const ownStacks = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll(":scope > [data-sszvis-stack]") ?? []),
  ];
  /** Only the rects bar owns, matched on the component-owned class it joins on. */
  const bars = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("rect.sszvis-bar-rect") ?? []),
  ];
  const attrs = (node: Element, key: string, attr: string) =>
    bars(node, key).map((b) => b.getAttribute(attr));
  const anchors = (node: Element, key: string) =>
    [...(sideGroup(node, key)?.querySelectorAll("[data-tooltip-anchor]") ?? [])].map((a) =>
      a.getAttribute("transform"),
    );
  const lines = (node: Element, key: string) => [
    ...(sideGroup(node, key)?.querySelectorAll("path.sszvis-path") ?? []),
  ];
  /** Two reference points, one per row of the fixture above. */
  const refPoints = [
    { row: 0, value: 0 },
    { row: 1, value: 1 },
  ];

  /** The reference line's `d` is applied through a transition, so it lands a frame later. */
  const lineD = (node: Element, key: string) =>
    vi.waitFor(() => {
      const d = lines(node, key)[0]?.getAttribute("d");
      expect(d).not.toBeNull();
      return d;
    });

  describe("layout/component contract", () => {
    // This is the guard whose absence let a broken shape ship: an earlier pass had
    // stackedPyramidData return { sides, maxValue }, which every chart that binds the return
    // value straight to the layer indexes into as if it were the sides array. d3's data join
    // over a non-iterable yields an empty selection, so those charts rendered nothing - four
    // shipped pyramids, and the unit tests stayed green because they all reshaped the layout
    // first. Bind exactly what the charts bind and assert marks come out.
    test("should render bars when the whole stackedPyramidData return value is bound to the layer", () => {
      const node = render(pyramidOf(), sidesDataOf());
      expect(bars(node, "leftStack").length).toBe(4);
      expect(bars(node, "rightStack").length).toBe(4);
    });

    test("should give the same answer as a fresh generator when one generator is reused across datasets", () => {
      // stackedPyramidData builds its layout generator once and closes over it, so the
      // accessors are bound a single time rather than per call. Nothing mutable may be
      // captured with them: applying the same generator to two datasets has to give the same
      // answer as two fresh generators would.
      const generate = stackedPyramidData(sideAcc, rowAcc, seriesAcc, valueAcc);
      const other: Row[] = [
        { side: "f", row: 0, series: "a", value: 3 },
        { side: "m", row: 0, series: "a", value: 4 },
      ];
      const first = generate(rows);
      const second = generate(other);
      const third = generate(rows);

      expect(first.maxValue).toBe(70);
      expect(second.maxValue).toBe(4);
      expect(third.maxValue).toBe(70);
      expect(second.length).toBe(2);
      expect(third.map((side) => side.length)).toEqual(first.map((side) => side.length));
    });

    test("should report the same maxValue whichever of the two layout forms is used", () => {
      expect(sidesDataOf().maxValue).toBe(layoutOf().maxValue);
    });
  });

  describe("stackedPyramidData", () => {
    test("should return one entry per side when the data covers two sides", () => {
      const sides = layout();
      expect(sides.length).toBe(2);
      expect(sides[0][0][0].side).toBe("f");
      expect(sides[1][0][0].side).toBe("m");
    });

    test("should stack each side independently when both sides carry the same series keys", () => {
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

    test("should report the highest stacked total as maxValue when the two sides stack to different totals", () => {
      expect(layoutOf().maxValue).toBe(70);
    });

    test("should return the sides array with maxValue assigned when stackedPyramidData is called", () => {
      // The array-returning form is what the shipped charts bind straight to the chart layer,
      // so it stays an ordinary array that the side accessors can index into positionally.
      const sides = sidesDataOf();
      expect(Array.isArray(sides)).toBe(true);
      expect(sides.length).toBe(2);
      expect(sides.maxValue).toBe(70);
    });

    test("should lose the assigned maxValue when the array form is copied", () => {
      // maxValue is a property on the returned array rather than a field of a wrapper object,
      // so a spread or a trip through JSON loses it. That is the whole reason for
      // stackedPyramidLayout; the property is kept, and deprecated, so that the charts binding
      // the array keep working.
      const sides = sidesDataOf();
      expect(sides.maxValue).toBe(70);
      expect(([...sides] as SidesData).maxValue).toBeUndefined();
      expect((JSON.parse(JSON.stringify(sides)) as SidesData).maxValue).toBeUndefined();
    });

    test("should keep maxValue when the layout is copied", () => {
      // maxValue sits beside the sides rather than assigned onto them, so a spread, a map, a
      // filter or a trip through JSON carries it along instead of dropping it.
      const result = layoutOf();
      const copy: Layout = { ...result, sides: result.sides.filter(() => true) };
      expect(copy.maxValue).toBe(70);
      expect(copy.sides.length).toBe(result.sides.length);
      expect(JSON.parse(JSON.stringify(result)).maxValue).toBe(70);
    });

    test("should return no sides and a maxValue of 0 when the data is empty", () => {
      // d3.max over an empty array is undefined, which the fold coerces to 0: the examples
      // feed maxValue straight into a scale domain - `domain([0, state.maxStackedValue])` -
      // where undefined would become NaN and the axis would lose its ticks. An empty data
      // state is ordinary, not an edge case: any filter that can match nothing reaches it.
      expect(layout([]).length).toBe(0);
      expect(layoutOf([]).maxValue).toBe(0);
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
      const { sides, maxValue } = layoutOf([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "m", row: 0, series: "a", value: 2 },
        { side: "m", row: 0, series: "b", value: 3 },
        { side: "m", row: 1, series: "a", value: 4 },
        { side: "m", row: 1, series: "b", value: 5 },
      ]);
      expect(sides[0].length).toBe(1);
      expect(sides[1].length).toBe(2);
      expect(maxValue).toBe(9);
    });

    test("should take a side's series keys from the union across all of its rows", () => {
      // A series that appears in only some of a side's rows still gets its own layer, and
      // its values reach both the chart and maxValue.
      const { sides, maxValue } = layoutOf([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "f", row: 1, series: "a", value: 2 },
        { side: "f", row: 1, series: "b", value: 3 },
      ]);
      expect(sides[0].length).toBe(2);
      expect(sides[0].map((series) => series.key)).toEqual(["a", "b"]);
      expect(maxValue).toBe(5);
    });

    test("should pad with a zero-width slice when a row carries no value for a series", () => {
      const sides = layout([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "f", row: 0, series: "b", value: 2 },
        { side: "f", row: 1, series: "a", value: 3 },
      ]);
      expect(pairs(sides[0])).toEqual([
        [
          [0, 1],
          [0, 3],
        ],
        [
          [1, 3],
          // Row 1 has no "b", so its slice is an empty pad on top of the "a" value.
          [3, 3],
        ],
      ]);
      // A padding slice has no source row to point at, and its own value is 0.
      expect(sides[0][1][1].data).toBeUndefined();
      expect(sides[0][1][1].value).toBe(0);
      expect(sides[0][1][1].series).toBe("b");
      expect(sides[0][1][1].side).toBe("f");
    });

    test("should stack a side's series in the order its rows first mention them", () => {
      // The key order is the stacking order, and the union preserves the order of first
      // mention rather than the order of any single row.
      const sides = layout([
        { side: "f", row: 0, series: "b", value: 1 },
        { side: "f", row: 1, series: "c", value: 2 },
        { side: "f", row: 1, series: "b", value: 3 },
        { side: "f", row: 2, series: "a", value: 4 },
      ]);
      expect(sides[0].map((series) => series.key)).toEqual(["b", "c", "a"]);
    });

    test("should tag every slice with the value the row accessor returned", () => {
      // The row is the accessor's own value, not the slice's position within the side, so a
      // position scale can be built over the row domain.
      const sides = layout([
        { side: "f", row: 40, series: "a", value: 1 },
        { side: "f", row: 80, series: "a", value: 2 },
      ]);
      expect(sides[0][0].map((d) => d.row)).toEqual([40, 80]);
      expect(sides[0][0].map((d) => d.data?.row)).toEqual([40, 80]);
    });

    test("should tag a row whose value is not an array-index key with that value", () => {
      // Rows that are not array-index keys - negatives, floats, plain strings - enumerate in
      // insertion order rather than sorting themselves, so they are laid out in the order the
      // input happened to be in. Their `row` is still the accessor's own value, and a string
      // row comes back as a string rather than as the cascade's stringified key.
      const negatives = layout([
        { side: "f", row: 5, series: "a", value: 1 },
        { side: "f", row: -3, series: "a", value: 2 },
      ]);
      expect(negatives[0][0].map((d) => d.row)).toEqual([5, -3]);

      const strings = layout([
        { side: "f", row: "60+" as unknown as number, series: "a", value: 1 },
        { side: "f", row: "0-59" as unknown as number, series: "a", value: 2 },
      ]);
      expect(strings[0][0].map((d) => d.row)).toEqual(["60+", "0-59"]);
    });

    test("stacks the series in the order the accessor first returns them", () => {
      // SAFETY: the key order is the stacking order, so which series sits on the baseline -
      // and with it the whole reading of the chart - has to follow the accessor rather than
      // the data's key shape. A plain object enumerates integer-like keys numerically, which
      // is what used to reorder years and numeric codes.
      const sides = layout([
        { side: "f", row: 0, series: 2010 as unknown as string, value: 1 },
        { side: "f", row: 0, series: 2000 as unknown as string, value: 2 },
      ]);
      expect(sides[0].map((series) => series.key)).toEqual(["2010", "2000"]);
    });

    test("keeps each side's stacking order independent of the other's", () => {
      // The keys are taken per side, so a series one side never carries does not become a
      // layer there, and the sides do not have to agree on an order.
      const sides = layout([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "m", row: 0, series: "b", value: 2 },
        { side: "m", row: 0, series: "a", value: 3 },
      ]);
      expect(sides[0].map((series) => series.key)).toEqual(["a"]);
      expect(sides[1].map((series) => series.key)).toEqual(["b", "a"]);
    });

    test("sums every row the accessors place in one cell", () => {
      // SAFETY: unaggregated data used to be understated with no warning and no error, just
      // a shorter bar - the second row of the cell was simply dropped.
      const sides = layout([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "f", row: 0, series: "a", value: 100 },
      ]);
      const slice = sides[0][0][0];
      expect(slice[1]).toBe(101);
      // The slice's own value has to agree with the extent it is drawn at, or a consumer
      // reading it - a tooltip, or a reference line built from the layout's own slices -
      // reports a different number from the bar beside it.
      expect(slice.value).toBe(101);
    });

    test("still stacks a cell the row carries no datum for as zero", () => {
      // A series one row has no observation for contributes a zero-width padding slice
      // rather than throwing, which the summing must not change.
      const sides = layout([
        { side: "f", row: 0, series: "a", value: 1 },
        { side: "f", row: 1, series: "b", value: 2 },
      ]);
      const [, seriesB] = sides[0];
      expect(seriesB.key).toBe("b");
      // Row 0 carries no "b", so its slice is the zero-width pad.
      expect(seriesB[0][1] - seriesB[0][0]).toBe(0);
    });

    describe("known quirks", () => {
      test("orders the rows by their stringified keys, not by the order they arrive in", () => {
        // NOTE: the cascade groups the rows into a plain object keyed by String(row), and
        // JavaScript iterates array-index keys in ascending numeric order regardless of
        // insertion order, so dense non-negative integer rows sort themselves. Row values
        // that are not array-index keys - negatives, floats, plain strings - fall back to
        // insertion order and are laid out in whatever order the input happened to be in.
        const sorted = layout([
          { side: "f", row: 2, series: "a", value: 1 },
          { side: "f", row: 0, series: "a", value: 2 },
          { side: "f", row: 1, series: "a", value: 3 },
        ]);
        expect(sorted[0][0].map((d) => d.data?.row)).toEqual([0, 1, 2]);
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
          ]).length,
        ).toBe(3);
      });

      test("computes maxValue from the upper bounds only", () => {
        // NOTE: max over row[1], so only the upper bounds enter. Here the lower bound of
        // -50 is invisible and maxValue is -40, which is not the extent of the data. Neither
        // side of the pyramid supports values below the baseline anyway - see the
        // negative-value quirk below.
        expect(
          layoutOf([
            { side: "f", row: 0, series: "a", value: -50 },
            { side: "f", row: 0, series: "b", value: 10 },
          ]).maxValue,
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
        // below become one cell; both are now stacked, so the merge costs a slice rather
        // than a value. Shared with stackedBarData.
        const sides = layout([
          { side: 1 as unknown as string, row: 0, series: "a", value: 1 },
          { side: "1", row: 0, series: "a", value: 2 },
        ]);
        expect(sides.length).toBe(1);
        expect(sides[0][0].length).toBe(1);
        expect(sides[0][0][0][1]).toBe(3);
        // The side tag comes from the first row of the merged group, so it keeps its type.
        expect(sides[0][0][0].side).toBe(1);
      });
    });
  });

  describe("props", () => {
    test("should default barFill to black when it is left unset", () => {
      // The datum is required now that barFill is only called for a slice that has one; a
      // constant default ignores it.
      expect(stackedPyramid().barFill()({})).toBe("#000");
    });

    test("should default tooltipAnchor to the centre of a bar when it is left unset", () => {
      expect(stackedPyramid().tooltipAnchor()).toEqual([0.5, 0.5]);
    });
  });

  // Both sides are fed the same side, because binding an empty sides array is not an option:
  // a side accessor that finds nothing throws from d3's join, which is pinned under "required
  // props" below. The empty case therefore binds two empty sides rather than no sides.
  describesTheMarkJoin<Side[number]>(() => ({
    make: pyramidOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum([data, data])
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({
      leftStacks: ownStacks(node, "leftStack").length,
      rightStacks: ownStacks(node, "rightStack").length,
      leftBars: bars(node, "leftStack").length,
      rightBars: bars(node, "rightStack").length,
    }),
    full: {
      data: layout()[0],
      marks: { leftStacks: 2, rightStacks: 2, leftBars: 4, rightBars: 4 },
    },
    // No shrink case: losing a series and losing a row empty different halves of this nested
    // join, and both keep tests of their own under "bars" below.
  }));

  describe("groups", () => {
    test("should create all four groups, references last, even when no reference data is configured", () => {
      const node = render(pyramidOf());
      // The order is load-bearing: the reference lines have to paint over the bars. The
      // groups themselves are unconditional; only the paths inside them are conditional.
      expect(
        [...node.querySelectorAll("[data-d3-selectgroup]")].map((g) =>
          g.getAttribute("data-d3-selectgroup"),
        ),
      ).toEqual(["leftStack", "rightStack", "leftReference", "rightReference"]);
      expect(sideGroup(node, "leftReference")?.childElementCount).toBe(0);
      expect(sideGroup(node, "rightReference")?.childElementCount).toBe(0);
    });

    test("should render one stack group per series on each side when both sides have data", () => {
      const node = render(pyramidOf());
      expect(stacks(node, "leftStack").length).toBe(2);
      expect(stacks(node, "rightStack").length).toBe(2);
      expect(stacks(node, "leftStack")[0].tagName).toBe("g");
    });

    test("should still render a stack group when only some of a side's rows carry that series", () => {
      const node = render(
        pyramidOf(),
        layout([
          { side: "f", row: 0, series: "a", value: 1 },
          { side: "f", row: 1, series: "a", value: 2 },
          { side: "f", row: 1, series: "b", value: 3 },
          { side: "m", row: 0, series: "a", value: 4 },
        ]),
      );
      expect(stacks(node, "leftStack").length).toBe(2);
      // The recovered series is drawn: its row-1 slice runs from 2 to 5, its row-0 pad is
      // empty.
      expect(attrs(node, "leftStack", "width")).toEqual(["1", "2", "0", "3"]);
    });

    test("should mark a stack group with a data attribute rather than a class when it creates one", () => {
      // stackedBar uses a .sszvis-stack class for the same job; this component uses
      // [data-sszvis-stack] and sets no class at all.
      const node = render(pyramidOf());
      expect(stacks(node, "leftStack")[0].getAttribute("data-sszvis-stack")).toBe("");
      expect(stacks(node, "leftStack")[0].getAttribute("class")).toBeNull();
    });
  });

  describe("bars", () => {
    test("should mirror the two sides around a one-pixel spine when it renders", () => {
      const node = render(pyramidOf());
      // On the left x = -SPINE_PADDING - barWidth(d[1]), the bar's outer edge, since it
      // grows leftwards; on the right x = SPINE_PADDING + barWidth(d[0]), its inner edge.
      expect(attrs(node, "leftStack", "x")).toEqual(["-10.5", "-5.5", "-30.5", "-20.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["10", "5", "20", "15"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5", "0.5", "30.5", "1.5"]);
      expect(attrs(node, "rightStack", "width")).toEqual(["30", "1", "40", "2"]);
      // 2 * SPINE_PADDING between the sides: the innermost left bar ends at -0.5 and the
      // innermost right bar starts at 0.5.
      expect(
        Number(attrs(node, "leftStack", "x")[0]) + Number(attrs(node, "leftStack", "width")[0]),
      ).toBe(-0.5);
    });

    test("should abut the segments of a row when they are stacked", () => {
      const node = render(pyramidOf());
      // Series "a" of row 0 on the right runs 0.5...30.5, series "b" starts exactly there.
      const firstEnd =
        Number(attrs(node, "rightStack", "x")[0]) + Number(attrs(node, "rightStack", "width")[0]);
      expect(firstEnd).toBe(30.5);
      expect(Number(attrs(node, "rightStack", "x")[2])).toBe(30.5);
    });

    test("should place a row by the value barPosition reads off it, not by its order", () => {
      const dense = render(pyramidOf());
      expect(attrs(dense, "leftStack", "y")).toEqual(["0", "12", "0", "12"]);
      expect(attrs(dense, "rightStack", "y")).toEqual(["0", "12", "0", "12"]);

      // barPosition is a scale over the row domain, so rows valued 40 and 80 land 40 and 80
      // rows down rather than at the top of the chart.
      const node = render(
        pyramidOf(),
        layout([
          { side: "f", row: 40, series: "a", value: 1 },
          { side: "f", row: 80, series: "a", value: 2 },
          { side: "m", row: 40, series: "a", value: 3 },
        ]),
      );
      expect(attrs(node, "leftStack", "y")).toEqual(["480", "960"]);
      expect(attrs(node, "rightStack", "y")).toEqual(["480"]);
    });

    test("should take a bar's height from barHeight when it renders", () => {
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "height")).toEqual(["10", "10", "10", "10"]);
    });

    test("should hand barFill the slice's source row when it paints a bar", () => {
      const node = render(
        pyramidOf().barFill((d: Row) => (d.series === "a" ? "#f00" : "#00f")),
        layout(),
      );
      expect(attrs(node, "leftStack", "fill")).toEqual(["#f00", "#f00", "#00f", "#00f"]);
      expect(attrs(node, "rightStack", "fill")).toEqual(["#f00", "#f00", "#00f", "#00f"]);
    });

    test("should not set a stroke on the bars", () => {
      // Unlike stackedBar, which paints a 1px white separator between segments, this
      // component leaves bar's stroke unset, so the segments touch without a seam.
      const node = render(pyramidOf());
      expect(attrs(node, "leftStack", "stroke")).toEqual([null, null, null, null]);
    });

    test("should reuse a side's group and its anchors rather than add a second set when it renders twice", () => {
      // The stacks and the bars themselves are covered by the shared join contract above;
      // what is left here is the layer they live in and the anchors, which it does not count.
      const component = pyramidOf();
      const g = group("rerender");
      g.datum(layout()).call(component as never);
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="leftStack"]').length).toBe(1);
      expect(anchors(node, "leftStack").length).toBe(4);
    });

    test("should remove the stack group when a side loses a series", () => {
      const component = pyramidOf();
      const g = group("shrink-series");
      g.datum(layout()).call(component as never);
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 10 },
          { side: "f", row: 1, series: "a", value: 5 },
          { side: "m", row: 0, series: "a", value: 30 },
          { side: "m", row: 1, series: "a", value: 1 },
        ]),
      ).call(component as never);
      const node = g.node() as SVGGElement;
      expect(stacks(node, "leftStack").length).toBe(1);
      expect(bars(node, "leftStack").length).toBe(2);
    });

    test("should remove the bars when a side loses a row", () => {
      const component = pyramidOf();
      const g = group("shrink-rows");
      g.datum(layout()).call(component as never);
      g.datum(layout(rows.filter((d) => d.row === 0))).call(component as never);
      const node = g.node() as SVGGElement;
      expect(bars(node, "leftStack").length).toBe(2);
      expect(attrs(node, "leftStack", "y")).toEqual(["0", "0"]);
    });

    test("should move the bars to the new geometry when the data changes", async () => {
      // bar animates the update, so the destination geometry lands with the transition.
      const component = pyramidOf();
      const g = group("update");
      g.datum(layout()).call(component as never);
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 99 },
          { side: "m", row: 0, series: "a", value: 7 },
        ]),
      ).call(component as never);
      const node = g.node() as SVGGElement;
      await vi.waitFor(() => {
        expect(attrs(node, "leftStack", "x")).toEqual(["-99.5"]);
        expect(attrs(node, "leftStack", "width")).toEqual(["99"]);
        expect(attrs(node, "rightStack", "width")).toEqual(["7"]);
      });
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per bar inside that bar's own stack group when both sides have data", () => {
      const node = render(pyramidOf());
      expect(anchors(node, "leftStack").length).toBe(4);
      expect(
        [...stacks(node, "leftStack")[0].querySelectorAll("[data-tooltip-anchor]")].length,
      ).toBe(2);
    });

    test("should centre an anchor on its bar when tooltipAnchor is left unset", () => {
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

    test("should hand both sides the same anchor when a custom tooltipAnchor is set", () => {
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
     * A reference series is an array of {row, value} points: barWidth maps the value to x and
     * barPosition the row to y, the same way round as in the bars, so one series can be
     * correct in both directions. With the identity barWidth and the 12px-per-row
     * barPosition used here, {row: 1, value: 1} lands at (1, 12).
     */
    const refs = (...rows: number[]) => rows.map((row) => ({ row, value: row }));

    const withRefs = () =>
      pyramidOf()
        .leftRefAccessor(() => refs(0, 1))
        .rightRefAccessor(() => refs(0, 1));

    test("should draw one path per side that has a reference accessor, and none for a side without one", () => {
      const none = render(pyramidOf());
      expect([lines(none, "leftReference").length, lines(none, "rightReference").length]).toEqual([
        0, 0,
      ]);

      const both = render(withRefs());
      expect([lines(both, "leftReference").length, lines(both, "rightReference").length]).toEqual([
        1, 1,
      ]);
      expect(lines(both, "leftReference")[0].tagName).toBe("path");

      const rightOnly = render(pyramidOf().rightRefAccessor(() => refs(0, 1)));
      expect([
        lines(rightOnly, "leftReference").length,
        lines(rightOnly, "rightReference").length,
      ]).toEqual([0, 1]);
    });

    test("should mirror only the left reference line when both sides are configured", () => {
      const node = render(withRefs());
      expect(lines(node, "leftReference")[0].getAttribute("transform")).toBe("scale(-1, 1)");
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("should read a reference point's x from its value and its y from its row when a reference series is set", async () => {
      const node = render(withRefs());
      // x = barWidth(d.value), y = barPosition(d.row) + half a bar height
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");
    });

    test("should follow the bars' outer edges when the reference series describes them", async () => {
      // The outline of the right side's own outer edges: the stacked totals are 70 on row 0
      // and 3 on row 1, at y = 0 and y = 12. The remaining half-pixel is the spine padding
      // (see the note below) and the half-bar-height offset is filed separately.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: 0, value: 70 },
          { row: 1, value: 3 },
        ]),
      );
      expect(await lineD(node, "rightReference")).toBe("M70.5,5L3.5,17");
      const outerEdges = bars(node, "rightStack")
        .slice(2)
        .map((b) => Number(b.getAttribute("x")) + Number(b.getAttribute("width")));
      expect(outerEdges).toEqual([70.5, 3.5]);
    });

    test("should draw a reference line when one of the layout's own series is used as the series", async () => {
      // A slice already carries a `row` and a `value`, so a series needs no mapping.
      const node = render(pyramidOf().rightRefAccessor((d: Side[]) => d[1][1]));
      // Series "b" of the right side: values 40 on row 0 and 2 on row 1.
      expect(await lineD(node, "rightReference")).toBe("M40.5,5L2.5,17");
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

    test("should keep the generic class on the path when it writes the class attribute", () => {
      // The join is scoped to the component's own class, but sszvis-path stays on the
      // element so that no selector written against the generic class changes meaning.
      const node = render(withRefs());
      expect(lines(node, "rightReference")[0].getAttribute("class")).toBe(
        "sszvis-path sszvis-stacked-pyramid__referenceline",
      );
    });

    test("should leave a foreign generic path alone when one shares the reference group", () => {
      // The join matches only the paths this component drew, so another component's path
      // parked in the same group is neither adopted nor repainted.
      const g = group("ref-foreign");
      g.datum(layout()).call(pyramidOf() as never);
      const node = g.node() as SVGGElement;
      const planted = document.createElementNS("http://www.w3.org/2000/svg", "path");
      planted.setAttribute("class", "sszvis-path");
      planted.setAttribute("stroke", "#f00");
      sideGroup(node, "rightReference")?.append(planted);

      g.datum(layout()).call(pyramidOf().rightRefAccessor(() => refs(0, 1)) as never);

      expect(planted.getAttribute("stroke")).toBe("#f00");
      expect(planted.getAttribute("class")).toBe("sszvis-path");
      expect(planted.getAttribute("d")).toBeNull();
      const own = lines(node, "rightReference").filter((p) => p !== planted);
      expect(own.length).toBe(1);
      expect(own[0].getAttribute("stroke")).toBe("#aaa");
    });

    test("should ease the reference line to its new shape when the data changes", async () => {
      let ref = refs(0, 1);
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("ref-animate");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");

      // Re-rendering the same data updates the one path in place rather than appending a
      // second one.
      g.datum(layout()).call(component as never);
      expect(lines(node, "rightReference").length).toBe(1);

      ref = refs(2, 3);
      g.datum(layout()).call(component as never);
      // Unlike the bars, the line really does transition: the old path is still in place on
      // the tick the re-render happens.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M0.5,5L1.5,17");
      await vi.waitFor(() =>
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M2.5,29L3.5,41"),
      );
    });

    test("gives each row the height of its own bars when barHeight varies by row", async () => {
      // SAFETY: sampling one slice for the whole chart would offset every reference point by
      // the first row's half-height, so a taller row's outline would not sit on its mid-line.
      const node = render(
        pyramidOf()
          .barHeight((slice: StackedPyramidSlice<Row, string>) => (slice.row === 0 ? 10 : 20))
          .rightRefAccessor(() => [
            { row: 0, value: 0 },
            { row: 1, value: 1 },
          ]),
      );
      // Row 0's bars are 10 tall from y=0, row 1's are 20 tall from y=12.
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,22");
    });

    test("measures the bar height from a slice when barHeight is a per-slice accessor", async () => {
      // SAFETY: a reference point is {row, value}, not a slice, so the height has to be
      // measured off a real slice of the chart. Calling the accessor with no argument instead
      // hands it undefined, which is a TypeError for any accessor that reads its datum - a
      // crash reachable from a supported configuration.
      const node = render(
        pyramidOf()
          .barHeight((slice: StackedPyramidSlice<Row, string>) => (slice.data ? 10 : 10))
          .rightRefAccessor(() => [
            { row: 0, value: 0 },
            { row: 1, value: 1 },
          ]),
      );
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");
    });

    test("draws the outline on the bars' top edges when barHeight was never set", async () => {
      // A chart with no barHeight draws no bars at all and the component tolerates that
      // silently, so the reference line must not turn it into a crash. With nothing to
      // measure the outline falls back to where it sat before it was centred.
      const g = group("ref-no-bar-height");
      expect(() =>
        g.datum(layout()).call(
          stackedPyramid()
            .barWidth((v: number) => v)
            .barPosition((row: number) => row * 12)
            .leftAccessor((d: Side[]) => d[0])
            .rightAccessor((d: Side[]) => d[1])
            .rightRefAccessor(() => [
              { row: 0, value: 0 },
              { row: 1, value: 1 },
            ]) as never,
        ),
      ).not.toThrow();
      expect(await lineD(g.node() as SVGGElement, "rightReference")).toBe("M0.5,0L1.5,12");
    });

    test("traces the mid-lines of the bars it describes", async () => {
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: 0, value: 0 },
          { row: 1, value: 1 },
        ]),
      );
      // SAFETY: the bars span y 0-10 and 12-22, so the outline has to run at 5 and 17 - the
      // rows' mid-lines - not at their top edges. The error scales with barHeight, so a
      // chart binned into age groups rather than single years shows it plainly.
      expect(attrs(node, "rightStack", "y")).toEqual(["0", "12", "0", "12"]);
      expect(attrs(node, "rightStack", "height")).toEqual(["10", "10", "10", "10"]);
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");
    });

    test("keeps a missing value out of the reference line's path", async () => {
      // A gap anywhere used to truncate the outline from that point on, because d3 writes
      // NaN into d verbatim and the browser drops the rest of the path.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: Number.NaN, value: Number.NaN },
          { row: 1, value: 1 },
        ]),
      );
      expect(await lineD(node, "rightReference")).not.toContain("NaN");
    });

    test("breaks the outline at a gap rather than ending it", async () => {
      // A gap in the middle is the case that shows the difference: everything after it used
      // to be dropped. d3.line starts a fresh subpath after an undefined point, so the two
      // drawable runs both survive.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: 0, value: 0 },
          { row: 1, value: Number.NaN },
          { row: 2, value: 2 },
          { row: 3, value: 3 },
        ]),
      );
      // A one-point run is closed with Z, so the two runs read as M0,0Z then M2,24L3,36.
      expect(await lineD(node, "rightReference")).toBe("M0.5,5ZM2.5,29L3.5,41");
    });

    test("skips a missing value in the first and last positions", async () => {
      // The ends behave differently from the middle: a leading gap has no subpath to break
      // and a trailing one nothing to resume, so each simply drops its own point.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: 0, value: Number.NaN },
          { row: 1, value: 1 },
          { row: 2, value: 2 },
          { row: 3, value: Number.NaN },
        ]),
      );
      expect(await lineD(node, "rightReference")).toBe("M1.5,17L2.5,29");
    });

    test("draws no reference line for an empty reference series, and does not warn", () => {
      // Distinct from an accessor that returns no data at all: an empty array is a
      // legitimately empty series, so it is hidden silently.
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const node = render(pyramidOf().rightRefAccessor(() => []));
      expect(lines(node, "rightReference").length).toBe(0);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test("removes the reference path when the reference series goes away", async () => {
      let ref = [
        { row: 0, value: 0 },
        { row: 1, value: 1 },
      ];
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("ref-removal");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");

      ref = [];
      g.datum(layout()).call(component as never);
      // SAFETY: the element itself has to go, not just its d - CSS rules, hit tests and
      // snapshots can all still find a path that outlives the data that produced it.
      expect(lines(node, "rightReference").length).toBe(0);

      // The fix must not over-correct into never rendering: a later non-empty series brings
      // the path back.
      ref = [
        { row: 0, value: 2 },
        { row: 1, value: 3 },
      ];
      g.datum(layout()).call(component as never);
      expect(lines(node, "rightReference").length).toBe(1);
      expect(await lineD(node, "rightReference")).toBe("M2.5,5L3.5,17");
    });

    test("warns and draws no reference line when the accessor returns something that is not a series", () => {
      // An accessor that indexes into a cascaded object returns undefined as soon as one
      // series is missing from one state, so this is reached by data rather than by code and
      // must not take the chart down. The guard tests Array.isArray rather than null-ness, so
      // an array-like passes as no series too; undefined and null used to throw differently,
      // as "not iterable" and through the `in` operator. Matches pyramid's own coverage.
      for (const value of [undefined, null, { length: 0 }, { a: 1 }, "abc"]) {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const node = render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().rightRefAccessor(() => value),
        );
        expect(lines(node, "rightReference").length).toBe(0);
        // SAFETY: without this, removing the logger.warn call would leave the suite green.
        expect(spy).toHaveBeenCalledOnce();
        spy.mockRestore();
      }
    });
  });

  describe("required props", () => {
    /** Both side accessors wired up, but no bar dimensions set. */
    const bare = () =>
      stackedPyramid()
        .leftAccessor((d: Side[]) => d[0])
        .rightAccessor((d: Side[]) => d[1]);

    test("should throw when leftAccessor is missing", () => {
      expect(() =>
        render(
          stackedPyramid()
            .barHeight(10)
            .barWidth((v: number) => v)
            .barPosition(0),
        ),
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
            .barWidth((v: number) => v),
        ),
      ).toThrow(TypeError);
    });

    describe("known quirks", () => {
      // BUG(#78): barHeight is the one dimension passed straight through to bar, which runs
      // it through its NaN guard, so an unset prop becomes 0 instead of an error. The chart
      // renders as an empty axis frame with no visible bars and no warning. Of the three
      // required dimensions only this one fails silently; the other two throw, with two
      // different messages. Shared with pyramid, where the named-error guard has landed.
      // current: height="0". expected: an error naming the missing prop.
      // Skipped, not deleted: it fails with "expected [Function] to throw an error".
      test.skip("reports the missing prop when barHeight is unset", () => {
        expect(() =>
          render(
            bare()
              .barWidth((v: number) => v)
              .barPosition(0),
          ),
        ).toThrow(/barHeight/);
      });

      test("throws when a side accessor returns undefined", () => {
        // NOTE: the error comes from d3's data join, so the message names neither the prop
        // nor the component: "undefined is not iterable".
        expect(() =>
          render(
            // @ts-expect-error - deliberately violating the accessor's return contract
            pyramidOf().leftAccessor(() => undefined),
          ),
        ).toThrow(TypeError);
      });
    });
  });

  describe("a constant barWidth", () => {
    const constantOf = () =>
      stackedPyramid()
        .barHeight(10)
        .barWidth(20)
        .barPosition(0)
        .leftAccessor((d: Side[]) => d[0])
        .rightAccessor((d: Side[]) => d[1]);

    test("should draw every segment of both sides at that width when barWidth is a constant", () => {
      // A constant is a segment width rather than a scale over stacked values, so it is used
      // directly instead of being subtracted from itself - mirrored on the left as usual.
      const node = render(constantOf());
      expect(attrs(node, "rightStack", "width")).toEqual(["20", "20", "20", "20"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5", "0.5", "0.5", "0.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["20", "20", "20", "20"]);
      expect(attrs(node, "leftStack", "x")).toEqual(["-20.5", "-20.5", "-20.5", "-20.5"]);
    });

    test("should not call barFill at all when a slice is only padding", () => {
      // The slice is zero-width, so its fill is never painted - and an accessor written over
      // the source row would be handed an undefined datum and throw, which is exactly what a
      // sparse layout used to do through the docs examples' `colorScale(cAcc(d.data))`.
      const seen: unknown[] = [];
      const node = render(
        constantOf().barFill((d: Row) => {
          seen.push(d);
          return d.series === "a" ? "#f00" : "#00f";
        }),
        layout([
          { side: "f", row: 0, series: "a", value: 1 },
          { side: "f", row: 0, series: "b", value: 2 },
          { side: "f", row: 1, series: "a", value: 3 },
          { side: "m", row: 0, series: "a", value: 4 },
          { side: "m", row: 0, series: "b", value: 5 },
          { side: "m", row: 1, series: "a", value: 6 },
          { side: "m", row: 1, series: "b", value: 7 },
        ]),
      );
      expect(seen).not.toContain(undefined);
      // the padding slice is left with no fill attribute rather than a colour
      expect(attrs(node, "leftStack", "fill")).toEqual(["#f00", "#f00", "#00f", null]);
    });

    test("should keep a padding slice at zero width when barWidth is a constant", () => {
      // A row with no observation for a series is padded with a synthetic slice whose two
      // bounds are equal. The scale branch draws that as nothing for free; a constant width
      // has to be told, or the missing series renders as a full-width bar.
      const node = render(
        constantOf(),
        layout([
          { side: "f", row: 0, series: "a", value: 1 },
          { side: "f", row: 0, series: "b", value: 2 },
          { side: "f", row: 1, series: "a", value: 3 },
          { side: "m", row: 0, series: "a", value: 4 },
          { side: "m", row: 0, series: "b", value: 5 },
          { side: "m", row: 1, series: "a", value: 6 },
          { side: "m", row: 1, series: "b", value: 7 },
        ]),
      );
      // Row 1 of the left side has no "b", so its second slice is padding.
      expect(attrs(node, "leftStack", "width")).toEqual(["20", "20", "20", "0"]);
      expect(attrs(node, "rightStack", "width")).toEqual(["20", "20", "20", "20"]);
    });

    test("should read barWidth as a scale over the stacked values when it is a d3 scale", () => {
      // The supported shape, pinned next to the constant: the segment runs between the two
      // numbers of the slice's pair, so a bar's width is the scaled length of its own value.
      const node = render(constantOf().barWidth(scaleLinear().domain([0, 70]).range([0, 140])));
      expect(attrs(node, "rightStack", "width")).toEqual(["60", "2", "80", "4"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5", "0.5", "60.5", "2.5"]);
    });
  });

  describe("known quirks", () => {
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
        }),
      );
      expect(seen.every((v) => typeof v === "number")).toBe(true);
      expect(seen).toContain(30);
    });

    // BUG(#79): barWidth is invoked as props.barWidth(d[1]) with a single argument, while
    // bar passes (d, i, nodes) to the accessors it owns. An index-aware or node-aware
    // barWidth therefore sees undefined for i on every bar of both sides, and 30 + undefined
    // is NaN, which bar's guard turns into 0. Shared with pyramid, where the index is now
    // forwarded. The index cancels out of the stacked width, so an index-aware accessor has
    // to produce the same widths as a plain one; today it produces none at all.
    // current: every width and every x collapses to 0. expected: the index is forwarded.
    // Skipped, not deleted: it fails with "expected [ '0', '0', '0', '0' ] to deeply equal [ '30', '1', '40', '2' ]".
    test.skip("forwards d3's index when computing the bars' width and x", () => {
      const indexed = render(pyramidOf().barWidth((v: number, i: number) => v + i));
      const plain = render(pyramidOf().barWidth((v: number) => v));
      expect(attrs(indexed, "rightStack", "width")).toEqual(attrs(plain, "rightStack", "width"));
    });

    // BUG(#434): barPosition and barFill are both called with one argument too, by two
    // different routes. barPosition is composed with the row accessor, .y(fn.compose(
    // props.barPosition, rowAcc)) on both bars, and fn.compose forwards every argument only
    // to the innermost function - barPosition is the outer one, so it receives exactly one,
    // returns NaN for an index-aware accessor, and bar's guard flattens that to y="0".
    // barFill is never composed: it goes through barFillOf, a one-parameter arrow, so no
    // index can reach it at all. A fill accessor returns a colour string rather than NaN,
    // so the consequence there is an undefined-indexed lookup, not a flattened 0.
    // current: every argument after the first is dropped. expected: the index is
    // forwarded, as it is to the accessors bar owns.
    // Skipped, not deleted: it fails with "expected false to be true".
    test.skip("forwards d3's index to barPosition and barFill too", () => {
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
          }),
      );
      expect(positionArgs.every((args) => typeof args[1] === "number")).toBe(true);
      expect(fillArgs.every((args) => typeof args[1] === "number")).toBe(true);
    });

    test("puts a reference point on the outer edge of the bar it describes", async () => {
      // SAFETY: the bars are offset outwards by SPINE_PADDING (0.5), so the outline carries
      // the same offset - otherwise a reference value equal to a bar's outer edge lands half
      // a pixel inside it. pyramid's reference line makes the identical correction.
      const node = render(pyramidOf().rightRefAccessor(() => [{ row: 0, value: 70 }]));
      const outerEdge =
        Number(attrs(node, "rightStack", "x")[2]) + Number(attrs(node, "rightStack", "width")[2]);
      expect(outerEdge).toBe(70.5);
      // d3.line closes a single-point path with Z
      expect(await lineD(node, "rightReference")).toBe("M70.5,5Z");
    });

    test("has no d attribute on the tick the reference line is first rendered", async () => {
      // NOTE: the path's `d` is only ever applied through a transition, so the element
      // exists with no geometry until the first animation frame. Anything that measures the
      // chart synchronously after render - getBBox, a snapshot, an export to PNG - sees an
      // empty path. Shared with pyramid.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { row: 0, value: 0 },
          { row: 1, value: 1 },
        ]),
      );
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull();
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");
    });

    test("should animate the bars in step with the reference line", async () => {
      // Both the bars and the outline transition now, so on the tick after a state change
      // both still describe the old geometry and both ease to the new one together. Before
      // bar's transition was made real the bars snapped ahead and the line visibly detached
      // from them for the length of the transition. Shared with pyramid.
      let ref = [
        { row: 0, value: 0 },
        { row: 1, value: 1 },
      ];
      const component = pyramidOf().rightRefAccessor(() => ref);
      const g = group("mixed-transitions");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M0.5,5L1.5,17");

      ref = [
        { row: 2, value: 2 },
        { row: 3, value: 3 },
      ];
      g.datum(
        layout([
          { side: "f", row: 0, series: "a", value: 10 },
          { side: "m", row: 0, series: "a", value: 99 },
        ]),
      ).call(component as never);
      // On this tick the bars have not jumped ahead...
      expect(attrs(node, "rightStack", "width")).toEqual(["30"]);
      // ...and the line still describes the same old state.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M0.5,5L1.5,17");

      // Once the transition has run, both have arrived.
      await vi.waitFor(() => {
        expect(attrs(node, "rightStack", "width")).toEqual(["99"]);
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M2.5,29L3.5,41");
      });
    });

    test("attaches a discarded transition to every rect on every render", () => {
      // NOTE: bar defaults `transition` to true and this component neither sets it nor
      // exposes it, so every render creates a d3 transition per rect and then overwrites the
      // geometry on the plain selection immediately - nothing animates, but the transition
      // state is still attached and interrupts any transition already running on those
      // rects. Not configurable from here. Shared with stackedBar.
      expect(Reflect.get(stackedPyramid(), "transition")).toBeUndefined();
      const node = render(pyramidOf());
      for (const r of bars(node, "leftStack")) {
        expect(Object.keys(r).some((key) => key.startsWith("__transition"))).toBe(true);
      }
    });

    test("drops d3's index on the reference line too", async () => {
      // NOTE: d3.line calls its x accessor as (d, i, data), but the line reads the point's
      // value out of it and calls barWidth with that alone, so the property has one calling
      // convention everywhere - and an index-aware accessor sees undefined and yields NaN on
      // the line just as it does on the bars. Since every point is then non-finite, the
      // missing-value guard skips all of them and the outline has no geometry at all rather
      // than a NaN-poisoned path string; either way nothing is drawn, because a d the
      // browser cannot parse renders nothing. Fixing the calling convention is #434.
      const node = render(
        pyramidOf()
          .barWidth((v: number, i: number) => v + i)
          .rightRefAccessor(() => [
            { row: 0, value: 10 },
            { row: 1, value: 20 },
          ]),
      );
      // Read directly rather than through lineD, which waits for a d to appear.
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull();
      expect(attrs(node, "rightStack", "width")).toEqual(["0", "0", "0", "0"]);
    });

    test("gives the right reference line an empty transform attribute", () => {
      // NOTE: the mirror prop writes `transform=""` rather than omitting the attribute.
      // Harmless, but it means the attribute is always present. Shared with pyramid.
      const node = render(pyramidOf().rightRefAccessor(() => refPoints));
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
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
        ]),
      );
      expect(attrs(node, "leftStack", "x")).toEqual(["4.5"]);
      expect(attrs(node, "leftStack", "width")).toEqual(["-5"]);
      expect(attrs(node, "rightStack", "x")).toEqual(["0.5"]);
    });

    test("matches surviving stacks and bars by index rather than by series", async () => {
      // NOTE: neither join uses a key function, so on a re-render the stack groups and the
      // rects inside them are matched positionally. When a series is dropped from anywhere
      // but the end, the groups that remain are re-bound to different series and every bar in
      // them is rewritten. Only the geometry moves, so it is invisible here, but any state
      // held on a stack group - a class, a listener, or the transition that now really runs -
      // follows the position rather than the series. Shared with stackedBar.
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
        ]),
      ).call(component as never);
      // The group that used to hold series "a" now holds series "b".
      expect(stacks(node, "leftStack")[0]).toBe(firstStack);
      await vi.waitFor(() => {
        expect(attrs(node, "leftStack", "width")).toEqual(["20", "15"]);
      });
    });
  });

  describe("nested stack groups", () => {
    /** Renders once, plants a stack group `depth` levels inside the first series group. */
    const plant = (key: string, side: string, depth: number) => {
      const component = pyramidOf();
      const g = group(key);
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;

      let parent: Element = ownStacks(node, side)[0];
      for (let i = 0; i < depth; i++) {
        const nested = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nested.setAttribute("data-sszvis-stack", "");
        parent.append(nested);
        parent = nested;
      }
      const planted = parent;

      return { g, node, component, planted };
    };

    test("should leave a nested stack group alone when a caller plants one inside a series group", () => {
      // The join is a child selector, so a caller may render content of its own - including
      // further stack groups - inside a series group without the component adopting it.
      const { g, node, component, planted } = plant("descendant-left", "leftStack", 1);
      expect(ownStacks(node, "leftStack").length).toBe(2);

      expect(() => g.datum(layout()).call(component as never)).not.toThrow();
      expect(ownStacks(node, "leftStack").length).toBe(2);
      expect(planted.parentNode).toBe(ownStacks(node, "leftStack")[0]);
    });

    test("should leave a nested stack group alone when it sits two levels deep", () => {
      const { g, node, component, planted } = plant("descendant-deep", "leftStack", 2);

      expect(() => g.datum(layout()).call(component as never)).not.toThrow();
      expect(ownStacks(node, "leftStack").length).toBe(2);
      expect(planted.isConnected).toBe(true);
    });

    test("should leave a foreign rect.sszvis-bar alone when one is planted in a stack group", () => {
      // bar joins on its own .sszvis-bar-rect class, so a rect carrying only the generic
      // class - drawn by another component, or left behind by an earlier chart - is not
      // adopted as bar zero, which used to shift the whole row by one.
      const component = pyramidOf();
      const g = group("foreign-bar");
      g.datum(layout()).call(component as never);
      const node = g.node() as SVGGElement;

      const foreign = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      foreign.setAttribute("class", "sszvis-bar");
      foreign.setAttribute("width", "3");
      ownStacks(node, "leftStack")[0].append(foreign);

      g.datum(layout()).call(component as never);

      expect(foreign.getAttribute("width")).toBe("3");
      expect(foreign.getAttribute("class")).toBe("sszvis-bar");
      expect(bars(node, "leftStack")).not.toContain(foreign);
    });
  });
});
