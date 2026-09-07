import { select, stack } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import stackedArea from "../../src/component/stackedArea.js";
import stackedAreaMultiples from "../../src/component/stackedAreaMultiples.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { defaultTransition } from "../../src/transition.js";
import "../../src/d3-selectgroup.js";

/**
 * One point along a layer's outline. The component reads three independent dimensions from
 * it: x, and the two vertical bounds of the band at that x.
 */
type Point = { x: number; y0: number; y1: number };

/** One layer of the stack, i.e. one multiple. The data bound to the chart is an array of these. */
type Layer = Point[];

/** The wrapper shape docs/area-chart-stacked/README.md gives as the reason valuesAccessor exists. */
type NamedLayer = { name: string; values: Layer };

describe("component/stackedAreaMultiples", () => {
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
      key: key ?? `stackedareamultiples-${++layerKey}`,
    }).selectGroup("areachart");

  const render = (component: unknown, data: unknown) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * An area wired to the test point shape, with the transition left at its default.
   *
   * An entering band is written synchronously even with the transition on, so a first render
   * is observable on the same tick. A re-render is not: an updating band eases into its new
   * geometry and colours over 300ms, so tests that assert the result of a second render use
   * staticAreaOf. See the transition block at the bottom of this file.
   */
  const areaOf = () =>
    stackedAreaMultiples()
      .x((d: Point) => d.x)
      .y0((d: Point) => d.y0)
      .y1((d: Point) => d.y1);

  /** The same area with the transition off, for assertions over a re-render. */
  const staticAreaOf = () => areaOf().transition(false);

  const paths = (node: Element) => [...node.querySelectorAll("path.sszvis-path")];
  const ds = (node: Element) => paths(node).map((p) => p.getAttribute("d"));
  const attrs = (node: Element, attr: string) => paths(node).map((p) => p.getAttribute(attr));

  const oneLayer: Layer[] = [
    [
      { x: 0, y0: 40, y1: 10 },
      { x: 10, y0: 50, y1: 20 },
    ],
  ];
  /** Two bands, each with its own baseline, as the separated view of a multiples chart has. */
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
  /** The d attribute each of the two layers above is drawn as. */
  const firstLayerPath = "M0,60L10,50L10,100L0,100Z";
  const secondLayerPath = "M0,20L10,10L10,50L0,60Z";

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
      // Each multiple is drawn from its own points only, in the order they were given.
      expect(ds(render(areaOf(), twoLayers))).toEqual([firstLayerPath, secondLayerPath]);
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
      const component = staticAreaOf();
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
      // tuples carrying the source row on .data and the series name on .key. In the
      // separated view the baseline comes from an ordinal position scale instead, but the
      // datum is the same.
      const series = stack().keys(["a", "b"])([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]);
      const node = render(
        stackedAreaMultiples()
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

  describe("layer order", () => {
    test("should not mutate the array it was given", () => {
      // A caller holding on to the same array - as the docs example does, rendering the
      // stacked and the separated view from one datum - sees it unchanged.
      const data = [twoLayers[0], twoLayers[1]];
      render(areaOf(), data);
      expect(data).toEqual([twoLayers[0], twoLayers[1]]);
      expect(data[0]).toBe(twoLayers[0]);
    });

    test("should follow the data order when the layers are reordered", () => {
      // .join() orders the merged selection for free, so the paint order follows the data
      // even when the nodes are reused.
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("order");
      g.datum(twoLayers).call(component as never);
      g.datum([twoLayers[1], twoLayers[0]]).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual([secondLayerPath, firstLayerPath]);
    });

    test("should paint the layers in the order they were given", () => {
      // The component used to reverse its data before the join, which put the first layer of
      // the input last in the DOM. It now matches stackedArea, so a chart toggling between
      // the two views no longer reorders its paths, and later siblings paint over earlier
      // ones in the order the caller asked for.
      const node = render(areaOf(), twoLayers);
      expect(ds(node)).toEqual([firstLayerPath, secondLayerPath]);
      expect(paths(node).at(-1)?.getAttribute("d")).toBe(secondLayerPath);
    });

    test("should number the layers from the start of the input", () => {
      // The index handed to the style accessors, to the key function and to valuesAccessor is
      // the position in the array that was passed in, so `fill((_d, i) => colours[i])` puts
      // the first colour on the first layer, here and in stackedArea alike.
      const seen: [Layer, number][] = [];
      const node = render(
        areaOf().fill((d: Layer, i: number) => {
          seen.push([d, i]);
          return i === 0 ? "#f00" : "#00f";
        }),
        twoLayers
      );
      expect(seen).toEqual([
        [twoLayers[0], 0],
        [twoLayers[1], 1],
      ]);
      expect(attrs(node, "fill")).toEqual(["#f00", "#00f"]);
      expect(ds(node)).toEqual([firstLayerPath, secondLayerPath]);
    });

    test("should match layers by position when the key is left unset", () => {
      // The default key is the index into the input, so dropping the last layer keeps the
      // first node bound to the first layer and removes the last one - as stackedArea does.
      const component = areaOf();
      const g = group("defaultkey");
      g.datum(twoLayers).call(component as never);
      const before = paths(g.node() as SVGGElement);
      g.datum([twoLayers[0]]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[0]);
      expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath]);
    });
  });

  describe("switching between the stacked and the separated view", () => {
    /**
     * The toggle docs/area-chart-stacked/sa-two.js implements: one datum, two components
     * rendered into the same group, with the separated view reading its baseline from an
     * ordinal position scale instead of from the stack. Offsetting the bounds by 100 stands
     * in for that scale, so the two views differ in geometry as well as in order.
     */
    const key = (d: Layer) => d[0].y1;
    const stackedView = () =>
      stackedArea()
        .key(key)
        .x((d: Point) => d.x)
        .y0((d: Point) => d.y0)
        .y1((d: Point) => d.y1);
    const separatedView = () =>
      stackedAreaMultiples()
        .key(key)
        .x((d: Point) => d.x)
        .y0((d: Point) => d.y0 + 100)
        .y1((d: Point) => d.y1 + 100);
    const firstSeparated = "M0,160L10,150L10,200L0,200Z";
    const secondSeparated = "M0,120L10,110L10,150L0,160Z";
    const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

    test("should keep the same path nodes across the switch", async () => {
      const g = group("toggle-nodes");
      g.datum(twoLayers).call(stackedView() as never);
      await settle();
      const before = paths(g.node() as SVGGElement);
      g.datum(twoLayers).call(separatedView() as never);
      const after = paths(g.node() as SVGGElement);
      // Both components key off the layer, so nothing enters or exits - which is the point
      // of the shared key, and what makes the reordering below observable.
      expect(after.length).toBe(2);
      expect(new Set(after)).toEqual(new Set(before));
    });

    test("should keep every path in place across the switch", async () => {
      // Both components bind the layers in the order they were given, so toggling the view
      // moves nothing: each node keeps its position and only its geometry changes. It used
      // to reorder both paths, because only the separated view reversed.
      const g = group("toggle-order");
      g.datum(twoLayers).call(stackedView() as never);
      await settle();
      const stacked = paths(g.node() as SVGGElement);
      expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);

      g.datum(twoLayers).call(separatedView() as never);
      const separated = paths(g.node() as SVGGElement);
      expect(separated[0]).toBe(stacked[0]);
      expect(separated[1]).toBe(stacked[1]);
    });

    test("should ease in both directions", async () => {
      // The toggle the key property exists for. Both components route an updating band
      // through the transition, so each switch holds the old geometry and interpolates into
      // the new one over 300ms. The switch into the separated view used to snap, because
      // this component created its transition and dropped it.
      const g = group("toggle-timing");
      g.datum(twoLayers).call(stackedView() as never);
      await settle();

      g.datum(twoLayers).call(separatedView() as never);
      // Still the stacked geometry on the tick of the switch.
      expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);
      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual([firstSeparated, secondSeparated]);

      g.datum(twoLayers).call(stackedView() as never);
      expect(ds(g.node() as SVGGElement)).toEqual([firstSeparated, secondSeparated]);
      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);
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
      render(stackedAreaMultiples().x(record("x")).y0(record("y0")).y1(record("y1")), oneLayer);
      // All three go through the same loop in d3.area, once per point - the baseline
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
      expect(seen.map((args) => args[0])).toEqual([twoLayers[0], twoLayers[1]]);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(Array.from(seen[0][2] as ArrayLike<Element>)).toEqual(paths(node));
    });

    test("should accept constants in place of the dimension accessors", () => {
      // d3.area wraps a non-function in its own constant(), so a fixed baseline needs no
      // functor of its own.
      const node = render(stackedAreaMultiples().x(5).y0(30).y1(20), oneLayer);
      expect(ds(node)).toEqual(["M5,20L5,20L5,30L5,30Z"]);
    });

    test("should accept a numeric string, which d3 coerces", () => {
      const node = render(
        stackedAreaMultiples()
          // @ts-expect-error - a numeric string is deliberately not in the interface
          .x("7")
          .y0(2)
          .y1(1),
        oneLayer
      );
      expect(ds(node)).toEqual(["M7,1L7,1L7,2L7,2Z"]);
    });

    test("should accept composed accessors, as the docs examples do", () => {
      // The separated view composes an ordinal position scale for y0 and subtracts a
      // within-band value scale for y1; both arrive here as plain functions of a point.
      const yPosition = (d: Point) => 100 - d.y0;
      const node = render(
        stackedAreaMultiples()
          .x((d: Point) => d.x * 2)
          .y0(yPosition)
          .y1((d: Point) => yPosition(d) - d.y1),
        oneLayer
      );
      expect(ds(node)).toEqual(["M0,50L20,30L20,50L0,60Z"]);
    });
  });

  describe("valuesAccessor", () => {
    const named: NamedLayer[] = [
      { name: "first", values: twoLayers[0] },
      { name: "second", values: twoLayers[1] },
    ];

    test("should default to the identity, treating a layer as its array of points", () => {
      expect(ds(render(areaOf(), oneLayer))).toEqual(["M0,10L10,20L10,50L0,40Z"]);
    });

    test("should unwrap a layer object into its points", () => {
      // The documented reason the property exists: a layer of the shape
      // { name: "Name", values: [ ... ] } rather than a bare array.
      const node = render(
        areaOf().valuesAccessor((d: NamedLayer) => d.values),
        named
      );
      expect(ds(node)).toEqual([firstLayerPath, secondLayerPath]);
    });

    test("should combine with style accessors reading the wrapper", () => {
      const node = render(
        areaOf()
          .valuesAccessor((d: NamedLayer) => d.values)
          .key((d: NamedLayer) => d.name)
          .fill((d: NamedLayer) => (d.name === "first" ? "#f00" : "#00f")),
        named
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#00f"]);
    });

    test("should pass the layer, its index and the node group to valuesAccessor", () => {
      const seen: unknown[][] = [];
      const thises: unknown[] = [];
      const node = render(
        areaOf().valuesAccessor(function (
          this: Element,
          layer: Layer,
          index: number,
          nodes: ArrayLike<Element>
        ) {
          seen.push([layer, index, nodes]);
          thises.push(this);
          return layer;
        }),
        twoLayers
      );
      // It is composed into the d attribute callback, so it is called exactly where a value
      // function for an attribute is: with the layer datum, its index, and the group of
      // path nodes, with the node itself as `this`.
      expect(seen.map((args) => args.length)).toEqual([3, 3]);
      expect(seen.map((args) => args[0])).toEqual([twoLayers[0], twoLayers[1]]);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(Array.from(seen[0][2] as ArrayLike<Element>)).toEqual(paths(node));
      expect(thises).toEqual(paths(node));
    });

    describe("known quirks", () => {
      test("the accessor is only consulted for the geometry, not for the styles", () => {
        // NOTE: valuesAccessor is composed into the d attribute alone, so fill, stroke,
        // strokeWidth and key still see the wrapper object. That is the useful arrangement -
        // it is how the colour can be read off the layer's name - but it means a single
        // property decides which of the two shapes each accessor is written against, and
        // nothing says which.
        const node = render(
          areaOf()
            .valuesAccessor((d: NamedLayer) => d.values)
            .fill((d: NamedLayer) => (typeof d.name === "string" ? "#f00" : "#00f")),
          named
        );
        expect(attrs(node, "fill")).toEqual(["#f00", "#f00"]);
      });

      test("a layer that is not unwrapped renders an empty path instead of failing", () => {
        // NOTE: with the default accessor a wrapper object reaches d3.area, which runs its
        // datum through Array.from - and that yields [] for a plain object, so the layer is
        // silently skipped. Forgetting valuesAccessor therefore produces an empty chart with
        // a clean console. stackedArea's old header documented the same property without ever
        // declaring it, and its port documents the absence, so there the mistake cannot even be
        // corrected.
        const node = render(areaOf(), named);
        expect(paths(node).length).toBe(2);
        expect(ds(node)).toEqual([null, null]);
      });

      test("an accessor returning nothing throws out of d3", () => {
        // NOTE: the other half of the same hole. A wrong accessor - a misspelled property,
        // or a layer that has no values - is not caught, and the TypeError comes from inside
        // d3.area rather than naming the property that produced it.
        expect(() =>
          render(
            // @ts-expect-error - the accessor is typed as returning the layer's points
            areaOf().valuesAccessor(() => undefined),
            oneLayer
          )
        ).toThrow(TypeError);
      });
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

    test("should pass a falsy stroke through, unlike stackedArea", () => {
      // There is no default to fall back to, so null and "" reach d3 as given: null removes
      // the attribute, "" writes an invalid paint. Both compute to none, which is also what
      // an unset stroke does.
      expect(attrs(render(areaOf().stroke(null), oneLayer), "stroke")).toEqual([null]);
      expect(attrs(render(areaOf().stroke(""), oneLayer), "stroke")).toEqual([""]);
    });

    describe("known quirks", () => {
      test("there is no default stroke, so the separating hairline is missing", () => {
        // NOTE: stackedArea defaults the stroke to #ffffff, the hairline that visually
        // separates two touching layers; this near-copy of it has no default at all, so
        // touching bands run together. Harmless in the separated view, where the bands are
        // spaced by stackedAreaMultiplesLayout and never touch, and the docs example does
        // not set a stroke on either component - but it means the two views of the same
        // chart are outlined differently.
        expect(attrs(render(areaOf(), twoLayers), "stroke")).toEqual([null, null]);
        expect(getComputedStyle(paths(render(areaOf(), oneLayer))[0]).stroke).toBe("none");
      });

      test("strokeWidth is written even when there is nothing to stroke", () => {
        // NOTE: the width defaults to 1 while the stroke defaults to nothing, so every path
        // carries an inert stroke-width. Setting only strokeWidth draws no line, which reads
        // as the property not working.
        const node = render(areaOf().strokeWidth(10), oneLayer);
        expect(attrs(node, "stroke-width")).toEqual(["10"]);
        expect(getComputedStyle(paths(node)[0]).stroke).toBe("none");
      });

      test("a null strokeWidth removes the attribute where an unset one gives 1", () => {
        // NOTE: strokeWidth guards with `=== undefined`, so null is passed through to d3,
        // which reads a null-ish value as a removal. The two ways of saying "no width" thus
        // disagree: unset means 1, null means no attribute at all. Harmless here, since
        // there is no stroke to size in the first place.
        expect(attrs(render(areaOf().strokeWidth(null), oneLayer), "stroke-width")).toEqual([null]);
        expect(attrs(render(areaOf(), oneLayer), "stroke-width")).toEqual(["1"]);
      });

      test("strokeWidth and transition are undocumented, and defined only in the README", () => {
        // NOTE: the JSDoc header lists x, y0, y1, fill, stroke, key and valuesAccessor, and
        // docs/area-chart-stacked/README.md lists those plus defined - whose default it
        // describes as "y0 and y1 are not NaN", a guard that does not run (see below). Three
        // properties exist and are settable beyond what the header names.
        const component = areaOf();
        expect(typeof component.strokeWidth).toBe("function");
        expect(typeof component.defined).toBe("function");
        expect(typeof component.transition).toBe("function");
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

    test("should see the unwrapped points when valuesAccessor is set", () => {
      const node = render(
        areaOf()
          .valuesAccessor((d: NamedLayer) => d.values)
          .defined((d: Point) => !Number.isNaN(d.y1)),
        [{ name: "gap", values: withGap[0] }]
      );
      expect(ds(node)).toEqual(["M0,10L0,40ZM20,30L20,60Z"]);
    });

    test("should skip a point whose bounds are missing, breaking the band", () => {
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
      // A gap is transient and recoverable - the band simply breaks around it - so the
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
      // whole band at the invalid command, the healthy runs are drawn.
      const node = render(areaOf(), withGap);
      expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBeGreaterThan(0);
    });

    test("should treat undefined and null as missing too", () => {
      // A plain isNaN guard would catch undefined and let null through - isNaN(null) is
      // false, so it coerces to 0 and is plotted, pinning the point to the top of the chart.
      // A null measurement is missing data, so both are skipped here, as in stackedArea.
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
    test("should preserve object constancy when a key is given", () => {
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("keyed");
      g.datum(twoLayers).call(component as never);
      const before = paths(g.node() as SVGGElement);
      // Only the layer keyed 60 survives, and it must reuse the node it already had - the
      // first one, since the layers are bound in the order they were given.
      g.datum([twoLayers[0]]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[0]);
    });

    test("should hand the node group to the key when it runs over the existing paths", () => {
      // The key runs once for each half of the join. Over the nodes already in the DOM it is
      // called with the node as `this` and d3's group of nodes as the third argument; over
      // the incoming layers it gets the parent as `this` and the array of layers.
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("key-update");
      g.datum(twoLayers).call(component as never);
      const nodes = paths(g.node() as SVGGElement);

      const seen: { this: unknown; group: unknown }[] = [];
      g.datum(twoLayers).call(
        areaOf().key(function (this: Element, d: Layer, _i: number, nodeGroup: unknown) {
          seen.push({ this: this, group: nodeGroup });
          return d[0].y1;
        }) as never
      );
      expect(seen.length).toBe(4);
      // First the nodes, then the data.
      expect(seen.slice(0, 2).map((call) => call.this)).toEqual(nodes);
      expect(Array.from(seen[0].group as ArrayLike<Element>)).toEqual(nodes);
      expect(seen.slice(2).map((call) => call.this)).toEqual([
        g.node() as SVGGElement,
        g.node() as SVGGElement,
      ]);
      expect(seen[2].group).toEqual([twoLayers[0], twoLayers[1]]);
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
      // The array it is given is the caller's own array, which is no longer copied.
      expect(seen.map((args) => args[0])).toEqual([twoLayers[0], twoLayers[1]]);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(seen[0][2]).toBe(twoLayers);
    });
  });

  describe("required props", () => {
    test("should throw when x is not set, naming the component and the property", () => {
      expect(() =>
        render(
          stackedAreaMultiples()
            .transition(false)
            .y0((d: Point) => d.y0)
            .y1((d: Point) => d.y1),
          oneLayer
        )
      ).toThrow("sszvis.stackedAreaMultiples - the x property is required, and was not set.");
    });

    test("should throw when y0 is not set", () => {
      expect(() =>
        render(
          stackedAreaMultiples()
            .transition(false)
            .x((d: Point) => d.x)
            .y1((d: Point) => d.y1),
          oneLayer
        )
      ).toThrow("sszvis.stackedAreaMultiples - the y0 property is required, and was not set.");
    });

    test("should throw when y1 is not set", () => {
      // The most damaging of the three before the guard, because it rendered: d3 reads a
      // null-ish upper bound as no upper bound and falls back to y0, so every layer
      // collapsed onto its own baseline and the chart looked like a set of line charts.
      expect(() =>
        render(
          stackedAreaMultiples()
            .transition(false)
            .x((d: Point) => d.x)
            .y0((d: Point) => d.y0),
          oneLayer
        )
      ).toThrow("sszvis.stackedAreaMultiples - the y1 property is required, and was not set.");
    });

    test("should append nothing when a required property is missing", () => {
      // The guard runs before the data join, so a misconfigured chart leaves the group as it
      // found it rather than filling it with paths whose geometry is entirely NaN.
      const g = group("unconfigured");
      expect(() =>
        g.datum(twoLayers).call(stackedAreaMultiples().transition(false) as never)
      ).toThrow(/property is required/);
      expect(paths(g.node() as SVGGElement).length).toBe(0);
    });

    test("should keep the d3 meaning of an explicit null y1", () => {
      // Only an unset property is caught. A caller who says .y1(null) is asking d3 for "no
      // upper bound", which makes it fall back to y0 - a zero-height sliver on its baseline.
      const node = render(
        stackedAreaMultiples()
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
      // a one-point layer reaches the DOM. It encloses no area, and with no default stroke
      // nothing is drawn at all.
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
      test("a datum that is not an array of layers is silently ignored", () => {
        // NOTE: the datum reaches the data join as it is, and d3 reads a plain object as an
        // array-like of length undefined, so nothing is bound and nothing is drawn. It used
        // to throw "data is not iterable", from the copy the reversal took rather than from
        // the join - a message naming neither the component nor the property. Neither
        // behaviour reports the mistake usefully; stackedArea binds the same way.
        const node = render(areaOf(), { values: oneLayer });
        expect(paths(node).length).toBe(0);
      });

      test("adopts any pre-existing path.sszvis-path in the group", () => {
        // NOTE: the join matches on the generic .sszvis-path class, which pie, stackedArea
        // and stackedPyramid also use. A path another component left in the same group is
        // bound to a layer and repainted as an area rather than being left alone. Harmless
        // while each component owns its own selectGroup, which is how every example is
        // written, and benign here because every attribute this component touches is written
        // unconditionally - an unset fill or stroke is written as a null, which d3 reads as a
        // removal, so the foreign path loses the colours it came with rather than keeping
        // them. See the same collision documented from the other side in
        // test/component/pie.test.ts, where it corrupts pie's own geometry and is labelled a
        // bug for that reason.
        const g = group("foreign");
        g.append("path").attr("class", "sszvis-path").attr("d", "M1,1").attr("fill", "#0f0");
        g.datum(oneLayer).call(staticAreaOf() as never);
        const node = g.node() as SVGGElement;
        expect(paths(node).length).toBe(1);
        expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
        expect(attrs(node, "fill")).toEqual([null]);
      });
    });
  });

  describe("transition", () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
    /**
     * Resolves once a running tween has moved `attr` off the value it started from. Tests that
     * interrupt an animation mid-flight synchronize on this rather than on a wall-clock delay,
     * which a loaded worker can overshoot past the end of the 300 ms transition.
     */
    const untilMoved = (node: Element, attr: string) =>
      new Promise<void>((resolve) => {
        const from = node.getAttribute(attr);
        const check = () => (node.getAttribute(attr) === from ? setTimeout(check, 0) : resolve());
        check();
      });

    test("should default to true", () => {
      expect(stackedAreaMultiples().transition()).toBe(true);
    });

    test("should write everything synchronously when disabled", () => {
      const node = render(areaOf().transition(false).fill("#f00").strokeWidth(3), oneLayer);
      expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
      expect(attrs(node, "fill")).toEqual(["#f00"]);
      expect(attrs(node, "stroke-width")).toEqual(["3"]);
    });

    test("should hold the old geometry and ease into the new one when enabled", async () => {
      const component = areaOf().fill("#ff0000").strokeWidth(3);
      const g = group("animated");
      g.datum(oneLayer).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,10L10,20L10,50L0,40Z"]);

      g.datum([
        [
          { x: 0, y0: 100, y1: 60 },
          { x: 10, y0: 110, y1: 70 },
        ],
      ]).call(component as never);
      // The old geometry is still on screen on the tick of the re-render.
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,60L10,70L10,110L0,100Z"]);
    });

    test("should write an entering band synchronously even when enabled", async () => {
      // Entering bands are painted directly rather than through the transition, as bar does,
      // so a freshly rendered chart is complete on the same tick instead of leaving an empty
      // path element until the first animation frame - stackedArea's own known quirk.
      const node = render(areaOf().fill("#ff0000").strokeWidth(3), oneLayer);
      expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
      expect(attrs(node, "fill")).toEqual(["#ff0000"]);
      expect(attrs(node, "stroke-width")).toEqual(["3"]);
      await settle();
      expect(ds(node)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
    });

    test("should take over an animation running on the same path", async () => {
      // The transition now carries this component's own attributes, so interrupting an
      // in-flight tween on the same node is the transition doing its job: the path lands on
      // the value this render asked for rather than freezing at whatever frame the
      // cancellation caught, which is where the dropped transition used to leave it.
      const g = group("interrupt");
      const component = areaOf();
      g.datum(oneLayer).call(component as never);
      const animating = paths(g.node() as SVGGElement)[0];
      select(animating).transition(defaultTransition()).attr("stroke-width", 20);
      await untilMoved(animating, "stroke-width");
      g.datum(oneLayer).call(component as never);
      await settle();
      expect(attrs(g.node() as SVGGElement, "stroke-width")).toEqual(["1"]);

      // With the transition disabled no transition is created at all, so an unrelated tween
      // on the same path still completes.
      const g2 = group("interrupt-off");
      const inert = staticAreaOf();
      g2.datum(oneLayer).call(inert as never);
      const running = paths(g2.node() as SVGGElement)[0];
      select(running).transition(defaultTransition()).attr("stroke-width", 20);
      await untilMoved(running, "stroke-width");
      g2.datum(oneLayer).call(inert as never);
      await settle();
      expect(attrs(g2.node() as SVGGElement, "stroke-width")).toEqual(["20"]);
    });
  });
});
