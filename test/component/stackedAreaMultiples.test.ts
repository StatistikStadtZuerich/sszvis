import { select, stack } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
   * Unlike stackedArea, this component writes every visual property to the plain selection
   * whether the transition is on or off, so there is nothing to disable in order to observe
   * the output synchronously. See the transition block at the bottom of this file.
   */
  const areaOf = () =>
    stackedAreaMultiples()
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
      // Each multiple is drawn from its own points only; the paths are emitted back to
      // front, which the layer order block below covers.
      expect(ds(render(areaOf(), twoLayers))).toEqual([secondLayerPath, firstLayerPath]);
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
      // Series "b" comes first in the DOM, because the layers are reversed before the join.
      expect(ds(node)).toEqual(["M0,3L10,7L10,3L0,1Z", "M0,1L10,3L10,0L0,0Z"]);
      expect(attrs(node, "fill")).toEqual(["#00f", "#f00"]);
    });
  });

  describe("layer order", () => {
    test("should not mutate the array it was given", () => {
      // The reversal is taken on a copy, so a caller holding on to the same array - as the
      // docs example does, rendering the stacked and the separated view from one datum -
      // sees it unchanged.
      const data = [twoLayers[0], twoLayers[1]];
      render(areaOf(), data);
      expect(data).toEqual([twoLayers[0], twoLayers[1]]);
      expect(data[0]).toBe(twoLayers[0]);
    });

    test("should follow the data order when the layers are reordered", () => {
      // .join() orders the merged selection for free, so the paint order follows the
      // (reversed) data even when the nodes are reused.
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("order");
      g.datum(twoLayers).call(component as never);
      g.datum([twoLayers[1], twoLayers[0]]).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);
    });

    describe("known quirks", () => {
      test("the layers are reversed before the join, so the first one is painted last", () => {
        // BUG: the component reverses its data with no stated reason - the line carries an
        // unanswered "//sszsch why reverse?" comment from 2017 - and neither the JSDoc header,
        // docs/area-chart-stacked/README.md nor stackedAreaMultiplesLayout, which lays the
        // bands out, mentions it. stackedArea, which this
        // component is otherwise a copy of, does not reverse, so the same datum produces the
        // opposite DOM order in the two components, and a chart toggling between the stacked
        // and the separated view reorders every path on the switch. Later siblings paint
        // over earlier ones in SVG, so this also inverts which layer wins an overlap.
        // current: the last layer of the input is the first child. expected: the DOM order
        // follows the input, as in stackedArea.
        const node = render(areaOf(), twoLayers);
        expect(ds(node)).toEqual([secondLayerPath, firstLayerPath]);
        expect(paths(node).at(-1)?.getAttribute("d")).toBe(firstLayerPath);
      });

      test("the reversal renumbers the layers, so every index accessor is mirrored", () => {
        // NOTE: the consequence of the above for callers. The index handed to the style
        // accessors, to the key function and to valuesAccessor is the position in the
        // reversed array, so `fill((_d, i) => colours[i])` - the shorthand the examples avoid
        // only because they key off the layer's own name - assigns the palette back to front
        // here and front to back in stackedArea.
        const seen: [Layer, number][] = [];
        const node = render(
          areaOf().fill((d: Layer, i: number) => {
            seen.push([d, i]);
            return i === 0 ? "#f00" : "#00f";
          }),
          twoLayers
        );
        expect(seen).toEqual([
          [twoLayers[1], 0],
          [twoLayers[0], 1],
        ]);
        // The first colour of the palette lands on the last layer of the input.
        expect(attrs(node, "fill")).toEqual(["#f00", "#00f"]);
        expect(ds(node)).toEqual([secondLayerPath, firstLayerPath]);
      });

      test("the default key numbers the layers from the other end", () => {
        // NOTE: the default key is the index, which is the mirrored index here, so dropping
        // the *last* layer of the input reuses the first node and rebinds it to a different
        // layer. stackedArea's default key drops the last node instead. Only matters when
        // the key is left unset, which the JSDoc already warns against for charts that
        // transition between the two views.
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

    describe("known quirks", () => {
      test("the switch reorders every path, because only one of the two reverses", async () => {
        // NOTE: the consequence of the reversal for the only in-repo caller. The same datum,
        // keyed the same way, comes out in opposite DOM order from the two components, so
        // toggling the view moves both nodes even though neither the data nor the keys
        // changed. Invisible in sa-two.js, where the bands never overlap, but it is churn
        // that no property asked for.
        const g = group("toggle-order");
        g.datum(twoLayers).call(stackedView() as never);
        await settle();
        const stacked = paths(g.node() as SVGGElement);
        expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);

        g.datum(twoLayers).call(separatedView() as never);
        const separated = paths(g.node() as SVGGElement);
        expect(separated[0]).toBe(stacked[1]);
        expect(separated[1]).toBe(stacked[0]);
      });

      test("the switch into the separated view snaps, and the switch back eases", async () => {
        // BUG: the two halves of the toggle the JSDoc's key property exists for behave
        // differently, because stackedArea routes its attributes through the transition and
        // this component does not. Going separated, the new geometry is on screen on the same
        // tick; coming back, the old geometry holds and interpolates over 300ms. The chart
        // animates in one direction only.
        // current: an instant jump into the separated view. expected: both directions ease,
        // as they did before the transition was left unassigned.
        const g = group("toggle-timing");
        g.datum(twoLayers).call(stackedView() as never);
        await settle();

        g.datum(twoLayers).call(separatedView() as never);
        expect(ds(g.node() as SVGGElement)).toEqual([secondSeparated, firstSeparated]);

        g.datum(twoLayers).call(stackedView() as never);
        // Still the separated geometry, in the order the stacked view puts it in.
        expect(ds(g.node() as SVGGElement)).toEqual([firstSeparated, secondSeparated]);
        await settle();
        expect(ds(g.node() as SVGGElement)).toEqual([firstLayerPath, secondLayerPath]);
      });
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
      expect(seen.map((args) => args[0])).toEqual([twoLayers[1], twoLayers[0]]);
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
      expect(ds(node)).toEqual([secondLayerPath, firstLayerPath]);
    });

    test("should combine with style accessors reading the wrapper", () => {
      const node = render(
        areaOf()
          .valuesAccessor((d: NamedLayer) => d.values)
          .key((d: NamedLayer) => d.name)
          .fill((d: NamedLayer) => (d.name === "first" ? "#f00" : "#00f")),
        named
      );
      expect(attrs(node, "fill")).toEqual(["#00f", "#f00"]);
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
      expect(seen.map((args) => args[0])).toEqual([twoLayers[1], twoLayers[0]]);
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
      expect(attrs(node, "fill")).toEqual(["#00f", "#f00"]);
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
      expect(attrs(node, "stroke")).toEqual(["#00f", "#f00"]);
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

    describe("known quirks", () => {
      test("the default predicate never rejects anything, so NaN reaches the path", () => {
        // BUG: the default is built as
        //   function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }
        // which returns a *function* rather than calling either of them, and && between two
        // functions yields the second one. d3 only tests the return value for truthiness,
        // so the guard is dead: every point is considered defined, whatever its value. The
        // intent was `d => !isNaN(y0(d)) && !isNaN(y1(d))`. src/component/line.ts guards both
        // of its dimensions by hand, with fn.isMissingVal, and works. stackedArea behaves
        // identically, though its port spells the dead predicate out as `() => true` and
        // documents it; docs/area-chart-stacked/README.md still describes the default of both
        // components as "y0 and y1 are not NaN".
        // current: NaN is written into the d attribute verbatim. expected: the point is
        // skipped and the area breaks, as it does when defined is set explicitly above.
        const node = render(areaOf(), withGap);
        expect(ds(node)).toEqual(["M0,10L10,NaNL20,30L20,60L10,50L0,40Z"]);
      });

      test("a NaN in the path truncates the rendered shape without any error", () => {
        // BUG: the visible consequence of the dead guard. The browser stops rendering at the
        // invalid command, so only the leading moveto survives and the multiple disappears
        // entirely - one missing value costs the whole band, not just the segment it belongs
        // to. Compare the explicit-predicate case above, where the healthy tail survives as
        // its own subpath.
        const node = render(areaOf(), withGap);
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
        // to the top of the chart. Neither is reported.
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
        // NOTE: the JSDoc header omits the property, and the README describes a default guard
        // that never runs, so the one thing that makes the difference between a broken path and
        // a broken band is documented as unnecessary. It also has to guard both bounds by hand,
        // since defined replaces the dead default rather than composing with it.
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
    test("should preserve object constancy when a key is given", () => {
      const component = areaOf().key((d: Layer) => d[0].y1);
      const g = group("keyed");
      g.datum(twoLayers).call(component as never);
      const before = paths(g.node() as SVGGElement);
      // Only the layer keyed 60 survives, and it must reuse the node it already had - the
      // second one, because the layers were reversed.
      g.datum([twoLayers[0]]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[1]);
    });

    test("should hand the node group to the key when it runs over the existing paths", () => {
      // The key runs once for each half of the join. Over the nodes already in the DOM it is
      // called with the node as `this` and d3's group of nodes as the third argument; over
      // the incoming layers it gets the parent as `this` and the array of layers. The node
      // group is in the reversed order the previous render left it in, so the two halves
      // agree only because the reversal is applied on every render.
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
      expect(seen[2].group).toEqual([twoLayers[1], twoLayers[0]]);
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
      // The array it is given is the reversed copy, not the caller's array.
      expect(seen.map((args) => args[0])).toEqual([twoLayers[1], twoLayers[0]]);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);
      expect(seen[0][2]).toEqual([twoLayers[1], twoLayers[0]]);
      expect(seen[0][2]).not.toBe(twoLayers);
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
          stackedAreaMultiples()
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
          stackedAreaMultiples()
            .x((d: Point) => d.x)
            .y1((d: Point) => d.y1),
          oneLayer
        );
        expect(ds(node)).toEqual(["M0,10L10,20L10,NaNL0,NaNZ"]);
      });

      test("omitting y1 collapses every area onto its own baseline", () => {
        // BUG: the worst of the three, because it renders successfully. area.y1(undefined)
        // is read by d3 as "no upper bound", which makes it fall back to y0 - so the top
        // line and the baseline coincide and each band becomes a zero-height sliver. With no
        // default stroke to draw it, the chart is blank rather than merely wrong.
        const node = render(
          stackedAreaMultiples()
            .x((d: Point) => d.x)
            .y0((d: Point) => d.y0),
          oneLayer
        );
        expect(ds(node)).toEqual(["M0,40L10,50L10,50L0,40Z"]);
      });

      test("a component with no props at all still renders a path per layer", () => {
        // BUG: same root cause as the three above, combined into one silent empty chart. The
        // DOM says the render succeeded - the paths are there, classed and sized - while the
        // geometry is entirely NaN and neither a fill nor a stroke was written.
        const node = render(stackedAreaMultiples(), twoLayers);
        expect(paths(node).length).toBe(2);
        expect(attrs(node, "fill")).toEqual([null, null]);
        expect(attrs(node, "stroke")).toEqual([null, null]);
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
      test("a datum that is not iterable throws before the join", () => {
        // NOTE: the reversal spreads the datum, so binding anything that is not iterable
        // fails with "data is not iterable" from the component rather than from the data
        // join. The message names neither the component nor the property.
        expect(() => render(areaOf(), { values: oneLayer })).toThrow(TypeError);
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
        g.datum(oneLayer).call(areaOf() as never);
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

    describe("known quirks", () => {
      test("nothing is animated when the transition is enabled", () => {
        // BUG: the transition is created on its own statement and the return value is
        // dropped -
        //   if (props.transition) { paths.transition(defaultTransition()); }
        //   paths.attr("d", ...)
        // - so every attribute is written to the plain selection and the transition it
        // schedules carries no tweens. It did animate until 47f58578 ("perf: change .enter() to
        // .join() API", Oct 2024), which dropped the `paths =` the transition used to be
        // assigned back to and left the call as dead code. Its JSDoc sells key as
        // "particularly important when creating a chart which transitions between stacked and
        // separated views", and that is the half of the toggle that no longer eases: in
        // docs/area-chart-stacked/sa-two.js the switch into the separated view snaps, while the
        // switch back, drawn by stackedArea, still eases. bar carries the same
        // discarded-transition shape, though it writes its attributes before creating the
        // transition too, so its elements are never blank.
        // current: the new geometry is on screen on the same tick. expected: the old
        // geometry holds and eases to the new one over 300ms.
        const component = areaOf().fill("#ff0000").strokeWidth(3);
        const g = group("animated");
        g.datum(oneLayer).call(component as never);
        // An entering layer is complete immediately, where stackedArea leaves an empty path.
        expect(ds(g.node() as SVGGElement)).toEqual(["M0,10L10,20L10,50L0,40Z"]);
        expect(attrs(g.node() as SVGGElement, "fill")).toEqual(["#ff0000"]);
        expect(attrs(g.node() as SVGGElement, "stroke-width")).toEqual(["3"]);

        g.datum([
          [
            { x: 0, y0: 100, y1: 60 },
            { x: 10, y0: 110, y1: 70 },
          ],
        ]).call(component as never);
        expect(ds(g.node() as SVGGElement)).toEqual(["M0,60L10,70L10,110L0,100Z"]);
      });

      test("enabling the transition changes nothing about the output", async () => {
        // NOTE: the same assertion from the caller's side - the property is inert, so the
        // two settings are indistinguishable in the DOM, before and after the 300ms the
        // transition would have taken.
        const on = group("inert-on");
        const off = group("inert-off");
        on.datum(oneLayer).call(areaOf().fill("#f00").strokeWidth(3) as never);
        off.datum(oneLayer).call(areaOf().transition(false).fill("#f00").strokeWidth(3) as never);
        const snapshot = (g: SVGGElement) => [ds(g), attrs(g, "fill"), attrs(g, "stroke-width")];
        expect(snapshot(on.node() as SVGGElement)).toEqual(snapshot(off.node() as SVGGElement));
        await settle();
        expect(snapshot(on.node() as SVGGElement)).toEqual(snapshot(off.node() as SVGGElement));
      });

      test("the empty transition still cancels an animation another component started", async () => {
        // BUG: the discarded transition is scheduled all the same, and a d3 transition
        // interrupts any unnamed transition already running on the same node when it starts.
        // So the property animates nothing of its own while stopping anything else mid-flight
        // - here an external tween on the same path, frozen at whatever value the frame it
        // was cancelled on had reached instead of arriving at 20. With transition disabled no
        // transition is created and the tween completes.
        // current: an in-flight animation on an adopted or shared path dies on the next
        // render. expected: either the transition carries this component's attributes, or no
        // transition is created at all.
        const g = group("interrupt");
        const component = areaOf();
        g.datum(oneLayer).call(component as never);
        const animating = paths(g.node() as SVGGElement)[0];
        select(animating).transition(defaultTransition()).attr("stroke-width", 20);
        await untilMoved(animating, "stroke-width");
        g.datum(oneLayer).call(component as never);
        await settle();
        const frozen = Number(attrs(g.node() as SVGGElement, "stroke-width")[0]);
        expect(frozen).toBeGreaterThan(1);
        expect(frozen).toBeLessThan(20);

        const g2 = group("interrupt-off");
        const inert = areaOf().transition(false);
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
});
