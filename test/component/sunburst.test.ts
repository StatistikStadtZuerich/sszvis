import { hierarchy, scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import sunburst from "../../src/component/sunburst.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";
import { prepareHierarchyData } from "../../src/layout/hierarchy.js";

/** The flat input rows every fixture below is built from. */
type Row = { cat: string; sub: string; value: number };

/**
 * A node as the component sees it: a d3 hierarchy node positioned by d3.partition, plus the
 * two destination fields the component writes onto it for the arc transition. x0/x1 hold the
 * position currently on screen and _x0/_x1 the one the running transition is heading for.
 * They live on the datum rather than on the component because d3 cannot interpolate an arc
 * path directly - the same arrangement pie uses for its a0/a1.
 *
 * Unlike pie's a0/a1 these are not radians: x0/x1 are positions in the angle scale's domain
 * (fractions of a turn, with the default scale) and y0/y1 positions in the radius scale's,
 * so every assertion below reads them through one of the two scales.
 *
 * The type is spelled out here instead of imported because the component also accepts
 * hand-built nodes, which no exported type describes.
 */
type Arc = {
  data: { _tag?: string; key?: string };
  depth: number;
  parent: Arc | null;
  value?: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  _x0?: number;
  _x1?: number;
};

const TWO_PI = 2 * Math.PI;

describe("component/sunburst", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "600px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  /** A fresh layer group, so each test renders into its own svg. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `sunburst-${++layerKey}`,
    }).selectGroup("sunburst");

  const render = (component: unknown, data: unknown) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * The arc path is written by an attrTween, so `d` is absent until the transition ticks.
   * Every assertion about `d` has to wait for a frame first.
   */
  const nextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  /** Waits out the 300ms default transition, so the destination angles are on screen. */
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 400));

  /**
   * The standard fixture: two categories, three leaves, prepared the way the documentation
   * example does. The component partitions it itself, always to the default [1, 1] size, so
   * the positions are fractions:
   *
   *   key   depth  x0    x1    y0    y1
   *   A     1      0     0.5   1/3   2/3
   *   A1    2      0     0.25  2/3   1
   *   A2    2      0.25  0.5   2/3   1
   *   B     1      0.5   1     1/3   2/3
   *   B1    2      0.5   1     2/3   1
   */
  const rows: Row[] = [
    { cat: "A", sub: "A1", value: 1 },
    { cat: "A", sub: "A2", value: 1 },
    { cat: "B", sub: "B1", value: 2 },
  ];

  const hierarchyOf = (data: Row[] = rows) =>
    prepareHierarchyData<Row>()
      .layer((d) => d.cat)
      .layer((d) => d.sub)
      .value((d) => d.value)
      .calculate(data);

  /**
   * A sunburst whose radius scale multiplies the partition's fractions by 300 and whose
   * centre is 10px wide, so with the fixture above the rings land on round pixel values:
   * depth 1 spans 110 to 210, depth 2 spans 210 to 310.
   */
  const sunburstOf = (fill: (key: string) => string = () => "#808080") =>
    sunburst()
      .fill(fill)
      .radiusScale((v: number) => v * 300)
      .centerRadius(10);

  const datumOf = (el: Element) => (el as unknown as { __data__: Arc }).__data__;

  const arcs = (node: Element) => [...node.querySelectorAll("path.sszvis-sunburst-arc")];
  const attrs = (node: Element, attr: string) => arcs(node).map((a) => a.getAttribute(attr));
  const keys = (node: Element) => arcs(node).map((a) => datumOf(a).data.key);
  const data = (node: Element) => arcs(node).map(datumOf);

  const anchorNodes = (node: Element) => [...node.querySelectorAll("[data-tooltip-anchor]")];
  const anchorKeys = (node: Element) => anchorNodes(node).map((a) => datumOf(a).data.key);
  const anchors = (node: Element) => anchorNodes(node).map((a) => a.getAttribute("transform"));

  /**
   * A stand-in for the root a pre-flattened node still points at. Without it a hand-built
   * node takes the component's malformed-data branch, which logs a warning and derives the
   * colour differently - see the `known quirks` test for a hierarchy that did not come from
   * sszvis.
   */
  const rootParent = (): Arc => ({
    data: { _tag: "root" },
    depth: 0,
    parent: null,
    x0: 0,
    x1: 1,
    y0: 0,
    y1: 1,
  });

  /** Parses a `translate(x,y)` transform into its two numbers. */
  const points = (node: Element) =>
    anchors(node).map((t) => {
      const [x, y] = String(t)
        .replace(/^translate\(|\)$/g, "")
        .split(",");
      return [Number(x), Number(y)] as const;
    });

  /** The radii d3's arc wrote into a path, in the order they appear. */
  const radii = (path: string) => [...path.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]));

  describe("rendering", () => {
    test("should render one classed path per node", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(arcs(node).length).toBe(5);
      for (const a of arcs(node)) expect(a.tagName).toBe("path");
    });

    test("should flatten the hierarchy depth first, parent before children", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(keys(node)).toEqual(["A", "A1", "A2", "B", "B1"]);
    });

    test("should leave the root out of the arcs", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(data(node).map((d) => d.data._tag)).toEqual([
        "branch",
        "leaf",
        "leaf",
        "branch",
        "leaf",
      ]);
    });

    test("should render nothing for an empty data array", () => {
      const node = render(sunburstOf(), []);
      expect(arcs(node).length).toBe(0);
      expect(anchorNodes(node).length).toBe(0);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = sunburstOf();
      const g = group("rerender");
      g.datum(hierarchyOf()).call(component as never);
      g.datum(hierarchyOf()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(arcs(node).length).toBe(5);
      expect(anchorNodes(node).length).toBe(6);
    });

    test("should remove arcs when the data shrinks", () => {
      const component = sunburstOf();
      const g = group("shrink");
      g.datum(hierarchyOf()).call(component as never);
      g.datum(hierarchyOf([{ cat: "A", sub: "A1", value: 1 }])).call(component as never);
      const node = g.node() as SVGGElement;
      expect(keys(node)).toEqual(["A", "A1"]);
    });

    test("should add arcs when the data grows", () => {
      const component = sunburstOf();
      const g = group("grow");
      g.datum(hierarchyOf([{ cat: "A", sub: "A1", value: 1 }])).call(component as never);
      g.datum(hierarchyOf()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(keys(node)).toEqual(["A", "A1", "A2", "B", "B1"]);
    });
  });

  describe("input data", () => {
    test("should partition a hierarchy handed to it", () => {
      // The caller only has to sum the hierarchy - prepareHierarchyData does that - and the
      // component computes the positions itself.
      const node = render(sunburstOf(), hierarchyOf());
      expect(data(node).map((d) => [d.x0, d.x1])).toEqual([
        [0, 0.5],
        [0, 0.25],
        [0.25, 0.5],
        [0.5, 1],
        [0.5, 1],
      ]);
      expect(data(node).map((d) => [d.y0, d.y1])).toEqual([
        [1 / 3, 2 / 3],
        [2 / 3, 1],
        [2 / 3, 1],
        [1 / 3, 2 / 3],
        [2 / 3, 1],
      ]);
    });

    test("should accept a pre-flattened array of nodes, as it did before v3.4.0", () => {
      // The deprecated sszvis.layout.sunburst.prepareData path: partition and flatten happen
      // outside the component, which then renders the array as it is.
      const root = hierarchyOf();
      const flattened = [...root].filter((d) => d.data._tag !== "root");
      const node = render(sunburstOf(), flattened);
      expect(arcs(node).length).toBe(5);
      // Breadth first here, since that is the order the array was built in.
      expect(keys(node)).toEqual(["A", "B", "A1", "A2", "B1"]);
    });

    test("should not re-partition a pre-flattened array", () => {
      // Positions come from whatever is on the nodes, so an array can be positioned by hand.
      // Two half-turn arcs, each spanning the full radius.
      const flat: Arc[] = [
        {
          data: { _tag: "leaf", key: "a" },
          depth: 1,
          parent: rootParent(),
          x0: 0,
          x1: 0.5,
          y0: 0,
          y1: 1,
        },
        {
          data: { _tag: "leaf", key: "b" },
          depth: 1,
          parent: rootParent(),
          x0: 0.5,
          x1: 1,
          y0: 0,
          y1: 1,
        },
      ];
      const node = render(sunburstOf(), flat);
      expect(data(node).map((d) => [d.x0, d.x1])).toEqual([
        [0, 0.5],
        [0.5, 1],
      ]);
    });
  });

  describe("angles", () => {
    test("should default to a scale turning the partition's [0, 1] into a full circle", () => {
      const component = sunburst();
      const angleScale = component.angleScale();
      expect(angleScale.domain()).toEqual([0, 1]);
      expect(angleScale.range()).toEqual([0, TWO_PI]);
    });

    test("should read the angles off x0 and x1", () => {
      // The first category covers half the total, so its arc sweeps from 0 to PI. Read here
      // through the anchor, which sits on the arc's bisector: half a turn starting at zero
      // bisects at 3 o'clock, so the anchor is due right of the centre.
      const node = render(sunburstOf(), hierarchyOf());
      const [x, y] = points(node)[1];
      expect(x).toBeCloseTo(160, 6);
      expect(y).toBeCloseTo(0, 6);
    });

    test("should accept a custom angle scale", () => {
      // Half a turn for the whole chart, so the first category's arc bisects at 45 degrees.
      const node = render(
        sunburstOf().angleScale(scaleLinear().range([0, Math.PI])),
        hierarchyOf()
      );
      const [x, y] = points(node)[1];
      expect(x).toBeCloseTo(160 * Math.cos(-Math.PI / 4), 6);
      expect(y).toBeCloseTo(160 * Math.sin(-Math.PI / 4), 6);
    });

    test("should clamp the angles into a single turn", () => {
      // A position outside the angle scale's domain extrapolates past a full turn, which a
      // custom scale or a hand-positioned array like this one can produce. Each endpoint is
      // then clamped on its own into [0, 2*PI], so the arc covers the whole circle.
      const flat: Arc[] = [
        {
          data: { _tag: "leaf", key: "a" },
          depth: 1,
          parent: rootParent(),
          x0: -1,
          x1: 2,
          y0: 0,
          y1: 1,
        },
      ];
      const node = render(sunburstOf(), flat);
      // Clamped to [0, 2*PI], the arc bisects at 6 o'clock: 160px below the centre.
      const [x, y] = points(node)[0];
      expect(x).toBeCloseTo(0, 6);
      expect(y).toBeCloseTo(160, 6);
    });
  });

  describe("radii", () => {
    test("should offset every ring by the centre radius", async () => {
      const node = render(sunburstOf(), hierarchyOf());
      await nextFrame();
      // depth 1: 10 + 300/3 to 10 + 600/3, depth 2: 10 + 600/3 to 10 + 300.
      expect(radii(attrs(node, "d")[0] ?? "")).toEqual([210, 110]);
      expect(radii(attrs(node, "d")[1] ?? "")).toEqual([310, 210]);
    });

    test("should place the anchor halfway through the ring", () => {
      const node = render(sunburstOf(), hierarchyOf());
      // depth 1 spans 110 to 210, so its anchor sits at 160 from the centre.
      expect(Math.hypot(...points(node)[1])).toBeCloseTo(160, 6);
      // depth 2 spans 210 to 310.
      expect(Math.hypot(...points(node)[3])).toBeCloseTo(260, 6);
    });

    test("should clamp a negative radius to the centre radius", () => {
      // Math.max(0, ...) on both radii, so a scale that returns negative values collapses
      // the ring onto the centre circle instead of inverting it.
      const node = render(
        sunburstOf().radiusScale(() => -100),
        hierarchyOf()
      );
      expect(Math.hypot(...points(node)[1])).toBeCloseTo(10, 6);
    });
  });

  describe("fill", () => {
    test("should colour the innermost ring with the fill accessor", () => {
      const node = render(
        sunburstOf((key) => (key === "A" ? "#ff0000" : "#0000ff")),
        hierarchyOf()
      );
      // d3's hsl round trip turns the hex into an rgb string.
      expect(attrs(node, "fill")[0]).toBe("rgb(255, 0, 0)");
      expect(attrs(node, "fill")[3]).toBe("rgb(0, 0, 255)");
    });

    test("should hand the node's key to the fill accessor, not the node", () => {
      const fill = vi.fn(() => "#808080");
      render(sunburstOf(fill), hierarchyOf([{ cat: "A", sub: "A1", value: 1 }]));
      // Once for the category's own arc, once more while colouring its child.
      expect(fill.mock.calls).toEqual([["A"], ["A"]]);
    });

    test("should lighten every further ring by 15% of its parent's lightness", () => {
      const node = render(sunburstOf(), hierarchyOf());
      // #808080 is hsl lightness 0.502; 0.502 * 1.15 is 0.577, which is rgb 147.
      expect(attrs(node, "fill")).toEqual([
        "rgb(128, 128, 128)",
        "rgb(147, 147, 147)",
        "rgb(147, 147, 147)",
        "rgb(128, 128, 128)",
        "rgb(147, 147, 147)",
      ]);
    });

    test("should compound the lightening over three rings", () => {
      const threeLayers = prepareHierarchyData<Row & { sub2: string }>()
        .layer((d) => d.cat)
        .layer((d) => d.sub)
        .layer((d) => d.sub2)
        .value((d) => d.value)
        .calculate([{ cat: "A", sub: "A1", sub2: "A1x", value: 1 }]);
      const node = render(sunburstOf(), threeLayers);
      expect(attrs(node, "fill")).toEqual([
        "rgb(128, 128, 128)",
        "rgb(147, 147, 147)",
        "rgb(169, 169, 169)",
      ]);
    });

    test("should give siblings the same colour, since it is derived from their parent's", () => {
      // A node's colour depends only on its top-level ancestor's key and on its depth, so
      // any two nodes that share both - all the children of one category, here - come out
      // identical, whatever their own keys or values.
      const node = render(sunburstOf(), hierarchyOf());
      expect(keys(node)[1]).not.toBe(keys(node)[2]);
      expect(attrs(node, "fill")[1]).toBe(attrs(node, "fill")[2]);
    });
  });

  describe("stroke", () => {
    test("should apply a white stroke by default, to separate touching arcs", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(attrs(node, "stroke")).toEqual(["white", "white", "white", "white", "white"]);
    });

    test("should apply a configured stroke", () => {
      const node = render(sunburstOf().stroke("#00f"), hierarchyOf());
      expect(new Set(attrs(node, "stroke"))).toEqual(new Set(["#00f"]));
    });

    test("should accept a stroke accessor, which receives the node", () => {
      const node = render(
        sunburstOf().stroke((d: Arc) => (d.depth === 1 ? "#f00" : "#00f")),
        hierarchyOf()
      );
      expect(attrs(node, "stroke")).toEqual(["#f00", "#00f", "#00f", "#f00", "#00f"]);
    });

    test("should draw no stroke when it is set to none", () => {
      const node = render(sunburstOf().stroke("none"), hierarchyOf());
      expect(new Set(attrs(node, "stroke"))).toEqual(new Set(["none"]));
    });
  });

  describe("tooltip anchors", () => {
    test("should render the anchor as a hidden 1x1 rect", () => {
      const node = render(sunburstOf(), hierarchyOf([{ cat: "A", sub: "A1", value: 1 }]));
      const anchor = anchorNodes(node)[1];
      expect(anchor.tagName).toBe("rect");
      expect(anchor.getAttribute("width")).toBe("1");
      expect(anchor.getAttribute("height")).toBe("1");
      expect(anchor.getAttribute("fill")).toBe("none");
      expect(anchor.getAttribute("stroke")).toBe("none");
    });

    test("should place the anchor on the arc's bisector, midway through its ring", () => {
      // B covers the second half of the circle, so it bisects at 9 o'clock, 160 out.
      const node = render(sunburstOf(), hierarchyOf());
      const [x, y] = points(node)[2];
      expect(x).toBeCloseTo(-160, 6);
      expect(y).toBeCloseTo(0, 6);
    });

    test("should position the anchors synchronously, without waiting for the transition", () => {
      const node = render(sunburstOf(), hierarchyOf());
      for (const anchor of anchors(node)) expect(anchor).not.toContain("NaN");
    });

    test("should remove anchors when the data shrinks", () => {
      const component = sunburstOf();
      const g = group("anchor-shrink");
      g.datum(hierarchyOf()).call(component as never);
      g.datum(hierarchyOf([{ cat: "A", sub: "A1", value: 1 }])).call(component as never);
      const node = g.node() as SVGGElement;
      expect(anchorNodes(node).length).toBe(3);
    });

    test("should match the arcs one to one for a pre-flattened array", () => {
      const flattened = [...hierarchyOf()].filter((d) => d.data._tag !== "root");
      const node = render(sunburstOf(), flattened);
      expect(anchorKeys(node)).toEqual(keys(node));
    });
  });

  describe("transition", () => {
    test("should schedule a d3 transition on every arc", () => {
      const node = render(sunburstOf(), hierarchyOf());
      const withState = arcs(node)[0] as SVGPathElement & { __transition?: unknown };
      expect(withState.__transition).not.toBeUndefined();
    });

    test("should record the destination angles on every datum", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(data(node).map((d) => [d._x0, d._x1])).toEqual([
        [0, 0.5],
        [0, 0.25],
        [0.25, 0.5],
        [0.5, 1],
        [0.5, 1],
      ]);
    });

    test("should start a first render already at its destination, so nothing animates in", () => {
      const node = render(sunburstOf(), hierarchyOf());
      expect(data(node).map((d) => [d.x0, d.x1])).toEqual(data(node).map((d) => [d._x0, d._x1]));
    });

    test("should carry the on-screen angles over to the new nodes", () => {
      const component = sunburstOf();
      const g = group("carry");
      g.datum(hierarchyOf()).call(component as never);
      // A1 grows from a quarter of the circle to three eighths.
      g.datum(
        hierarchyOf([
          { cat: "A", sub: "A1", value: 3 },
          { cat: "A", sub: "A2", value: 1 },
          { cat: "B", sub: "B1", value: 4 },
        ])
      ).call(component as never);
      const node = g.node() as SVGGElement;
      const a1 = data(node)[1];
      expect([a1.x0, a1.x1]).toEqual([0, 0.25]);
      expect([a1._x0, a1._x1]).toEqual([0, 0.375]);
    });

    test("should animate the arc angles from the previous values towards the new ones", async () => {
      const component = sunburstOf();
      const g = group("animate");
      g.datum(hierarchyOf()).call(component as never);
      await settle();

      g.datum(
        hierarchyOf([
          { cat: "A", sub: "A1", value: 3 },
          { cat: "A", sub: "A2", value: 1 },
          { cat: "B", sub: "B1", value: 4 },
        ])
      ).call(component as never);
      const node = g.node() as SVGGElement;
      await nextFrame();
      // Mid-flight: past the old angle, not yet at the new one.
      expect(data(node)[1].x1).toBeGreaterThan(0.25);
      expect(data(node)[1].x1).toBeLessThan(0.375);

      await settle();
      expect(data(node)[1].x1).toBeCloseTo(0.375, 6);
    });

    test("should reach the destination geometry after the transition", async () => {
      const node = render(sunburstOf(), hierarchyOf());
      await settle();
      expect(data(node).map((d) => [d.x0, d.x1])).toEqual([
        [0, 0.5],
        [0, 0.25],
        [0.25, 0.5],
        [0.5, 1],
        [0.5, 1],
      ]);
    });

    test("should match the arcs by index, not by key", () => {
      // The handover copies the on-screen angles element by element, so dropping the first
      // category makes the second one animate from where the first one was.
      const component = sunburstOf();
      const g = group("by-index");
      g.datum(hierarchyOf()).call(component as never);
      g.datum(hierarchyOf([{ cat: "B", sub: "B1", value: 1 }])).call(component as never);
      const node = g.node() as SVGGElement;
      expect(keys(node)).toEqual(["B", "B1"]);
      // B starts from A's old angles and ends up covering the whole circle.
      expect([data(node)[0].x0, data(node)[0].x1]).toEqual([0, 0.5]);
      expect([data(node)[0]._x0, data(node)[0]._x1]).toEqual([0, 1]);
    });
  });

  describe("data mutation", () => {
    test("writes two destination fields onto every node it renders", () => {
      const node = render(sunburstOf(), hierarchyOf());
      // NOTE: like pie, the component keeps no state of its own - the transition needs the
      // old and the new angles on the same object, and the only object shared between two
      // renders is the datum. x0/x1/y0/y1 come from the partition the component runs, _x0
      // and _x1 are added on top, and the tween keeps writing x0/x1 on every frame. Anything
      // that compares, hashes or serialises the hierarchy sees all of it.
      expect(Object.keys(data(node)[0]).sort()).toEqual([
        "_x0",
        "_x1",
        "children",
        "data",
        "depth",
        "height",
        "parent",
        "value",
        "x0",
        "x1",
        "y0",
        "y1",
      ]);
    });
  });

  describe("known quirks", () => {
    test("renders no path data at all until the first animation frame", async () => {
      // BUG: `d` is only ever written by the attrTween, and there is no transition property
      // to opt out of (bar and treemap have one). So a sunburst is geometrically empty on the
      // render tick: a chart serialised straight after rendering - a snapshot, an svg export
      // - comes out blank. The same holds for as long as the document is hidden, since
      // d3-timer runs on requestAnimationFrame, which browsers do not fire for a hidden tab;
      // the arcs fill in once the tab is shown again. Same defect as pie.
      // current: d is null until a frame passes. expected: the final geometry is applied
      // immediately, with the transition only interpolating on top of it.
      const node = render(sunburstOf(), hierarchyOf());
      expect(attrs(node, "d")).toEqual([null, null, null, null, null]);
      await nextFrame();
      for (const d of attrs(node, "d")) expect(d).not.toBeNull();
    });

    test("gives the root its own tooltip anchor, with no arc and no key", () => {
      // BUG: the arcs are joined to the flattened array, which drops the root, but the
      // anchors are joined to whatever datum is bound to the group - the hierarchy root.
      // d3 turns that into an array by iterating it, and a d3 hierarchy node iterates over
      // itself and all its descendants, so the root gets an anchor too. It sits in the
      // middle of the empty innermost ring, and the docs' pattern of selecting
      // `[data-tooltip-anchor]` binds a tooltip to it as well. In the docs example that
      // tooltip never becomes visible, because visibility there is driven by the panning
      // behaviour over `.sszvis-sunburst-arc` and the root has no arc - but any caller who
      // drives visibility off the anchors themselves gets a tooltip for a node whose data
      // has no `key` at all.
      // current: 6 anchors for 5 arcs, the first one being the root. expected: one anchor per
      // rendered arc.
      const node = render(sunburstOf(), hierarchyOf());
      expect(arcs(node).length).toBe(5);
      expect(anchorNodes(node).length).toBe(6);
      const root = datumOf(anchorNodes(node)[0]);
      expect(root.data._tag).toBe("root");
      expect(root.data.key).toBeUndefined();
      expect(root.depth).toBe(0);
    });

    test("orders the anchors breadth first while the arcs are depth first", () => {
      // BUG: the same root cause as the anchor above, not a second defect - the anchors are
      // iterated off the hierarchy, which yields breadth first, while the arcs are flattened
      // depth first. So anchor i and arc i are different nodes. Nothing in sszvis pairs the
      // two lists by index today, since each anchor carries its own datum, which makes this
      // latent rather than active; it does mean any index-based zip of the two is wrong.
      // current: anchors [root, A, B, A1, A2, B1] against arcs [A, A1, A2, B, B1].
      // expected: the same order in both.
      const node = render(sunburstOf(), hierarchyOf());
      expect(keys(node)).toEqual(["A", "A1", "A2", "B", "B1"]);
      expect(anchorKeys(node)).toEqual([undefined, "A", "B", "A1", "A2", "B1"]);
    });

    test("leaves the tooltip anchors one render behind the arcs", async () => {
      // BUG: the anchors are positioned from d.x0/d.x1, but at that point in the render those
      // still hold the *start* angles of the transition that was just scheduled. On a first
      // render start equals destination so it looks right; on every update the anchors stay
      // where the arcs were, and they are never repositioned when the transition finishes.
      // Tooltips on an updating sunburst therefore point at the previous layout. Same defect
      // as pie.
      // Only the angle is stale, strictly speaking: y0/y1 come from the fresh partition, so
      // an update that changes the number of layers puts the anchors at the old angle and the
      // new radius.
      // current: anchors keep the pre-update positions. expected: anchors follow the
      // destination angles (ideally the animation too).
      const component = sunburstOf();
      const g = group("stale-anchors");
      g.datum(hierarchyOf()).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      const before = points(node);

      g.datum(
        hierarchyOf([
          { cat: "A", sub: "A1", value: 7 },
          { cat: "A", sub: "A2", value: 1 },
          { cat: "B", sub: "B1", value: 1 },
        ])
      ).call(component as never);
      expect(points(node)).toEqual(before);
      await settle();
      expect(points(node)).toEqual(before);
    });

    test("skips the animation when the same hierarchy object is rendered twice", async () => {
      // BUG: the component partitions its input in place, which overwrites the x0/x1 the
      // tween had been writing - the very values the next transition is supposed to start
      // from. When the caller keeps one hierarchy in its state and re-sums it (the natural
      // shape for a chart driven by a filter or a slider), the handover then reads the new
      // positions back and start equals destination, so the arcs jump.
      // current: x0 already equals _x0 after the update. expected: the arcs animate from the
      // geometry that is on screen, as they do when a fresh hierarchy is built.
      const root = hierarchyOf([
        { cat: "A", sub: "A1", value: 1 },
        { cat: "B", sub: "B1", value: 1 },
      ]);
      const component = sunburstOf();
      const g = group("same-object");
      g.datum(root).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      expect(data(node)[0].x1).toBe(0.5);

      root.sum((n) => (n._tag !== "leaf" ? 0 : n.rootKey === "A" ? 3 : 1));
      g.datum(root).call(component as never);
      expect(data(node)[0].x1).toBe(0.75);
      expect(data(node)[0]._x1).toBe(0.75);
    });

    test("re-partitions its input, discarding any layout the caller applied", () => {
      // NOTE: partition() is called on every render of a hierarchy, with its default [1, 1]
      // size, so a caller who positioned it themselves - with a pixel-sized partition, or a
      // custom padding - silently loses that. An array input is left alone. It also means the radius scale's domain always has to be
      // expressed in fractions, which is what sunburstGetRadiusExtent returns and what makes
      // the innermost ring belong to the invisible root: with n layers the first visible ring
      // starts at 1/(n+1), not at 0.
      const node = render(sunburstOf(), hierarchyOf());
      expect(data(node)[0].y0).toBeCloseTo(1 / 3, 12);
      expect(Math.max(...data(node).map((d) => d.x1))).toBe(1);
    });

    test("never animates the colours, and cannot be told not to animate at all", async () => {
      // NOTE: fill and stroke are applied once, outside the transition, so a sunburst whose
      // colour scale changes jumps while its angles ease. Unlike bar, dot or treemap there is
      // no `transition` property either, so a caller who wants no animation at all has no way
      // to ask for one - and the arcs cannot be rendered synchronously (see above).
      const component = sunburstOf();
      const g = group("colour-jump");
      g.datum(hierarchyOf()).call(component as never);
      await settle();
      g.datum(hierarchyOf()).call(component.fill(() => "#ff0000") as never);
      expect(attrs(g.node() as SVGGElement, "fill")[0]).toBe("rgb(255, 0, 0)");
    });

    test("requires fill to be a function, and throws on a constant colour", () => {
      // BUG: fill is neither wrapped in fn.functor nor normalised in the renderer, so
      // `.fill("#f00")` throws `props.fill is not a function` - and so does leaving it unset.
      // stroke on the same component does take a constant, and so do pie's and dot's fills,
      // which are unwrapped too but are normalised where they are used. treemap and pack
      // share sunburst's shape for their colorScale, so all three reject a constant. The
      // JSDoc does mark the difference - `{Function} fill` against `{Color, Function} stroke`
      // - without saying that violating it throws.
      // current: TypeError on any non-function fill. expected: one rule for colour
      // properties, as pie and dot have.
      const constant = group("constant-fill");
      expect(() =>
        constant.datum(hierarchyOf()).call(
          sunburst()
            .fill("#f00")
            .radiusScale((v: number) => v)
            .centerRadius(0) as never
        )
      ).toThrow(TypeError);
      constant.selectAll("*").interrupt();

      const unset = group("unset-fill");
      expect(() =>
        unset.datum(hierarchyOf()).call(
          sunburst()
            .radiusScale((v: number) => v)
            .centerRadius(0) as never
        )
      ).toThrow(TypeError);
      unset.selectAll("*").interrupt();
    });

    test("throws from the tooltip anchor when radiusScale was never set", () => {
      // BUG: radiusScale is required and unchecked. The first thing to call it is the tooltip
      // anchor's position accessor, so the render throws after the arcs have already been
      // joined and a transition has been scheduled on them - and that transition then throws
      // the same TypeError on every frame for 300ms, from a d3 timer with no caller left to
      // catch it. Without the interrupt below those become unhandled errors attributed to
      // whichever test happens to be running when they fire.
      // current: a TypeError from inside the component, then a burst of unhandled ones.
      // expected: a logger.warn about the missing property, like the one for malformed data.
      const g = group("no-radius-scale");
      expect(() => g.datum(hierarchyOf()).call(sunburst().fill(() => "#f00") as never)).toThrow(
        TypeError
      );
      expect(arcs(g.node() as SVGGElement).length).toBe(5);
      g.selectAll("*").interrupt();
    });

    test("positions the anchors at NaN when centerRadius was never set", async () => {
      // BUG: centerRadius is required too, but it is only ever added to a number, so it fails
      // silently rather than throwing the way a missing radiusScale does: `undefined + 100` is
      // NaN, so the arcs degenerate to a point and every anchor keeps an unparseable
      // transform, which the browser drops - leaving them all at the group's origin, the
      // centre of the chart under the docs' convention of translating the group there.
      // current: an empty chart and every tooltip firing from one point, no warning.
      // expected: a warning, or a default of 0.
      const node = render(
        sunburst()
          .fill(() => "#f00")
          .radiusScale((v: number) => v * 300),
        hierarchyOf()
      );
      expect(new Set(anchors(node))).toEqual(new Set(["translate(NaN,NaN)"]));
      const anchor = anchorNodes(node)[0] as SVGRectElement;
      expect(anchor.transform.baseVal.numberOfItems).toBe(0);
      await nextFrame();
      expect(new Set(attrs(node, "d"))).toEqual(new Set(["M0,0Z"]));
    });

    test("renders an arc for the root of a hierarchy that did not come from sszvis", () => {
      // BUG: both the root check and the colour recursion key off `data._tag`, which only
      // prepareHierarchyData sets. A plain d3.hierarchy therefore keeps its root in the
      // flattened array and draws it as a full-circle arc under the first ring, and the colour
      // of every node is derived from the *root's* key rather than from its own top-level
      // category - so a chart built this way comes out in a single hue. The component does
      // warn, once per node, but renders anyway.
      // current: an extra arc plus single-hue colouring. expected: the same treatment as a
      // prepared hierarchy, or a refusal to render.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const plain = hierarchy<{ key: string; value?: number; children?: unknown[] }>({
        key: "total",
        children: [
          { key: "x", value: 1 },
          { key: "y", value: 1 },
        ],
      }).sum((d) => d.value ?? 0);
      const node = render(
        sunburstOf((key) => (key === "total" ? "#808080" : "#ff0000")),
        plain
      );
      expect(keys(node)).toEqual(["total", "x", "y"]);
      expect(attrs(node, "fill")).toEqual([
        "rgb(128, 128, 128)",
        "rgb(147, 147, 147)",
        "rgb(147, 147, 147)",
      ]);
      expect(warn).toHaveBeenCalledTimes(3);
    });

    test("washes deep rings out to white, since the lightness is never clamped", () => {
      // NOTE: each ring multiplies its parent's lightness by 1.15, so the colours run towards
      // white from the inside out - a five-layer chart built on a mid-tone starts at lightness
      // 0.5 and ends past 0.87. A light starting colour tips over 1 on the very first step,
      // and from there every further ring is pure white and indistinguishable from the one
      // inside it, since nothing clamps the lightness before it saturates.
      const node = render(
        sunburstOf(() => "#eeeeee"),
        hierarchyOf()
      );
      expect(attrs(node, "fill")[0]).toBe("rgb(238, 238, 238)");
      expect(attrs(node, "fill")[1]).toBe("rgb(255, 255, 255)");
    });

    test("keeps a zero-value node in the DOM as a degenerate arc", async () => {
      // NOTE: a category with no value gets x0 === x1 and is drawn as a zero-width sliver - a
      // straight line out from the centre. Consistent with pie, which keeps its zero-width
      // wedges too, but worth knowing because the element stays in the DOM: it is a
      // `.sszvis-sunburst-arc` like any other, so it is a panning target with no hit area, it
      // gets its own tooltip anchor, and a non-default stroke draws it as a visible hairline.
      const node = render(
        sunburstOf(),
        hierarchyOf([
          { cat: "A", sub: "A1", value: 0 },
          { cat: "B", sub: "B1", value: 1 },
        ])
      );
      await nextFrame();
      expect(data(node)[0].x0).toBe(data(node)[0].x1);
      expect(attrs(node, "d")[0]).toBe("M0,-210L0,-110Z");
    });

    test("pops new arcs in at their final angle instead of growing them", () => {
      // NOTE: the handover only reaches arcs that already existed, so an arc past the previous
      // element count keeps the angles the partition just gave it and starts at its
      // destination, while its neighbours ease into place. Exits are worse: the join removes
      // them immediately, with no exit transition. Both follow from how the angle bookkeeping
      // works - pie behaves the same way - but the result is a chart whose arcs animate
      // differently depending on whether they existed a render ago.
      const component = sunburstOf();
      const g = group("enter");
      g.datum(hierarchyOf([{ cat: "A", sub: "A1", value: 1 }])).call(component as never);
      g.datum(hierarchyOf()).call(component as never);
      const node = g.node() as SVGGElement;
      // The two arcs that were already there animate...
      expect(
        data(node)
          .slice(0, 2)
          .map((d) => [d.x1, d._x1])
      ).toEqual([
        [1, 0.5],
        [1, 0.25],
      ]);
      // ...while the three new ones are already where they are going.
      for (const d of data(node).slice(2)) {
        expect([d.x0, d.x1]).toEqual([d._x0, d._x1]);
      }
    });

    test("eases the angles but snaps the radii, since only x is tweened", async () => {
      // NOTE: the tween interpolates x0/x1 only, and the arc generator reads the radii from
      // the current props on every frame, so a render that changes the radius scale puts the
      // new radii on screen immediately while the angles are still moving. The docs rebuild
      // the radius scale on every resize, which is when a caller would notice.
      const component = sunburstOf();
      const g = group("radius-snap");
      g.datum(hierarchyOf()).call(component as never);
      await settle();

      g.datum(
        hierarchyOf([
          { cat: "A", sub: "A1", value: 3 },
          { cat: "A", sub: "A2", value: 1 },
          { cat: "B", sub: "B1", value: 4 },
        ])
      ).call(component.radiusScale((v: number) => v * 600) as never);
      const node = g.node() as SVGGElement;
      await nextFrame();
      // The doubled radii are already final on the first frame...
      expect(radii(attrs(node, "d")[0] ?? "")).toEqual([410, 210]);
      // ...while the angle of the same arc is still on its way from 0.5 to 0.5 - unchanged
      // here - and its child's from 0.25 to 0.375.
      expect(data(node)[1].x1).toBeGreaterThan(0.25);
      expect(data(node)[1].x1).toBeLessThan(0.375);
    });

    test("draws an arc backwards when its start is past its end", async () => {
      // NOTE: the two endpoints are clamped independently and never compared, so a node whose
      // x1 is smaller than its x0 sweeps the other way round, over its neighbours, instead of
      // being rejected or normalised. Only reachable with a hand-positioned array or a
      // decreasing angle scale, but it fails silently: the arc is drawn, and its tooltip
      // anchor lands on the bisector of everything the arc does *not* cover - here 12
      // o'clock, opposite the 6 o'clock of the same span read forwards.
      const flat: Arc[] = [
        {
          data: { _tag: "leaf", key: "a" },
          depth: 1,
          parent: rootParent(),
          x0: 0.75,
          x1: 0.25,
          y0: 0,
          y1: 1,
        },
      ];
      const node = render(sunburstOf(), flat);
      const [x, y] = points(node)[0];
      expect(x).toBeCloseTo(0, 6);
      expect(y).toBeCloseTo(-160, 6);
      await nextFrame();
      expect(attrs(node, "d")[0]).not.toBeNull();
    });

    test("requires mutable data, and throws on anything frozen", () => {
      // NOTE: `d._x0 = d.x0` on a non-extensible object throws in strict mode, which all ESM
      // is, so the whole render dies on Object.freeze'd data. sszvis already lives with this:
      // src/app.js calls immer's setAutoFreeze(false) with the comment "d3 mutates state in
      // many places, which is why we have to turn this off", so app state stays writable. Data
      // from anywhere else - a frozen fixture, a library that freezes its output - is a
      // caller-visible constraint that no JSDoc mentions. Same as pie.
      const frozen = [
        Object.freeze({
          data: { _tag: "leaf", key: "a" },
          depth: 1,
          parent: rootParent(),
          x0: 0,
          x1: 1,
          y0: 0,
          y1: 1,
        }),
      ];
      expect(() => render(sunburstOf(), frozen)).toThrow(TypeError);
    });

    test("throws outright when a stray arc path has no datum bound", () => {
      // BUG: the handover reads the old angles off every existing `.sszvis-sunburst-arc` in
      // the group before the data join can replace them. A path inserted without d3 - by
      // another library, or by hand - has no __data__ at all, and `d.x0` throws on undefined.
      // The same defect as pie's, one class name over, but far less exposed: pie matches the
      // shared `.sszvis-path`, which stackedArea and stackedPyramid also use, while
      // `.sszvis-sunburst-arc` belongs to this component alone.
      // current: TypeError from inside the component. expected: strays are ignored.
      const g = group("stray");
      const node = g.node() as SVGGElement;
      const stray = document.createElementNS("http://www.w3.org/2000/svg", "path");
      stray.setAttribute("class", "sszvis-sunburst-arc");
      node.appendChild(stray);
      expect(() => g.datum(hierarchyOf()).call(sunburstOf() as never)).toThrow(TypeError);
      g.selectAll("*").interrupt();
    });
  });
});
