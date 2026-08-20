import { type ScaleBand, type ScaleLinear, scaleBand, scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  type StackedBarLayout,
  type StackedBarSlice,
  stackedBarHorizontal,
  stackedBarHorizontalData,
  stackedBarVertical,
  stackedBarVerticalData,
} from "../../src/component/stackedBar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type Row = { region: string; category: string; value: number };

/** One slice of a stack: the [y0, y1] pair plus the properties the layout attaches to it. */
type Slice = StackedBarSlice<Row>;
/** The whole layout: an array of series, tagged with the series keys and the stack maximum. */
type Layout = StackedBarLayout<Row>;

describe("component/stackedBar", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  const regionAcc = (d: Row) => d.region;
  const categoryAcc = (d: Row) => d.category;
  const valueAcc = (d: Row) => d.value;

  const rows: Row[] = [
    { region: "A", category: "X", value: 10 },
    { region: "A", category: "Y", value: 20 },
    { region: "B", category: "X", value: 15 },
    { region: "B", category: "Y", value: 25 },
  ];

  const verticalData = (data: Row[] = rows): Layout =>
    stackedBarVerticalData(regionAcc, categoryAcc, valueAcc)(data);
  const horizontalData = (data: Row[] = rows): Layout =>
    stackedBarHorizontalData(regionAcc, categoryAcc, valueAcc)(data);

  /** The [y0, y1] pairs of a layout, series by series, without the attached properties. */
  const pairs = (layout: Layout) => layout.map((series) => series.map((d) => [d[0], d[1]]));

  let xBand: ScaleBand<string>;
  let yLinear: ScaleLinear<number, number>;
  let xLinear: ScaleLinear<number, number>;
  let yBand: ScaleBand<string>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);

    // Vertical: an ordinal x-axis of stacks, a linear y-axis of values.
    xBand = scaleBand<string>().domain(["A", "B"]).range([0, 400]).paddingInner(0.2);
    yLinear = scaleLinear().domain([0, 50]).range([300, 0]);
    // Horizontal: a linear x-axis of values, an ordinal y-axis of stacks.
    xLinear = scaleLinear().domain([0, 50]).range([0, 400]);
    yBand = scaleBand<string>().domain(["A", "B"]).range([0, 300]).paddingInner(0.2);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `stacked-${++layerKey}`,
    }).selectGroup("stacked-bars");

  const render = (component: unknown, data: unknown = verticalData()) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /** A vertical component with every prop the orientation actually uses. */
  const verticalOf = () =>
    stackedBarVertical().xScale(xBand).width(xBand.bandwidth()).yScale(yLinear);

  /** A horizontal component with every prop the orientation actually uses. */
  const horizontalOf = () =>
    stackedBarHorizontal().xScale(xLinear).yScale(yBand).height(yBand.bandwidth());

  const stacks = (node: Element) => [...node.querySelectorAll("g.sszvis-stack")];
  const rects = (node: Element) => [...node.querySelectorAll("rect.sszvis-bar")];
  const attrs = (nodes: Element[], attr: string) => nodes.map((n) => n.getAttribute(attr));
  const anchors = (node: Element) => [...node.querySelectorAll("[data-tooltip-anchor]")];

  describe("stackedBarVerticalData", () => {
    test("should return one series per series key", () => {
      const layout = verticalData();
      expect(layout.length).toBe(2);
      expect(layout.map((series) => series.length)).toEqual([2, 2]);
    });

    test("should collect the series keys in the order the layout stacked them", () => {
      expect(verticalData().keys).toEqual(["X", "Y"]);
    });

    test("should stack the last series key on the baseline", () => {
      // The vertical layout uses stackOrderReverse, so the series are laid down back to
      // front: the last key ("Y") sits on the baseline and the first key ("X") on top of it.
      expect(pairs(verticalData())).toEqual([
        [
          [20, 30],
          [25, 40],
        ],
        [
          [0, 20],
          [0, 25],
        ],
      ]);
    });

    test("should tag every slice with its series, stack and source datum", () => {
      const layout = verticalData();
      expect(layout.map((series) => series.map((d) => d.series))).toEqual([
        ["X", "X"],
        ["Y", "Y"],
      ]);
      expect(layout.map((series) => series.map((d) => d.stack))).toEqual([
        ["A", "B"],
        ["A", "B"],
      ]);
      expect(layout[0][0].data).toBe(rows[0]);
      expect(layout[1][1].data).toBe(rows[3]);
    });

    test("should report the highest stacked total as maxValue", () => {
      expect(verticalData().maxValue).toBe(40);
    });

    test("should return an empty layout for empty data", () => {
      const layout = verticalData([]);
      expect(layout.length).toBe(0);
      expect(layout.keys).toEqual([]);
      // NOTE: maxValue is d3.max over an empty array, so it is undefined rather than 0. The
      // examples feed it straight into a scale domain - docs/bar-chart-vertical-stacked
      // /basic.js does `domain([0, state.maxStacked])` - where undefined coerces to NaN and
      // the axis renders NaN ticks. The layout itself is empty, so no bars are drawn either
      // way; only the axis gives the empty state away.
      expect(layout.maxValue).toBeUndefined();
    });

    test("should not mutate the input rows", () => {
      // NOTE: the JSDoc header claims the component adds `y0` and `y` to every passed-in
      // data object. That was true of the d3v3 stack layout; d3v7 returns [y0, y1] tuples
      // and leaves the source data alone, so the warning no longer applies.
      const data = rows.map((d) => ({ ...d }));
      verticalData(data);
      expect(data).toEqual(rows);
      for (const d of data) expect(Object.keys(d)).toEqual(["region", "category", "value"]);
    });
  });

  describe("stackedBarHorizontalData", () => {
    test("should stack the first series key on the baseline", () => {
      // The horizontal layout uses stackOrderNone, so the keys stack front to back: the
      // first key ("X") sits on the baseline. This is the only difference between the two
      // layouts; everything else about them is identical.
      expect(pairs(horizontalData())).toEqual([
        [
          [0, 10],
          [0, 15],
        ],
        [
          [10, 30],
          [15, 40],
        ],
      ]);
    });

    test("should attach the same keys and maxValue as the vertical layout", () => {
      expect(horizontalData().keys).toEqual(verticalData().keys);
      expect(horizontalData().maxValue).toBe(verticalData().maxValue);
    });

    test("should tag every slice with its series, stack and source datum", () => {
      const layout = horizontalData();
      expect(layout.map((series) => series.map((d) => d.series))).toEqual([
        ["X", "X"],
        ["Y", "Y"],
      ]);
      expect(layout.map((series) => series.map((d) => d.stack))).toEqual([
        ["A", "B"],
        ["A", "B"],
      ]);
    });
  });

  describe("props", () => {
    test("should expose every prop the renderer reads", () => {
      for (const component of [stackedBarVertical(), stackedBarHorizontal()]) {
        for (const prop of ["xScale", "width", "yScale", "height", "fill", "stroke"]) {
          expect(typeof component[prop]).toBe("function");
        }
      }
    });

    test("props should be chainable", () => {
      const component = stackedBarVertical();
      expect(
        component.xScale(xBand).width(10).yScale(yLinear).height(10).fill("#000").stroke("#000")
      ).toBe(component);
    });

    test("should read back a function-valued prop unchanged", () => {
      // xScale, width, yScale and height are wrapped in fn.functor, which passes functions
      // through untouched but boxes plain values, so only functions survive a round-trip.
      const component = stackedBarVertical();
      expect(component.xScale(xBand).xScale()).toBe(xBand);
      expect(component.width(10).width()).not.toBe(10);
      expect(component.width(10).width()()).toBe(10);
      // fill and stroke are stored raw, so both a constant and an accessor read back as set.
      expect(component.fill("#f00").fill()).toBe("#f00");
      expect(component.stroke("#0f0").stroke()).toBe("#0f0");
    });
  });

  describe("stackedBarVertical rendering", () => {
    test("should render one classed group per series", () => {
      const node = render(verticalOf());
      expect(stacks(node).length).toBe(2);
      for (const g of stacks(node)) expect(g.tagName).toBe("g");
    });

    test("should render one rect per slice", () => {
      const node = render(verticalOf());
      expect(rects(node).length).toBe(4);
      for (const g of stacks(node)) expect(rects(g).length).toBe(2);
    });

    test("should position the rects with the stack accessor and the upper bound", () => {
      const node = render(verticalOf());
      // Series "X" spans [20, 30] over stack "A" and [25, 40] over stack "B".
      expect(attrs(rects(stacks(node)[0]), "x")).toEqual([String(xBand("A")), String(xBand("B"))]);
      expect(attrs(rects(stacks(node)[0]), "y")).toEqual([
        String(yLinear(30)),
        String(yLinear(40)),
      ]);
    });

    test("should size the rects from the scaled bounds and the width prop", () => {
      const node = render(verticalOf());
      expect(attrs(rects(stacks(node)[0]), "height")).toEqual([
        String(yLinear(20) - yLinear(30)),
        String(yLinear(25) - yLinear(40)),
      ]);
      for (const r of rects(node)) {
        expect(r.getAttribute("width")).toBe(String(xBand.bandwidth()));
      }
    });

    test("should accept a width accessor as well as a constant", () => {
      const node = render(verticalOf().width((d: Slice) => (d.series === "X" ? 5 : 15)));
      expect(attrs(rects(node), "width")).toEqual(["5", "5", "15", "15"]);
    });

    test("should render a tooltip anchor per rect", () => {
      const node = render(verticalOf());
      expect(anchors(node).length).toBe(4);
    });

    test("should anchor the tooltip at the top centre of each segment", () => {
      // NOTE: bar's default anchor position, since stackedBar exposes neither
      // `centerTooltip` nor `tooltipAnchor` - see the quirks below.
      const node = render(verticalOf());
      const x = (xBand("A") ?? 0) + xBand.bandwidth() / 2;
      expect(anchors(node)[0].getAttribute("transform")).toBe(`translate(${x},${yLinear(30)})`);
    });

    test("should render nothing for an empty layout", () => {
      const node = render(verticalOf(), verticalData([]));
      expect(stacks(node).length).toBe(0);
      expect(rects(node).length).toBe(0);
    });

    test("should ignore the height prop", () => {
      // The vertical orientation computes its height from the y-scale and never reads
      // `props.height`, although the JSDoc claims the prop determines the bar height.
      const withHeight = render(verticalOf().height(999));
      expect(attrs(rects(withHeight), "height")).toEqual(
        attrs(rects(render(verticalOf())), "height")
      );
    });
  });

  describe("stackedBarHorizontal rendering", () => {
    test("should render one classed group per series, one rect per slice", () => {
      const node = render(horizontalOf(), horizontalData());
      expect(stacks(node).length).toBe(2);
      expect(rects(node).length).toBe(4);
    });

    test("should position the rects with the lower bound and the stack accessor", () => {
      const node = render(horizontalOf(), horizontalData());
      // Series "Y" spans [10, 30] over stack "A" and [15, 40] over stack "B".
      expect(attrs(rects(stacks(node)[1]), "x")).toEqual([
        String(xLinear(10)),
        String(xLinear(15)),
      ]);
      expect(attrs(rects(stacks(node)[1]), "y")).toEqual([String(yBand("A")), String(yBand("B"))]);
    });

    test("should size the rects from the scaled bounds and the height prop", () => {
      const node = render(horizontalOf(), horizontalData());
      expect(attrs(rects(stacks(node)[1]), "width")).toEqual([
        String(xLinear(30) - xLinear(10)),
        String(xLinear(40) - xLinear(15)),
      ]);
      for (const r of rects(node)) {
        expect(r.getAttribute("height")).toBe(String(yBand.bandwidth()));
      }
    });

    test("should accept a height accessor as well as a constant", () => {
      const component = horizontalOf().height((d: Slice) => (d.series === "X" ? 5 : 15));
      const node = render(component, horizontalData());
      expect(attrs(rects(node), "height")).toEqual(["5", "5", "15", "15"]);
    });

    test("should ignore the width prop", () => {
      // The horizontal orientation computes its width from the x-scale and never reads
      // `props.width`. This one the JSDoc gets right.
      const node = render(horizontalOf().width(999), horizontalData());
      expect(attrs(rects(node), "width")).not.toContain("999");
    });

    test("should render a tooltip anchor per rect", () => {
      const node = render(horizontalOf(), horizontalData());
      expect(anchors(node).length).toBe(4);
    });
  });

  describe("fill and stroke", () => {
    test("should fill the rects from an accessor over the slice", () => {
      const node = render(verticalOf().fill((d: Slice) => (d.series === "X" ? "#f00" : "#0f0")));
      expect(attrs(rects(node), "fill")).toEqual(["#f00", "#f00", "#0f0", "#0f0"]);
    });

    test("should accept a constant fill", () => {
      const node = render(verticalOf().fill("#123456"));
      expect(new Set(attrs(rects(node), "fill"))).toEqual(new Set(["#123456"]));
    });

    test("should write no fill attribute when fill is unset", () => {
      // The JSDoc's "default black" is only accidentally true: no fill attribute is written
      // at all, and black is SVG's own default.
      const node = render(verticalOf());
      expect(attrs(rects(node), "fill")).toEqual([null, null, null, null]);
    });

    test("should default the stroke to white, so the segments read as separated", () => {
      const node = render(verticalOf());
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["#FFFFFF"]));
    });

    test("should let a stroke value replace the white default", () => {
      const node = render(verticalOf().stroke("none"));
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["none"]));
    });

    test("should accept a stroke accessor over the slice", () => {
      const node = render(verticalOf().stroke((d: Slice) => (d.series === "X" ? "#f00" : "#0f0")));
      expect(attrs(rects(node), "stroke")).toEqual(["#f00", "#f00", "#0f0", "#0f0"]);
    });
  });

  describe("re-rendering", () => {
    test("should render in place rather than appending duplicates", () => {
      const component = verticalOf();
      const g = group("rerender");
      g.datum(verticalData()).call(component as never);
      g.datum(verticalData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(stacks(node).length).toBe(2);
      expect(rects(node).length).toBe(4);
    });

    test("should remove the groups when the series disappear", () => {
      const component = verticalOf();
      const g = group("shrink-series");
      g.datum(verticalData()).call(component as never);
      g.datum(verticalData(rows.filter((d) => d.category === "X"))).call(component as never);
      const node = g.node() as SVGGElement;
      expect(stacks(node).length).toBe(1);
      expect(rects(node).length).toBe(2);
    });

    test("should remove the rects when the stacks disappear", () => {
      const component = verticalOf();
      const g = group("shrink-stacks");
      g.datum(verticalData()).call(component as never);
      g.datum(verticalData(rows.filter((d) => d.region === "A"))).call(component as never);
      const node = g.node() as SVGGElement;
      expect(stacks(node).length).toBe(2);
      expect(rects(node).length).toBe(2);
    });

    test("should pick up a changed scale", () => {
      const component = verticalOf();
      const g = group("rescale");
      g.datum(verticalData()).call(component as never);
      yLinear.range([150, 0]);
      g.datum(verticalData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(rects(stacks(node)[0]), "y")).toEqual([
        String(yLinear(30)),
        String(yLinear(40)),
      ]);
    });

    test("should re-bind the surviving nodes by index rather than by series", () => {
      // NOTE: neither join uses a key function, so the groups and the rects are matched by
      // index. Dropping the first series re-binds the second onto the <g> and the rects
      // that used to hold the first - the DOM nodes survive and change meaning, which is
      // invisible to a test that only counts them.
      const component = verticalOf();
      const g = group("rebind");
      g.datum(verticalData()).call(component as never);
      const node = g.node() as SVGGElement;
      const firstStack = stacks(node)[0];
      const firstRect = rects(firstStack)[0];
      // Series "X" is on top of the stack, spanning [20, 30].
      expect(firstRect.getAttribute("y")).toBe(String(yLinear(30)));

      g.datum(verticalData(rows.filter((d) => d.category === "Y"))).call(component as never);
      expect(stacks(node).length).toBe(1);
      expect(stacks(node)[0]).toBe(firstStack);
      expect(rects(firstStack)[0]).toBe(firstRect);
      // The same rect now carries series "Y", alone on the baseline and spanning [0, 20].
      expect(firstRect.getAttribute("y")).toBe(String(yLinear(20)));
    });

    test("should not keep a stale tooltip anchor per rect", () => {
      const component = verticalOf();
      const g = group("rerender-anchors");
      g.datum(verticalData()).call(component as never);
      g.datum(verticalData()).call(component as never);
      expect(anchors(g.node() as SVGGElement).length).toBe(4);
    });
  });

  describe("missing props", () => {
    test("should collapse the bars to zero width when width is unset on a vertical chart", () => {
      // BUG: `width` is required by the vertical orientation but is neither defaulted nor
      // validated. fn.functor boxes the missing value into a constant function returning
      // undefined, which bar's missing-value guard turns into 0.
      // current: width="0" for every rect, no warning. expected: an error naming the prop.
      const node = render(stackedBarVertical().xScale(xBand).yScale(yLinear));
      expect(rects(node).length).toBe(4);
      expect(new Set(attrs(rects(node), "width"))).toEqual(new Set(["0"]));
    });

    test("should collapse the bars to zero height when height is unset on a horizontal chart", () => {
      // BUG: same silent failure on the other orientation.
      // current: height="0" for every rect, no warning. expected: an error naming the prop.
      const node = render(stackedBarHorizontal().xScale(xLinear).yScale(yBand), horizontalData());
      expect(rects(node).length).toBe(4);
      expect(new Set(attrs(rects(node), "height"))).toEqual(new Set(["0"]));
    });

    test("should throw when the x-scale is unset", () => {
      // NOTE: the scales are the only props whose absence is reported at all, and only
      // because fn.compose calls undefined - "Cannot read properties of undefined (reading
      // 'call')" names neither the prop nor the component.
      expect(() => render(stackedBarVertical().width(10).yScale(yLinear))).toThrow();
    });

    test("should throw when the y-scale is unset", () => {
      expect(() => render(stackedBarVertical().xScale(xBand).width(10))).toThrow();
    });
  });

  describe("known quirks", () => {
    test("keeps only the first row of every stack/series pair", () => {
      // BUG: the stack value is read as `valueAcc(x[key][0])`, i.e. from the first row of
      // each group only. Data that is not pre-aggregated to one row per (stack, series)
      // pair is silently truncated rather than summed or reported.
      // current: the second "A"/"X" row is dropped and the total understates by 90.
      // expected: the values are summed, or the duplicate is reported.
      const withDuplicate: Row[] = [...rows, { region: "A", category: "X", value: 90 }];
      expect(pairs(verticalData(withDuplicate))).toEqual(pairs(verticalData()));
      expect(verticalData(withDuplicate).maxValue).toBe(40);
    });

    test("throws when a stack is missing one of the series", () => {
      // BUG: the same unguarded reach throws for a sparse data set. Every stack must carry
      // a row for every series key, so a category with no data in one region - a normal
      // shape for real data - fails, and callers have to pad their data with zero rows.
      // Note the knock-on effect: `keys` is built as a union across all cascade rows, but
      // any row missing one of those keys throws, so the union can never actually differ
      // from the key set of the first row.
      // current: TypeError "Cannot read properties of undefined (reading '0')", naming
      // neither the stack nor the series. expected: the missing slice is treated as 0.
      const sparse = rows.filter((d) => !(d.region === "B" && d.category === "Y"));
      expect(() => verticalData(sparse)).toThrow();
      expect(() => horizontalData(sparse)).toThrow();
    });

    test("stacks integer-like series keys in numeric order, not data order", () => {
      // BUG: the series keys come from `Object.keys` of the cascade's objectBy layer, and
      // JavaScript orders integer-like object keys numerically regardless of insertion
      // order. A series accessor returning years or numeric codes therefore loses the
      // caller's ordering, which is also the stacking order: "10" is seen first in the data
      // but ends up sorted after "2" and, because the vertical layout reverses the keys,
      // stacked below it.
      const numeric: Row[] = [
        { region: "A", category: "10", value: 1 },
        { region: "A", category: "2", value: 2 },
      ];
      const layout = verticalData(numeric);
      expect(layout.keys).toEqual(["2", "10"]);
      expect(layout.map((series) => series[0].series)).toEqual(["2", "10"]);
      // "10" (value 1) sits on the baseline, "2" (value 2) on top of it.
      expect(pairs(layout)).toEqual([[[1, 3]], [[0, 1]]]);
    });

    test("orders integer-like stacks numerically too", () => {
      // NOTE: the cascade's arrayBy layer iterates the same kind of object, so the stacks
      // are reordered as well. This one is only cosmetic: each slice carries its own stack
      // value and is positioned by the scale, so only the DOM order of the rects changes.
      const numeric: Row[] = [
        { region: "10", category: "X", value: 1 },
        { region: "2", category: "X", value: 2 },
      ];
      expect(verticalData(numeric)[0].map((d) => d.stack)).toEqual(["2", "10"]);
    });

    test("merges stack values that share a string form", () => {
      // NOTE: the cascade groups by the stringified accessor result, so 1 and "1" land in
      // the same stack. The surviving slice reports whichever of the two came first as its
      // `stack` value, in its original type.
      const mixed = [
        { region: 1, category: "X", value: 5 },
        { region: "1", category: "X", value: 7 },
      ] as unknown as Row[];
      const layout = verticalData(mixed);
      expect(layout[0].length).toBe(1);
      expect(layout[0][0].stack).toBe(1 as unknown as string);
    });

    test("replaces each slice's data property with the source row", () => {
      // NOTE: d3.stack sets `d.data` to the whole cascade row - an object of every series
      // in that stack - and the layout overwrites it with the single row the slice came
      // from. Convenient for tooltips, but it means the slice can no longer reach its
      // sibling series, and the value is a live reference into the caller's data.
      const layout = verticalData();
      expect(layout[0][0].data).toBe(rows[0]);
      expect(layout[0][0].data.category).toBe("X");
    });

    test("falls back to the white separator stroke for every falsy value", () => {
      // NOTE: the stroke is applied as `props.stroke || "#FFFFFF"`, so every falsy value -
      // including the null and the empty string that would remove the attribute - falls
      // back to white. A truthy "none" does remove the separator, so the prop is usable;
      // what is wrong is the JSDoc, which documents the default as "none" while the code
      // draws a white 1px stroke centred on the bar edge, overpainting half a pixel of
      // whatever is behind it on each side.
      for (const value of [null, undefined, ""]) {
        const node = render(verticalOf().stroke(value));
        expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["#FFFFFF"]));
      }
    });

    test("writes a negative width for a negative horizontal value", () => {
      // BUG: bar guards its geometry against NaN but not against negative sizes, and the
      // horizontal width is `xScale(d[1]) - xScale(d[0])`, which goes negative as soon as a
      // value does. The browser rejects the attribute and drops the rect. Clamping the sign
      // would not be enough: x is `xScale(d[0])`, so the segment would be drawn on the
      // positive side of the baseline anyway, and maxValue is the max of the upper bounds
      // only, so the negative extent never reaches the scale domain either.
      // current: width="-80", nothing rendered. expected: the segment is drawn to the left
      // of the baseline, and maxValue reports the stack's true extent.
      const negative: Row[] = [
        { region: "A", category: "X", value: -10 },
        { region: "A", category: "Y", value: 20 },
      ];
      const node = render(horizontalOf(), horizontalData(negative));
      expect(attrs(rects(node), "width")[0]?.startsWith("-")).toBe(true);
    });

    test("writes a negative height when the vertical y-scale range ascends", () => {
      // NOTE: the vertical height is `yScale(d[0]) - yScale(d[1])`, which assumes the
      // inverted range every sszvis y-scale uses. A scale built with an ascending range
      // still positions the bars, but every height comes out negative and nothing renders.
      const ascending = scaleLinear().domain([0, 50]).range([0, 300]);
      const node = render(verticalOf().yScale(ascending));
      for (const value of attrs(rects(node), "height")) {
        expect(value?.startsWith("-")).toBe(true);
      }
    });

    test("silently boxes a non-function scale into a constant", () => {
      // NOTE: the scales go through fn.functor, so a value passed where a scale belongs is
      // boxed into a function returning it instead of being rejected. On the vertical
      // orientation that puts every bar at the same x with height 0.
      // @ts-expect-error - the port types both scales as functions, catching this statically
      const node = render(verticalOf().xScale(7).yScale(5));
      expect(new Set(attrs(rects(node), "x"))).toEqual(new Set(["7"]));
      expect(new Set(attrs(rects(node), "height"))).toEqual(new Set(["0"]));
    });

    test("attaches a discarded transition to every rect on every render", () => {
      // NOTE: bar defaults `transition` to true and stackedBar neither sets it nor exposes
      // it, so every render creates a d3 transition per rect and then overwrites the
      // geometry on the plain selection immediately - nothing animates (see
      // test/component/bar.test.ts), but the transition state is still attached and
      // interrupts any transition already running on those rects. Not configurable from
      // here.
      expect(stackedBarVertical().transition).toBeUndefined();
      const node = render(verticalOf());
      for (const r of rects(node)) {
        expect(Object.keys(r).some((key) => key.startsWith("__transition"))).toBe(true);
      }
    });

    test("does not expose bar's tooltip anchor props", () => {
      // NOTE: `centerTooltip` and `tooltipAnchor` are bar props that stackedBar does not
      // forward, so the anchor is always at the top centre of a segment. A stacked chart
      // that wants its tooltip in the middle of a segment cannot ask for it.
      const component = stackedBarVertical();
      expect(component.centerTooltip).toBeUndefined();
      expect(component.tooltipAnchor).toBeUndefined();
    });

    test("does not expose the props its JSDoc documents for the data layout", () => {
      // NOTE: the header documents `xAccessor`, `yAccessor` and `orientation` as properties
      // of the component, and none of the three exists. `xAccessor`/`yAccessor` are a
      // d3v3-era naming for what is now `stackedBar*Data(stackAcc, seriesAcc, valueAcc)`,
      // and the mapping is orientation-dependent: the examples call it as
      // `stackedBarVerticalData(xAcc, cAcc, yAcc)` but `stackedBarHorizontalData(yAcc, cAcc,
      // xAcc)`, so the documented `xAccessor` is the value accessor in one orientation and
      // the stack accessor in the other. `seriesAcc` is documented nowhere at all, and
      // `orientation` was replaced by the two separate constructors.
      const component = stackedBarVertical();
      for (const prop of ["xAccessor", "yAccessor", "orientation"]) {
        expect(component[prop]).toBeUndefined();
      }
    });

    test("shadows Array.prototype.keys with the series key array", () => {
      // BUG: `keys` is assigned onto the returned array, where it shadows the built-in
      // Array.prototype.keys iterator method, so the layout is not a well-behaved array.
      // Nothing in the library or the examples calls `.keys()` on it today, so nothing is
      // broken right now - but any index-based iteration helper would throw.
      // current: `layout.keys()` throws a TypeError. expected: the keys and the maximum are
      // returned in a wrapper object instead of hung off the array.
      const layout = verticalData();
      expect(Array.isArray(layout.keys)).toBe(true);
      expect(() => (layout as unknown as string[]).keys()).toThrow(TypeError);
    });

    test("loses keys and maxValue when the layout array is copied", () => {
      // NOTE: `keys` and `maxValue` are properties hung off the returned array rather than
      // part of a wrapper object, so any array operation - a spread, a map, a filter, or a
      // trip through JSON - drops them. Callers that reshape the layout before rendering
      // have to carry the two values across by hand, and because of the shadowing above a
      // dropped `keys` reads back as the built-in method rather than as undefined.
      const layout = verticalData();
      // The spread yields a plain array, which the layout type no longer describes now that
      // it omits the inherited `keys` before declaring its own - so the dropped properties
      // are read back through a partial view of it.
      const copy = [...layout];
      expect(copy.length).toBe(layout.length);
      expect((copy as Partial<Pick<Layout, "maxValue">>).maxValue).toBeUndefined();
      expect(typeof copy.keys).toBe("function");
      expect(JSON.parse(JSON.stringify(layout)).maxValue).toBeUndefined();
    });

    test("captures a pre-existing stack anywhere below the target group", () => {
      // NOTE: the group join uses the descendant selector `.sszvis-stack` rather than a
      // child selector, so any pre-existing `.sszvis-stack` below the target group - at any
      // depth - is matched by the join and re-bound to its data. The library's own
      // nestedStackedBarsVertical is not affected: it gives each layout its own `barchart`
      // group, so no join ever sees another layout's stacks.
      const g = group("nested-selector");
      g.append("g").append("g").attr("class", "sszvis-stack");
      const node = g
        .datum(verticalData())
        .call(verticalOf() as never)
        .node() as SVGGElement;
      // The pre-existing stack is reused as the first series instead of being left alone,
      // and it is still nested two levels deep rather than a direct child.
      expect(stacks(node).length).toBe(2);
      expect(rects(node).length).toBe(4);
      expect((node.firstChild as Element).tagName).toBe("g");
      expect(rects(node.firstElementChild as Element).length).toBe(2);
    });
  });
});
