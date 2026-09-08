import { stack } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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

    test("should keep a class a caller added to a path across rerenders", () => {
      const component = areaOf();
      const g = group("consumer-class");
      g.datum(oneLayer).call(component as never);
      const node = g.node() as SVGGElement;
      paths(node)[0]?.classList.add("consumer-decoration");
      g.datum(oneLayer).call(component as never);
      expect(paths(node)[0]?.classList.contains("consumer-decoration")).toBe(true);
      expect(paths(node)[0]?.classList.contains("sszvis-stacked-area-path")).toBe(true);
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
      // is drawn back from cached values rather than by asking again. y0 and y1 are asked
      // twice per point, because the default missing-value guard reads both bounds before
      // the generator does; an explicit defined predicate replaces that second reading.
      expect(seen.x.length).toBe(2);
      expect(seen.y0.length).toBe(4);
      expect(seen.y1.length).toBe(4);
      for (const name of ["x", "y0", "y1"]) {
        expect(seen[name].map((args) => args.length)).toEqual(seen[name].map(() => 3));
        expect(new Set(seen[name].map((args) => args[1]))).toEqual(new Set([0, 1]));
        for (const args of seen[name]) {
          expect(oneLayer[0]).toContain(args[0]);
          expect(args[2]).toEqual(oneLayer[0]);
        }
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
      const node = render(
        stackedArea()
          .transition(false)
          // @ts-expect-error - a numeric string is deliberately not in the interface
          .x("7")
          .y0(2)
          .y1(1),
        oneLayer
      );
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
          // @ts-expect-error - a fill accessor is typed as returning a colour
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

    test("should skip a point whose bounds are missing, breaking the area", () => {
      // The default guard tests both vertical bounds. Each surviving run becomes its own
      // subpath, exactly as it does when defined is set explicitly above.
      expect(ds(render(areaOf(), withGap))).toEqual(["M0,10L0,40ZM20,30L20,60Z"]);
      expect(
        ds(
          render(areaOf(), [
            [
              { x: 0, y0: 40, y1: 10 },
              { x: 10, y0: Number.NaN, y1: 20 },
              { x: 20, y0: 60, y1: 30 },
            ],
          ])
        )
      ).toEqual(["M0,10L0,40ZM20,30L20,60Z"]);
    });

    test("should warn once per render, however many points are missing", () => {
      // A gap is transient and recoverable - the area simply breaks around it - so the
      // caller is told about the chart, not about each point. The guard runs twice per
      // point (once for each bound), which is why a per-point warning would be noisy.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(areaOf(), [
        [
          { x: 0, y0: 40, y1: 10 },
          { x: 10, y0: Number.NaN, y1: Number.NaN },
          { x: 20, y0: Number.NaN, y1: 30 },
          { x: 30, y0: 60, y1: 30 },
        ],
      ]);
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    test("should keep the surviving points renderable", () => {
      // The consequence for the browser: where a NaN in the d attribute used to truncate the
      // whole layer at the invalid command, the healthy runs are drawn.
      const node = render(areaOf(), withGap);
      expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBeGreaterThan(0);
    });

    test("should treat undefined and null as missing too", () => {
      // A plain isNaN guard would catch undefined and let null through - isNaN(null) is
      // false, so it coerces to 0 and is plotted, pinning the point to the top of the chart.
      // A null measurement is missing data, so both are skipped here. line still lets null
      // through; that difference is documented on both.
      const undef = render(areaOf(), [
        [
          { x: 0, y0: 40, y1: 10 },
          { x: 10, y0: 50, y1: undefined as unknown as number },
        ],
      ]);
      expect(ds(undef)).toEqual(["M0,10L0,40Z"]);

      const nulls = render(areaOf(), [
        [
          { x: 0, y0: 40, y1: 10 },
          { x: 10, y0: 50, y1: null as unknown as number },
        ],
      ]);
      expect(ds(nulls)).toEqual(["M0,10L0,40Z"]);
    });

    test("should replace the default guard when defined is set", () => {
      // defined replaces the default rather than composing with it, so a predicate that only
      // looks at y1 lets a missing y0 back into the path.
      const node = render(
        areaOf().defined((d: Point) => !Number.isNaN(d.y1)),
        [
          [
            { x: 0, y0: 40, y1: 10 },
            { x: 10, y0: Number.NaN, y1: 20 },
            { x: 20, y0: 60, y1: 30 },
          ],
        ]
      );
      expect(ds(node)).toEqual(["M0,10L10,20L20,30L20,60L10,NaNL0,40Z"]);
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
    test("should throw when x is not set, naming the component and the property", () => {
      expect(() =>
        render(
          stackedArea()
            .transition(false)
            .y0((d: Point) => d.y0)
            .y1((d: Point) => d.y1),
          oneLayer
        )
      ).toThrow("[stackedArea] the x property is required");
    });

    test("should throw when y0 is not set", () => {
      expect(() =>
        render(
          stackedArea()
            .transition(false)
            .x((d: Point) => d.x)
            .y1((d: Point) => d.y1),
          oneLayer
        )
      ).toThrow("[stackedArea] the y0 property is required");
    });

    test("should throw when y1 is not set", () => {
      // The most damaging of the three before the guard, because it rendered: d3 reads a
      // null-ish upper bound as no upper bound and falls back to y0, so every layer
      // collapsed onto its own baseline and the chart looked like a set of line charts.
      expect(() =>
        render(
          stackedArea()
            .transition(false)
            .x((d: Point) => d.x)
            .y0((d: Point) => d.y0),
          oneLayer
        )
      ).toThrow("[stackedArea] the y1 property is required");
    });

    test("should append nothing when a required property is missing", () => {
      // The guard runs before the data join, so a misconfigured chart leaves the group as it
      // found it rather than filling it with paths whose geometry is entirely NaN.
      const g = group("unconfigured");
      expect(() => g.datum(twoLayers).call(stackedArea().transition(false) as never)).toThrow(
        /property is required/
      );
      expect(paths(g.node() as SVGGElement).length).toBe(0);
    });

    test("should keep the d3 meaning of an explicit null y1", () => {
      // Only an unset property is caught. A caller who says .y1(null) is asking d3 for "no
      // upper bound", which makes it fall back to y0 - a zero-height sliver on its baseline.
      const node = render(
        stackedArea()
          .transition(false)
          .x((d: Point) => d.x)
          .y0((d: Point) => d.y0)
          .y1(null),
        oneLayer
      );
      expect(ds(node)).toEqual(["M0,40L10,50L10,50L0,40Z"]);
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

  describe("foreign elements in the group", () => {
    /** A path another component could have left in the same group, carrying only the generic class. */
    const plant = (parent: Element) => {
      const foreign = document.createElementNS("http://www.w3.org/2000/svg", "path");
      foreign.setAttribute("class", "sszvis-path");
      foreign.setAttribute("d", "M0,0");
      foreign.setAttribute("fill", "#abc");
      parent.append(foreign);
      return foreign;
    };

    test("should leave a foreign generic path in the same group alone", () => {
      const g = group("foreign-untouched");
      const foreign = plant(g.node() as SVGGElement);
      g.datum(twoLayers).call(areaOf().fill("#f00") as never);

      expect(foreign.getAttribute("d")).toBe("M0,0");
      expect(foreign.getAttribute("fill")).toBe("#abc");
      expect(foreign.getAttribute("class")).toBe("sszvis-path");
    });

    test("should join only the paths it drew, so every layer still gets one", () => {
      const g = group("foreign-count");
      plant(g.node() as SVGGElement);
      g.datum(twoLayers).call(areaOf() as never);
      const node = g.node() as SVGGElement;

      expect(node.querySelectorAll("path.sszvis-stacked-area-path").length).toBe(2);
      expect(node.querySelectorAll("path.sszvis-path").length).toBe(3);
    });

    test("should keep the generic class on its own paths, so the stylesheet is unaffected", () => {
      const node = render(areaOf(), oneLayer);
      const own = node.querySelector("path.sszvis-stacked-area-path") as Element;
      expect(own.classList.contains("sszvis-path")).toBe(true);
    });
  });
});
