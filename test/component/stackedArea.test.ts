import { stack } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import stackedArea from "../../src/component/stackedArea.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/**
 * One point along a layer's outline. The component reads three independent dimensions from
 * it: x, and the two vertical bounds of the band at that x.
 */
type Point = { x: number; y0: number; y1: number };

/** One layer of the stack, i.e. one area. The data bound to the chart is an array of these. */
type Layer = Point[];

describe("component/stackedArea", () => {
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
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `stackedarea-${++layerKey}`,
    }).selectGroup("areachart");

  const render = (component: unknown, data: unknown) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * An area wired to the test point shape.
   *
   * transition is disabled because every visual property - the geometry, the fill, the
   * stroke and its width - is written through the transition when it is on, so no visual
   * property is observable on the synchronous tick; only the class is. See the transition
   * block at the bottom of this file.
   */
  const areaOf = () =>
    stackedArea()
      .transition(false)
      .x((d: Point) => d.x)
      .y0((d: Point) => d.y0)
      .y1((d: Point) => d.y1);

  const paths = (node: Element) => [...node.querySelectorAll("path.sszvis-path")];
  const ds = (node: Element) => paths(node).map((p) => p.getAttribute("d"));
  const attrs = (node: Element, attr: string) => paths(node).map((p) => p.getAttribute(attr));

  const oneLayer: Layer[] = [
    [
      { x: 0, y0: 40, y1: 10 },
      { x: 10, y0: 50, y1: 20 },
    ],
  ];
  const twoLayers: Layer[] = [
    [
      { x: 0, y0: 100, y1: 60 },
      { x: 10, y0: 100, y1: 50 },
    ],
    [
      { x: 0, y0: 60, y1: 20 },
      { x: 10, y0: 50, y1: 10 },
    ],
  ];

  describe("rendering", () => {
    test("should render one classed path per layer", () => {
      const node = render(areaOf(), twoLayers);
      expect(paths(node).length).toBe(2);
      for (const p of paths(node)) expect(p.tagName).toBe("path");
    });

    test("should trace the top line forwards and the baseline backwards", () => {
      // An area is a closed shape: out along y1, back along y0 in reverse, then closed.
      expect(ds(render(areaOf(), oneLayer))).toEqual(["M0,10L10,20L10,50L0,40Z"]);
    });

    test("should keep the layers independent of one another", () => {
      expect(ds(render(areaOf(), twoLayers))).toEqual([
        "M0,60L10,50L10,100L0,100Z",
        "M0,20L10,10L10,50L0,60Z",
      ]);
    });

    test("should render nothing for an empty data array", () => {
      expect(paths(render(areaOf(), [])).length).toBe(0);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = areaOf();
      const g = group("rerender");
      g.datum(twoLayers).call(component as never);
      g.datum(twoLayers).call(component as never);
      expect(paths(g.node() as SVGGElement).length).toBe(2);
    });

    test("should remove paths when the data shrinks", () => {
      const component = areaOf();
      const g = group("shrink");
      g.datum(twoLayers).call(component as never);
      g.datum([twoLayers[0]]).call(component as never);
      expect(paths(g.node() as SVGGElement).length).toBe(1);
    });

    test("should update the geometry when the data changes", () => {
      const component = areaOf();
      const g = group("update");
      g.datum(oneLayer).call(component as never);
      g.datum([
        [
          { x: 5, y0: 15, y1: 5 },
          { x: 15, y0: 25, y1: 15 },
        ],
      ]).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual(["M5,5L15,15L15,25L5,15Z"]);
    });

    test("should render the output of a d3 stack layout, as the examples do", () => {
      // The shape docs/area-chart-stacked feeds in: each series is an array of [y0, y1]
      // tuples carrying the source row on .data and the series name on .key.
      const series = stack().keys(["a", "b"])([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]);
      const node = render(
        stackedArea()
          .transition(false)
          .key((d: { key: string }) => d.key)
          .x((_d: unknown, i: number) => i * 10)
          .y0((d: number[]) => d[0])
          .y1((d: number[]) => d[1])
          .fill((d: { key: string }) => (d.key === "a" ? "#f00" : "#00f")),
        series
      );
      expect(ds(node)).toEqual(["M0,1L10,3L10,0L0,0Z", "M0,3L10,7L10,3L0,1Z"]);
      expect(attrs(node, "fill")).toEqual(["#f00", "#00f"]);
    });
  });

  describe("accessors", () => {
    test("should pass each point, its index and the layer array to x, y0 and y1", () => {
      const seen: Record<string, unknown[][]> = { x: [], y0: [], y1: [] };
      const record =
        (name: string) =>
        (...args: unknown[]) => {
          seen[name].push(args);
          return 0;
        };
      render(
        stackedArea().transition(false).x(record("x")).y0(record("y0")).y1(record("y1")),
        oneLayer
      );
      // All three go through the same call site in d3.area, once per point - the baseline
      // is drawn back from cached values rather than by asking again.
      for (const name of ["x", "y0", "y1"]) {
        expect(seen[name].map((args) => args.length)).toEqual([3, 3]);
        expect(seen[name].map((args) => args[0])).toEqual(oneLayer[0]);
        expect(seen[name].map((args) => args[1])).toEqual([0, 1]);
        expect(seen[name].map((args) => args[2])).toEqual([oneLayer[0], oneLayer[0]]);
      }
    });

    test("should pass the whole layer array and its index to the style accessors", () => {
      const seen: unknown[][] = [];
      const node = render(
        areaOf().fill((...args: unknown[]) => {
          seen.push(args);
          return "#f00";
        }),
        twoLayers
      );
      // Style accessors receive the array of points, not a single point - the inverse of
      // what x, y0 and y1 receive. The third argument is d3's group of path nodes.
      expect(seen.map((args) => args.length)).toEqual([3, 3]);
      expect(seen.map((args) => args[0])).toEqual(twoLayers);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(Array.from(seen[0][2] as ArrayLike<Element>)).toEqual(paths(node));
    });

    test("should accept constants in place of the dimension accessors", () => {
      // d3.area wraps a non-function in its own constant(), so a fixed baseline needs no
      // functor of its own.
      const node = render(stackedArea().transition(false).x(5).y0(30).y1(20), oneLayer);
      expect(ds(node)).toEqual(["M5,20L5,20L5,30L5,30Z"]);
    });

    test("should accept a numeric string, which d3 coerces", () => {
      const node = render(stackedArea().transition(false).x("7").y0(2).y1(1), oneLayer);
      expect(ds(node)).toEqual(["M7,1L7,1L7,2L7,2Z"]);
    });

    test("should accept composed accessors, as the docs examples do", () => {
      const yScale = (v: number) => 100 - v;
      const node = render(
        stackedArea()
          .transition(false)
          .x((d: Point) => d.x * 2)
          .y0((d: Point) => yScale(d.y0))
          .y1((d: Point) => yScale(d.y1)),
        oneLayer
      );
      expect(ds(node)).toEqual(["M0,90L20,80L20,50L0,60Z"]);
    });
  });

  describe("fill", () => {
    test("should apply a constant fill to every layer", () => {
      expect(attrs(render(areaOf().fill("#abc"), twoLayers), "fill")).toEqual(["#abc", "#abc"]);
    });

    test("should apply a fill derived from the layer's own data", () => {
      const node = render(
        areaOf().fill((d: Layer) => (d[0].y1 === 60 ? "#f00" : "#00f")),
        twoLayers
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#00f"]);
    });

    describe("known quirks", () => {
      test("an unset fill leaves no fill attribute, so the areas render black", () => {
        // NOTE: fill has no default, and unlike .sszvis-line there is no .sszvis-path rule
        // in sszvis.css to fall back on - the class is only a hook. The SVG initial value
        // for fill is black, so an area without a fill accessor is a black slab. Every
        // chart in docs/area-chart-stacked sets one.
        const node = render(areaOf(), oneLayer);
        expect(attrs(node, "fill")).toEqual([null]);
        expect(getComputedStyle(paths(node)[0]).fill).toBe("rgb(0, 0, 0)");
      });

      test("a fill accessor returning undefined removes the attribute rather than warning", () => {
        // NOTE: d3 treats a null-ish attribute value as a removal, so a colour scale
        // configured with .unknown(undefined) silently produces a black area instead of an
        // error.
        const node = render(
          areaOf().fill(() => undefined),
          oneLayer
        );
        expect(attrs(node, "fill")).toEqual([null]);
      });
    });
  });

  describe("stroke and strokeWidth", () => {
    test("should default the stroke to white", () => {
      // The white hairline is what visually separates two touching layers.
      expect(attrs(render(areaOf(), twoLayers), "stroke")).toEqual(["#ffffff", "#ffffff"]);
    });

    test("should apply a constant stroke", () => {
      expect(attrs(render(areaOf().stroke("#f00"), oneLayer), "stroke")).toEqual(["#f00"]);
    });

    test("should apply a stroke derived from the layer's own data", () => {
      const node = render(
        areaOf().stroke((d: Layer) => (d[0].y1 === 60 ? "#f00" : "#00f")),
        twoLayers
      );
      expect(attrs(node, "stroke")).toEqual(["#f00", "#00f"]);
    });

    test("should default the strokeWidth to 1", () => {
      expect(attrs(render(areaOf(), oneLayer), "stroke-width")).toEqual(["1"]);
    });

    test("should apply a constant strokeWidth, including zero", () => {
      // The default is applied with an explicit undefined check, so 0 survives where a
      // falsy fallback would have replaced it.
      expect(attrs(render(areaOf().strokeWidth(4), oneLayer), "stroke-width")).toEqual(["4"]);
      expect(attrs(render(areaOf().strokeWidth(0), oneLayer), "stroke-width")).toEqual(["0"]);
    });

    test("should apply a strokeWidth derived from the layer's own data", () => {
      const node = render(
        areaOf().strokeWidth((d: Layer) => d.length),
        twoLayers
      );
      expect(attrs(node, "stroke-width")).toEqual(["2", "2"]);
    });

    describe("known quirks", () => {
      test("a falsy stroke is silently replaced by white, so there is no way to opt out", () => {
        // NOTE: the default is applied as `props.stroke || "#ffffff"`, which tests the prop
        // for truthiness rather than for having been set. Both null and "" - the two ways a
        // caller would ask for no stroke at all - therefore come back white. Only an
        // accessor gets through, because a function is always truthy: `() => null` removes
        // the attribute outright and `() => ""` writes an invalid paint, and both compute
        // to none.
        expect(attrs(render(areaOf().stroke(null), oneLayer), "stroke")).toEqual(["#ffffff"]);
        expect(attrs(render(areaOf().stroke(""), oneLayer), "stroke")).toEqual(["#ffffff"]);
        expect(
          attrs(
            render(
              areaOf().stroke(() => ""),
              oneLayer
            ),
            "stroke"
          )
        ).toEqual([""]);
      });

      test("a null strokeWidth removes the attribute where an unset one gives 1", () => {
        // NOTE: strokeWidth guards with `=== undefined`, so null is passed through to d3,
        // which reads a null-ish value as a removal. The two ways of saying "no width" thus
        // disagree: unset means 1, null means no attribute at all. Harmless in practice -
        // both render a hairline - but the asymmetry is undocumented.
        expect(attrs(render(areaOf().strokeWidth(null), oneLayer), "stroke-width")).toEqual([null]);
        expect(attrs(render(areaOf(), oneLayer), "stroke-width")).toEqual(["1"]);
      });
    });
  });

  describe("defined", () => {
    /** A layer whose middle point has no value, the usual shape of a gap in a CSV. */
    const withGap: Layer[] = [
      [
        { x: 0, y0: 40, y1: 10 },
        { x: 10, y0: 50, y1: Number.NaN },
        { x: 20, y0: 60, y1: 30 },
      ],
    ];

    test("should use an explicit defined predicate to break the area", () => {
      const node = render(
        areaOf().defined((d: Point) => !Number.isNaN(d.y1)),
        withGap
      );
      // Each surviving run becomes its own subpath. A run of one point is emitted as a
      // degenerate top-and-bottom pair by d3.area.
      expect(ds(node)).toEqual(["M0,10L0,40ZM20,30L20,60Z"]);
    });

    test("should pass the point, its index and the layer array to defined", () => {
      const seen: unknown[][] = [];
      render(
        areaOf().defined((...args: unknown[]) => {
          seen.push(args);
          return true;
        }),
        oneLayer
      );
      expect(seen.map((args) => args.length)).toEqual([3, 3]);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(seen.map((args) => args[2])).toEqual([oneLayer[0], oneLayer[0]]);
    });

    test("should accept a constant predicate, which d3 coerces to a boolean", () => {
      expect(ds(render(areaOf().defined(false), oneLayer))).toEqual([null]);
      expect(ds(render(areaOf().defined(true), oneLayer))).toEqual(["M0,10L10,20L10,50L0,40Z"]);
    });

    describe("known quirks", () => {
      test("the default predicate never rejects anything, so NaN reaches the path", () => {
        // BUG: the default is built as
        //   function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }
        // which returns a *function* rather than calling either of them, and && between two
        // functions yields the second one. d3 only tests the return value for truthiness,
        // so the guard is dead: every point is considered defined, whatever its value. The
        // intent was `d => !isNaN(y0(d)) && !isNaN(y1(d))`. The pre-TypeScript line.js
        // composed a single accessor - `fn.compose(fn.not(isNaN), props.y)` - which works,
        // because compose returns the predicate itself; it is the `&&` of two composed
        // functions that breaks it here. src/component/line.ts now writes its
        // two-dimension guard by hand.
        // current: NaN is written into the d attribute verbatim. expected: the point is
        // skipped and the area breaks, as it does when defined is set explicitly above.
        const node = render(areaOf(), withGap);
        expect(ds(node)).toEqual(["M0,10L10,NaNL20,30L20,60L10,50L0,40Z"]);
      });

      test("a NaN in the path truncates the rendered shape without any error", () => {
        // BUG: the visible consequence of the dead guard. The browser stops rendering at the
        // invalid command, so only the leading moveto survives and the layer disappears
        // entirely - one missing value costs the whole area, not just the segment it belongs
        // to. Compare the explicit-predicate case above, where the healthy tail survives as
        // its own subpath.
        const node = render(areaOf(), withGap);
        // Nothing after M0,10 is drawn, so the path has zero length and no extent.
        expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBe(0);
        expect((paths(node)[0] as SVGPathElement).getBBox().width).toBe(0);
        const intact = render(areaOf(), oneLayer);
        expect((paths(intact)[0] as SVGPathElement).getTotalLength()).toBeGreaterThan(0);
      });

      test("undefined and null values are not caught either", () => {
        // NOTE: only the undefined case belongs to the dead guard - isNaN(undefined) is
        // true, so the intended default would have caught it, and instead d3.area applies
        // unary + and turns it into NaN. null is not caught by an isNaN guard at all, since
        // isNaN(null) is false: it coerces to 0 and is plotted as data, pinning that point
        // to the top of the chart. The same coercion trap is documented on line's default
        // predicate. Neither is reported.
        const undef = render(areaOf(), [
          [
            { x: 0, y0: 40, y1: 10 },
            { x: 10, y0: 50, y1: undefined as unknown as number },
          ],
        ]);
        expect(ds(undef)).toEqual(["M0,10L10,NaNL10,50L0,40Z"]);

        const nulls = render(areaOf(), [
          [
            { x: 0, y0: 40, y1: 10 },
            { x: 10, y0: 50, y1: null as unknown as number },
          ],
        ]);
        expect(ds(nulls)).toEqual(["M0,10L10,0L10,50L0,40Z"]);
      });

      test("setting defined is the only way to get a missing-value guard at all", () => {
        // NOTE: the JSDoc does not mention defined, so the property that makes the
        // difference between a broken path and a broken area is undocumented. It also has
        // to guard both bounds by hand, since defined replaces the dead default rather than
        // composing with it.
        const node = render(
          areaOf().defined((d: Point) => !Number.isNaN(d.y0) && !Number.isNaN(d.y1)),
          [
            [
              { x: 0, y0: 40, y1: 10 },
              { x: 10, y0: Number.NaN, y1: 20 },
              { x: 20, y0: 60, y1: 30 },
            ],
          ]
        );
        expect(ds(node)).toEqual(["M0,10L0,40ZM20,30L20,60Z"]);
      });
    });
  });

  describe("key", () => {
    test("should default to the index, matching layers by position", () => {
      const component = areaOf();
      const g = group("defaultkey");
      g.datum(twoLayers).call(component as never);
      const before = paths(g.node() as SVGGElement);
      g.datum([twoLayers[1]]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      // The surviving layer is matched to index 0, so it reuses the first node.
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[0]);
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,20L10,10L10,50L0,60Z"]);
    });

    test("should preserve object constancy when a key is given", () => {
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("keyed");
      g.datum(twoLayers).call(component as never);
      const before = paths(g.node() as SVGGElement);
      // Only the layer keyed 20 survives, and it must reuse the second node.
      g.datum([twoLayers[1]]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[1]);
    });

    test("should pass the layer, its index and the layer array to the key function", () => {
      const seen: unknown[][] = [];
      render(
        areaOf().key((...args: unknown[]) => {
          seen.push(args);
          return String(args[1]);
        }),
        twoLayers
      );
      expect(seen.map((args) => args.length)).toEqual([3, 3]);
      expect(seen.map((args) => args[0])).toEqual(twoLayers);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
    });

    test("should reorder the paths to match the data order", () => {
      // .join() orders the merged selection for free, so the paint order of the layers
      // follows the data even when the nodes are reused.
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("order");
      g.datum(twoLayers).call(component as never);
      g.datum([twoLayers[1], twoLayers[0]]).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual([
        "M0,20L10,10L10,50L0,60Z",
        "M0,60L10,50L10,100L0,100Z",
      ]);
    });
  });

  describe("required props", () => {
    describe("known quirks", () => {
      test("omitting x draws the whole stack at NaN instead of throwing", () => {
        // BUG: the component always calls d3's setters, so an unset prop arrives as
        // undefined, and area.x(undefined) resolves to constant(+undefined) - NaN for every
        // point. The path is written, the browser rejects it, and the chart is simply
        // empty. No property of this component reports its own absence.
        // current: "MNaN,..." and nothing on screen. expected: a logged error naming the
        // missing property and an early return, as src/legend/binnedColorScale.ts does.
        const node = render(
          stackedArea()
            .transition(false)
            .y0((d: Point) => d.y0)
            .y1((d: Point) => d.y1),
          oneLayer
        );
        expect(ds(node)).toEqual(["MNaN,10LNaN,20LNaN,50LNaN,40Z"]);
        expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBe(0);
      });

      test("omitting y0 pushes the baseline to NaN, keeping only the top line", () => {
        // BUG: same root cause. The top line is drawn, the baseline is not, and the shape
        // is dropped by the browser at the first NaN.
        const node = render(
          stackedArea()
            .transition(false)
            .x((d: Point) => d.x)
            .y1((d: Point) => d.y1),
          oneLayer
        );
        expect(ds(node)).toEqual(["M0,10L10,20L10,NaNL0,NaNZ"]);
      });

      test("omitting y1 collapses every area onto its own baseline", () => {
        // BUG: the worst of the three, because it renders successfully. area.y1(undefined)
        // is read by d3 as "no upper bound", which makes it fall back to y0 - so the top
        // line and the baseline coincide and each layer becomes a zero-height sliver. With
        // the default white stroke the chart looks like a set of line charts, and nothing
        // hints that the values are missing.
        const node = render(
          stackedArea()
            .transition(false)
            .x((d: Point) => d.x)
            .y0((d: Point) => d.y0),
          oneLayer
        );
        expect(ds(node)).toEqual(["M0,40L10,50L10,50L0,40Z"]);
      });

      test("a component with no props at all still renders a path per layer", () => {
        // BUG: same root cause as the three above, combined into one silent empty chart. The
        // DOM says the render succeeded - the paths are there, classed and stroked white,
        // with no fill written at all - while the geometry is entirely NaN.
        const node = render(stackedArea().transition(false), twoLayers);
        expect(paths(node).length).toBe(2);
        expect(attrs(node, "stroke")).toEqual(["#ffffff", "#ffffff"]);
        expect(attrs(node, "fill")).toEqual([null, null]);
        expect(ds(node)).toEqual([
          "MNaN,NaNLNaN,NaNLNaN,NaNLNaN,NaNZ",
          "MNaN,NaNLNaN,NaNLNaN,NaNLNaN,NaNZ",
        ]);
      });
    });
  });

  describe("edge cases", () => {
    test("should render an empty path element for a layer with no points", () => {
      const node = render(areaOf(), [[]]);
      expect(paths(node).length).toBe(1);
      expect(ds(node)).toEqual([null]);
    });

    test("should emit a degenerate closed shape for a single point", () => {
      // The single point is emitted as its own top and bottom bound, closed - which is how
      // a one-point layer reaches the DOM. It encloses no area, but the default white stroke
      // still draws a vertical hairline.
      const node = render(areaOf(), [[{ x: 5, y0: 20, y1: 10 }]]);
      expect(ds(node)).toEqual(["M5,10L5,20Z"]);
      expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBe(20);
    });

    test("should handle negative and fractional coordinates", () => {
      const node = render(areaOf(), [
        [
          { x: -10, y0: -5, y1: -12.5 },
          { x: 0.25, y0: 3.5, y1: 1 },
        ],
      ]);
      expect(ds(node)).toEqual(["M-10,-12.5L0.25,1L0.25,3.5L-10,-5Z"]);
    });

    test("should accept an inverted band, where y1 is below y0", () => {
      // Nothing enforces an orientation; the shape simply winds the other way.
      expect(
        ds(
          render(areaOf(), [
            [
              { x: 0, y0: 10, y1: 40 },
              { x: 10, y0: 10, y1: 40 },
            ],
          ])
        )
      ).toEqual(["M0,40L10,40L10,10L0,10Z"]);
    });

    describe("known quirks", () => {
      test("a layer that is not an array renders an empty path", () => {
        // BUG: the JSDoc documents a valuesAccessor property - "the default treats the layer
        // object as an array of values" - but the component never declares it, so the setter
        // does not exist at all (see the next test) and a wrapper object cannot be unwrapped.
        // d3.area runs the datum through Array.from, which yields [] for a plain object, so
        // the layer is silently skipped. stackedAreaMultiples, a near-copy of this component,
        // does declare valuesAccessor.
        // current: an empty path per layer. expected: either the documented property, or the
        // documentation dropped.
        const node = render(areaOf(), [{ values: oneLayer[0] }]);
        expect(paths(node).length).toBe(1);
        expect(ds(node)).toEqual([null]);
      });

      test("setting valuesAccessor throws, because the property does not exist", () => {
        // BUG: same root cause, from the caller's side. The JSDoc's own recommended usage
        // fails with "areaOf(...).valuesAccessor is not a function".
        expect(() =>
          (areaOf() as unknown as { valuesAccessor: (a: unknown) => void }).valuesAccessor(
            (d: { values: Layer }) => d.values
          )
        ).toThrow(TypeError);
      });

      test("adopts any pre-existing path.sszvis-path in the group", () => {
        // NOTE: the join matches on the generic .sszvis-path class, which pie,
        // stackedAreaMultiples and stackedPyramid also use. A path another component left in
        // the same group is bound to layer zero and repainted as an area rather than being
        // left alone. Harmless while each component owns its own selectGroup, which is how
        // every example is written, and benign here because stackedArea rewrites every
        // attribute it uses - the cost falls on whichever component owned the path. See the
        // same collision documented from the other side in test/component/pie.test.ts, where
        // it corrupts pie's own geometry and is labelled a bug for that reason.
        const g = group("foreign");
        g.append("path").attr("class", "sszvis-path").attr("d", "M1,1");
        g.datum(oneLayer).call(areaOf() as never);
        const node = g.node() as SVGGElement;
        expect(paths(node).length).toBe(1);
        expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
      });
    });
  });

  describe("transition", () => {
    /** An area with the default transition left on, so the timing is observable. */
    const animated = () =>
      stackedArea()
        .x((d: Point) => d.x)
        .y0((d: Point) => d.y0)
        .y1((d: Point) => d.y1)
        .fill("#ff0000")
        .strokeWidth(3);

    const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

    test("should default to true", () => {
      expect(stackedArea().transition()).toBe(true);
    });

    test("should write everything synchronously when disabled", () => {
      const node = render(areaOf().fill("#f00").strokeWidth(3), oneLayer);
      expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
      expect(attrs(node, "fill")).toEqual(["#f00"]);
      expect(attrs(node, "stroke-width")).toEqual(["3"]);
    });

    test("should animate the geometry between renders when enabled", async () => {
      const component = animated();
      const g = group("animated");
      g.datum(oneLayer).call(component as never);
      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,10L10,20L10,50L0,40Z"]);

      g.datum([
        [
          { x: 0, y0: 100, y1: 60 },
          { x: 10, y0: 110, y1: 70 },
        ],
      ]).call(component as never);
      // The old geometry is still on screen on the tick the re-render happens.
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,10L10,20L10,50L0,40Z"]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      const midway = ds(g.node() as SVGGElement)[0] as string;
      expect(midway).not.toBe("M0,10L10,20L10,50L0,40Z");
      expect(midway).not.toBe("M0,60L10,70L10,110L0,100Z");

      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,60L10,70L10,110L0,100Z"]);
    });

    test("should apply the class synchronously even when transitioning", () => {
      // classed() runs on the selection, before the transition is created - it is the only
      // thing this component writes outside the transition.
      const node = render(animated(), oneLayer);
      expect(paths(node).length).toBe(1);
    });

    describe("known quirks", () => {
      test("an entering area has no geometry and no styling on the first tick", () => {
        // BUG: with the default transition the selection is replaced by the transition
        // before any attribute is written, so d, fill, stroke and stroke-width are all
        // deferred. A freshly rendered chart is an empty <path> until the first animation
        // frame runs, and anything measuring it synchronously - getTotalLength, a bounding
        // box, a server-side screenshot - sees nothing. line defers d and stroke-width the
        // same way but still writes its stroke synchronously, and bar and dot write their
        // geometry synchronously first, so this is the widest version of the hole.
        const node = render(animated(), oneLayer);
        expect(ds(node)).toEqual([null]);
        expect(attrs(node, "fill")).toEqual([null]);
        expect(attrs(node, "stroke")).toEqual([null]);
        expect(attrs(node, "stroke-width")).toEqual([null]);
      });

      test("an entering area snaps into shape while its stroke grows in", async () => {
        // NOTE: the consequence of the above, and it is not uniform across the attributes,
        // because each one interpolates from the attribute's absence differently. d and the
        // two colours jump to their target on the first frame: d3 interpolates from the
        // element's current value, which is null, so the path string has no numbers to pair
        // with and the tween returns the target immediately, and a colour interpolated from
        // nothing reads as constant. stroke-width instead animates up from 0, because a
        // numeric interpolation coerces the missing start value and +null is 0. The layers
        // therefore appear at full size with a hairline that thickens over 300ms.
        const g = group("enter-snap");
        g.datum(oneLayer).call(animated() as never);
        await new Promise((resolve) => setTimeout(resolve, 80));
        const node = g.node() as SVGGElement;
        expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
        expect(attrs(node, "fill")).toEqual(["rgb(255, 0, 0)"]);
        expect(attrs(node, "stroke")).toEqual(["rgb(255, 255, 255)"]);
        const width = Number(attrs(node, "stroke-width")[0]);
        expect(width).toBeGreaterThan(0);
        expect(width).toBeLessThan(3);
        await settle();
        expect(attrs(node, "stroke-width")).toEqual(["3"]);
      });

      test("the colours are rewritten as rgb() rather than as they were given", async () => {
        // NOTE: a side effect of routing the colours through the transition - d3 interpolates
        // them in rgb space and writes the result back. A stylesheet or a test that matches
        // on the hex string it passed in will not find it.
        const g = group("rgb");
        g.datum(oneLayer).call(animated() as never);
        await settle();
        expect(attrs(g.node() as SVGGElement, "fill")).toEqual(["rgb(255, 0, 0)"]);
      });
    });
  });
});
