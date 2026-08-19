import { afterEach, beforeEach, describe, expect, test } from "vitest";
// @ts-expect-error - pie.js has no type declarations until it is ported
import pie from "../../src/component/pie.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

/**
 * The four angle fields the component writes onto every datum it renders. a0/a1 are the
 * angles currently on screen, _a0/_a1 the destination angles of the transition. They are
 * part of the datum, not of the component, because d3 cannot interpolate an arc path
 * directly - see the comments in pie.js.
 */
type Angles = { a0?: number; a1?: number; _a0?: number; _a1?: number };
type Datum = { value: number; color?: string } & Angles;

const TAU = 2 * Math.PI;

describe("component/pie", () => {
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

  /** A fresh layer group, so each test renders into its own svg. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `pie-${++layerKey}`,
    }).selectGroup("pie");

  const render = (component: unknown, data: unknown[]) =>
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

  const testData = (): Datum[] => [
    { value: 1, color: "#f00" },
    { value: 3, color: "#0f0" },
  ];

  /** A pie whose wedges are `value` radians wide, so the angles are easy to read. */
  const pieOf = (radius = 100) =>
    pie()
      .radius(radius)
      .angle((d: Datum) => d.value)
      .fill((d: Datum) => d.color);

  const wedges = (node: Element) => [...node.querySelectorAll("path.sszvis-path")];
  const attrs = (node: Element, attr: string) => wedges(node).map((w) => w.getAttribute(attr));
  const anchorNodes = (node: Element) => [...node.querySelectorAll("[data-tooltip-anchor]")];
  const anchors = (node: Element) => anchorNodes(node).map((a) => a.getAttribute("transform"));

  /** Parses a `translate(x,y)` transform into its two numbers. */
  const points = (node: Element) =>
    anchors(node).map((t) => {
      const [x, y] = String(t)
        .replace(/^translate\(|\)$/g, "")
        .split(",");
      return [Number(x), Number(y)] as const;
    });

  describe("rendering", () => {
    test("should render one classed path per datum", () => {
      const node = render(pieOf(), testData());
      expect(wedges(node).length).toBe(2);
      for (const w of wedges(node)) expect(w.tagName).toBe("path");
    });

    test("should offset every wedge by the radius, so the pie sits in a radius-sized box", () => {
      const node = render(pieOf(80), testData());
      expect(attrs(node, "transform")).toEqual(["translate(80,80)", "translate(80,80)"]);
    });

    test("should take the fill from the accessor", () => {
      const node = render(pieOf(), testData());
      expect(attrs(node, "fill")).toEqual(["#f00", "#0f0"]);
    });

    test("should accept a constant fill", () => {
      const node = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .fill("#abc"),
        [{ value: 1 }, { value: 2 }]
      );
      expect(attrs(node, "fill")).toEqual(["#abc", "#abc"]);
    });

    test("should pass the index to the fill accessor, as any d3 attr callback does", () => {
      const node = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .fill((_d: Datum, i: number) => (i === 0 ? "#111" : "#222")),
        [{ value: 1 }, { value: 2 }]
      );
      expect(attrs(node, "fill")).toEqual(["#111", "#222"]);
    });

    test("should omit the fill attribute when fill is not configured", () => {
      // The wedges then fall back to the SVG default, black, as the JSDoc says.
      const node = render(
        pie()
          .radius(50)
          .angle(() => 1),
        [{ value: 1 }]
      );
      expect(attrs(node, "fill")).toEqual([null]);
    });

    test("should apply a white stroke by default, to separate touching wedges", () => {
      const node = render(pieOf(), testData());
      expect(attrs(node, "stroke")).toEqual(["#FFFFFF", "#FFFFFF"]);
    });

    test("should apply a configured stroke", () => {
      const node = render(pieOf().stroke("#00f"), testData());
      expect(attrs(node, "stroke")).toEqual(["#00f", "#00f"]);
    });

    test("should accept a stroke accessor", () => {
      const node = render(
        pieOf().stroke((d: Datum) => d.color),
        testData()
      );
      expect(attrs(node, "stroke")).toEqual(["#f00", "#0f0"]);
    });

    test("should draw no stroke when it is set to none", () => {
      const node = render(pieOf().stroke("none"), [{ value: 1 }]);
      expect(attrs(node, "stroke")).toEqual(["none"]);
    });

    test("should render nothing for an empty data array", () => {
      const node = render(pieOf(), []);
      expect(wedges(node).length).toBe(0);
      expect(anchors(node)).toEqual([]);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = pieOf();
      const g = group("rerender");
      g.datum(testData()).call(component as never);
      g.datum(testData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(wedges(node).length).toBe(2);
      expect(anchorNodes(node).length).toBe(2);
    });

    test("should remove wedges and anchors when the data shrinks", () => {
      const component = pieOf();
      const g = group("shrink");
      g.datum(testData()).call(component as never);
      g.datum([{ value: 1 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(wedges(node).length).toBe(1);
      expect(anchorNodes(node).length).toBe(1);
    });

    test("should add wedges and anchors when the data grows", () => {
      const component = pieOf();
      const g = group("grow");
      g.datum([{ value: 1 }]).call(component as never);
      g.datum([{ value: 1 }, { value: 2 }, { value: 3 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(wedges(node).length).toBe(3);
      expect(anchorNodes(node).length).toBe(3);
    });

    test("should rebind the group's datum to the rendered data", () => {
      // The tooltip anchors are rendered by calling the anchor component on the group
      // itself, which requires the data to be bound there. It stays bound afterwards, so
      // anything appended to the group later inherits the pie's data array.
      const data = testData();
      const g = group("datum");
      g.datum(data).call(pieOf() as never);
      expect(g.datum()).toBe(data);
    });
  });

  describe("angles", () => {
    test("should lay the wedges out cumulatively, starting at zero", () => {
      const data = testData();
      render(pieOf(), data);
      expect(data.map((d) => [d._a0, d._a1])).toEqual([
        [0, 1],
        [1, 4],
      ]);
    });

    test("should close the circle when the angles sum to a full turn", () => {
      const data: Datum[] = [{ value: TAU / 4 }, { value: TAU / 4 }, { value: TAU / 2 }];
      render(pieOf(), data);
      expect(data.at(-1)?._a1).toBeCloseTo(TAU, 10);
    });

    test("should accept a constant angle, which fn.functor wraps", () => {
      const data: Datum[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
      render(
        pie()
          .radius(50)
          .angle(Math.PI / 4)
          .fill("#000"),
        data
      );
      expect(data.map((d) => d._a1)).toEqual([Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]);
    });

    test("should start a first render already at its destination, so nothing animates in", () => {
      const data = testData();
      render(pieOf(), data);
      expect(data.map((d) => [d.a0, d.a1])).toEqual(data.map((d) => [d._a0, d._a1]));
    });

    test("should keep a zero-width wedge in the DOM", async () => {
      const data: Datum[] = [{ value: 0 }, { value: TAU }];
      const node = render(pieOf(), data);
      await nextFrame();
      expect(wedges(node).length).toBe(2);
      expect(data[0]._a0).toBe(data[0]._a1);
      expect(wedges(node)[0].getAttribute("d")).not.toBeNull();
    });
  });

  describe("arc geometry", () => {
    test("should draw an arc at the configured radius once the transition ticks", async () => {
      const node = render(pieOf(100), testData());
      await nextFrame();
      // The first wedge starts at 12 o'clock, since d3's arc applies its own -PI/2 turn.
      expect(wedges(node)[0].getAttribute("d")).toMatch(/^M0,-100A100,100/);
    });

    test("should punch a fixed 4px hole in the middle of the pie", async () => {
      const node = render(pieOf(100), testData());
      await nextFrame();
      // innerRadius is hardcoded to 4 and cannot be configured.
      for (const d of attrs(node, "d")) expect(d).toContain("A4,4");
    });

    test("should reach the destination geometry after the transition", async () => {
      const data = testData();
      const g = group("destination");
      g.datum(data).call(pieOf() as never);
      await settle();
      expect(data.map((d) => [d.a0, d.a1])).toEqual([
        [0, 1],
        [1, 4],
      ]);
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per datum", () => {
      const node = render(pieOf(), testData());
      expect(anchorNodes(node).length).toBe(2);
    });

    test("should render the anchor as a hidden 1x1 rect", () => {
      const node = render(pieOf(), [{ value: 1 }]);
      const anchor = anchorNodes(node)[0];
      expect(anchor.tagName).toBe("rect");
      expect(anchor.getAttribute("width")).toBe("1");
      expect(anchor.getAttribute("height")).toBe("1");
      expect(anchor.getAttribute("fill")).toBe("none");
      expect(anchor.getAttribute("stroke")).toBe("none");
    });

    test("should place the anchor two thirds out along the wedge's bisector", () => {
      // Two half-circle wedges of a radius-90 pie: the first bisects at 3 o'clock, the
      // second at 9 o'clock, both at 2/3 * 90 = 60 from the centre at (90, 90).
      const node = render(
        pie()
          .radius(90)
          .angle(() => Math.PI)
          .fill("#000"),
        [{ value: 1 }, { value: 1 }]
      );
      const [first, second] = points(node);
      expect(first[0]).toBeCloseTo(150, 6);
      expect(first[1]).toBeCloseTo(90, 6);
      expect(second[0]).toBeCloseTo(30, 6);
      expect(second[1]).toBeCloseTo(90, 6);
    });

    test("should place a wedge that starts at twelve o'clock above the centre", () => {
      const node = render(
        pie()
          .radius(60)
          .angle(() => TAU)
          .fill("#000"),
        [{ value: 1 }]
      );
      // A single full-circle wedge bisects at 6 o'clock: 60 + 2/3 * 60 below the centre.
      const [[x, y]] = points(node);
      expect(x).toBeCloseTo(60, 6);
      expect(y).toBeCloseTo(100, 6);
    });

    test("should position the anchors synchronously, without waiting for the transition", () => {
      const node = render(pieOf(), testData());
      for (const anchor of anchors(node)) expect(anchor).not.toContain("NaN");
    });
  });

  describe("transition", () => {
    test("should animate the wedge angles from the previous values towards the new ones", async () => {
      const component = pieOf();
      const g = group("animate");
      g.datum([{ value: 1 }]).call(component as never);
      await settle();

      const next: Datum[] = [{ value: 3 }];
      g.datum(next).call(component as never);
      await nextFrame();
      // Mid-flight: past the old angle, not yet at the new one.
      expect(next[0].a1).toBeGreaterThan(1);
      expect(next[0].a1).toBeLessThan(3);

      await settle();
      expect(next[0].a1).toBeCloseTo(3, 6);
    });

    test("should carry the on-screen angles over to the new data objects", () => {
      const component = pieOf();
      const g = group("carry");
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);

      const next: Datum[] = [{ value: 2 }, { value: 2 }];
      g.datum(next).call(component as never);
      // The new objects inherit the old on-screen angles as their transition start...
      expect(next.map((d) => [d.a0, d.a1])).toEqual([
        [0, 1],
        [1, 2],
      ]);
      // ...while the destination angles come from the new values.
      expect(next.map((d) => [d._a0, d._a1])).toEqual([
        [0, 2],
        [2, 4],
      ]);
    });

    test("should schedule a d3 transition on every wedge", () => {
      const node = render(pieOf(), [{ value: 1 }]);
      const withState = wedges(node)[0] as SVGPathElement & { __transition?: unknown };
      expect(withState.__transition).not.toBeUndefined();
    });
  });

  describe("data mutation", () => {
    test("writes four angle fields onto every datum handed to it", () => {
      const data = testData();
      render(pieOf(), data);
      // NOTE: the component has no state of its own - the transition needs old and new
      // angles on the same object, and the only object shared between two renders is the
      // datum. This is by design (see the comment in pie.js) but it is worth pinning: the
      // caller's data is not the same after rendering, so anything comparing state by
      // value, hashing it, or serialising it sees the extra fields.
      expect(Object.keys(data[0]).sort()).toEqual(["_a0", "_a1", "a0", "a1", "color", "value"]);
    });

    describe("known quirks", () => {
      test("requires mutable data, and throws on anything frozen", () => {
        // NOTE: `value._a0 = angle` on a non-extensible object throws in strict mode, which
        // all ESM is, so the whole render dies on Object.freeze'd or otherwise sealed data.
        // sszvis already lives with this: src/app.js calls immer's setAutoFreeze(false) with
        // the comment "d3 mutates state in many places, which is why we have to turn this
        // off", so app state stays writable. Data from anywhere else - a frozen fixture, a
        // library that freezes its output - is a caller-visible constraint that no JSDoc
        // mentions.
        const frozen = [Object.freeze({ value: 1 }), Object.freeze({ value: 1 })];
        expect(() => render(pieOf(), frozen)).toThrow(TypeError);
      });

      test("collapses wedges that share one datum object into a single geometry", async () => {
        // BUG: the angles live on the datum, so two entries pointing at the same object
        // overwrite each other and the last one wins. Both wedges then draw the same arc
        // and the pie silently loses a slice. Reachable whenever data is built by reference,
        // e.g. two categories mapped to one shared record.
        // current: identical geometry, one wedge invisible. expected: two distinct wedges.
        const shared: Datum = { value: 1 };
        const node = render(pieOf(50), [shared, shared]);
        await nextFrame();
        const [first, second] = attrs(node, "d");
        expect(first).toBe(second);
        expect(points(node)[0]).toEqual(points(node)[1]);
      });

      test("treats a0 and a1 on the incoming data as its own state", async () => {
        // NOTE: reading a0/a1 back off the datum is how the transition continues from the
        // current on-screen angle, so this is the mechanism working as designed. The catch
        // is that the two field names are neither namespaced nor documented as reserved
        // (unlike _a0/_a1, which at least look internal): a datum that happens to carry an
        // `a0` field is treated as mid-transition and its wedge sweeps in from that angle.
        const data: Datum[] = [{ value: 1, a0: 5, a1: 6 }];
        const g = group("preset");
        g.datum(data).call(pieOf() as never);
        expect(data[0].a0).toBe(5);
        await nextFrame();
        expect(data[0].a0).toBeLessThan(5);
        expect(data[0].a0).toBeGreaterThan(0);
      });

      test("lets two pies over the same array fight over the angles", async () => {
        // NOTE: the flip side of keeping the angles on the datum. Any code that renders one
        // array into two pies - rather than giving each pie its own slice of the data, as
        // the pie-multiples example does - leaves the second pie's start angles overwritten
        // by the first pie's result, so it animates from a geometry it never displayed.
        // Worse, both transitions then keep writing to the same objects on every frame, and
        // the second pie's anchors are placed from whatever the first pie's tween last left
        // behind.
        const data: Datum[] = [{ value: 1 }, { value: 1 }];
        const wide = pie()
          .radius(50)
          .angle((d: Datum) => d.value * 2)
          .fill("#000");
        group("fight-a")
          .datum(data)
          .call(pieOf(50) as never);
        expect(data.map((d) => d.a1)).toEqual([1, 2]);
        group("fight-b")
          .datum(data)
          .call(wide as never);
        // The second pie wants [2, 4] but starts from the first pie's [1, 2].
        expect(data.map((d) => [d.a1, d._a1])).toEqual([
          [1, 2],
          [2, 4],
        ]);
      });
    });
  });

  describe("known quirks", () => {
    test("renders no path data at all until the first animation frame", async () => {
      // BUG: `d` is only ever written by the attrTween, and there is no transition property
      // to opt out of (bar has one). So a pie is geometrically empty on the render tick: a
      // chart serialised straight after rendering - a snapshot, an svg export - comes out
      // blank. The same holds for as long as the document is hidden, since d3-timer runs on
      // requestAnimationFrame, which browsers do not fire for a hidden tab; the pie fills in
      // once the tab is shown again.
      // current: d is null until a frame passes. expected: the final geometry is applied
      // immediately, with the transition only interpolating on top of it.
      const node = render(pieOf(), testData());
      expect(attrs(node, "d")).toEqual([null, null]);
      await nextFrame();
      for (const d of attrs(node, "d")) expect(d).not.toBeNull();
    });

    test("never animates transform, fill or stroke, despite transitioning them", async () => {
      // BUG: transform/fill/stroke are set on the join and then set again on the transition,
      // from the same values, so those three tweens can only interpolate a value onto
      // itself. A pie that changes radius or colour jumps. Same defect as the one documented
      // on bar.ts, and the same fix: apply each attribute once, to the transition.
      // current: the new transform and fill are on the DOM synchronously. expected: they
      // ease over 300ms like the angles do.
      const component = pieOf(50);
      const g = group("dead-transition");
      g.datum([{ value: 1 }]).call(component as never);
      await settle();

      g.datum([{ value: 1 }]).call(component.radius(120).fill("#123456") as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
      expect(attrs(node, "fill")).toEqual(["#123456"]);
    });

    test("leaves the tooltip anchors one render behind the wedges", async () => {
      // BUG: the anchors are positioned from d.a0/d.a1, but at that point in the render
      // those still hold the *start* angles of the transition that was just scheduled. On a
      // first render start equals destination so it looks right; on every update the anchors
      // stay where the wedges were, and they are never repositioned when the transition
      // finishes. Tooltips on an updating pie therefore point at the previous slice layout.
      // current: anchors keep the pre-update positions. expected: anchors follow the
      // destination angles (ideally the animation too).
      const component = pieOf();
      const g = group("stale-anchors");
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      const before = points(node);

      g.datum([{ value: 3 }, { value: 3 }]).call(component as never);
      expect(points(node)).toEqual(before);
      await settle();
      expect(points(node)).toEqual(before);
    });

    test("pops new wedges in at their final angle instead of growing them", () => {
      // NOTE: a wedge that enters has no previous angles to interpolate from, so it is drawn
      // at its destination on the first frame while its neighbours animate. Exits are worse:
      // the join removes them immediately, with no exit transition. Both are consistent with
      // how the angle bookkeeping works, but the result is a pie whose slices behave
      // differently depending on whether they existed a render ago.
      const component = pieOf();
      const g = group("enter");
      g.datum([{ value: 1 }]).call(component as never);
      const grown: Datum[] = [{ value: 1 }, { value: 2 }];
      g.datum(grown).call(component as never);
      expect([grown[1].a0, grown[1].a1]).toEqual([grown[1]._a0, grown[1]._a1]);
    });

    test("throws when the angle property was never set", () => {
      // NOTE: angle has no default, so props.angle is undefined rather than a functor and
      // the loop throws on the first datum. The other required property, radius, fails
      // silently instead (see below) - the two failure modes are inconsistent, and neither
      // is the explicit warning sunburst logs when its data is malformed.
      expect(() => render(pie().radius(50).fill("#000"), [{ value: 1 }])).toThrow(TypeError);
    });

    test("renders an invalid transform when the radius was never set", async () => {
      // BUG: radius is required but unchecked, so it reaches the transform as undefined and
      // the anchors as NaN. The browser discards the unparseable transform rather than
      // reporting it, which is worse than it sounds: the wedge is invisible only because the
      // arc also collapses to a point, while the tooltip anchor is a live element sitting
      // untransformed at the group's origin, so tooltips fire at the chart's top left.
      // current: silent, mispositioned output. expected: a warning, or a sane default.
      const node = render(
        pie()
          .angle(() => 1)
          .fill("#000"),
        [{ value: 1 }]
      );
      expect(attrs(node, "transform")).toEqual(["translate(undefined,undefined)"]);
      expect(anchors(node)).toEqual(["translate(NaN,NaN)"]);
      const wedge = wedges(node)[0] as SVGPathElement;
      const anchor = anchorNodes(node)[0] as SVGRectElement;
      expect(wedge.transform.baseVal.numberOfItems).toBe(0);
      expect(anchor.transform.baseVal.numberOfItems).toBe(0);
      await nextFrame();
      // The arc collapses to a point, since outerRadius is undefined too.
      expect(attrs(node, "d")).toEqual(["M0,0Z"]);
    });

    test("treats a falsy stroke as no stroke at all and paints it white", () => {
      // BUG: `props.stroke || "#FFFFFF"` cannot tell "not configured" from "configured to
      // something falsy", so "" and null come back white. An accessor is not guarded the
      // same way, so the same empty string reaches the DOM when it is returned per datum -
      // two different results for the same value, depending on how it was passed.
      // Relatedly, the JSDoc says the stroke default is none; it is white.
      // current: "" as a prop becomes #FFFFFF, "" from an accessor stays "".
      // expected: one consistent rule, and a JSDoc that matches it.
      const asProp = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(""),
        [{ value: 1 }]
      );
      expect(attrs(asProp, "stroke")).toEqual(["#FFFFFF"]);

      const asAccessor = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(() => ""),
        [{ value: 1 }]
      );
      expect(attrs(asAccessor, "stroke")).toEqual([""]);
    });

    test("does not clamp the angles it is given", async () => {
      // NOTE: angles are summed as-is. A total beyond 2*PI is clamped by d3-path into a full
      // circle, hiding everything the wedge overshot, and a negative angle draws its wedge
      // backwards over its neighbour. Both are plausible with an unclamped linear scale over
      // data containing a negative value or a stale domain, and both fail silently.
      const data: Datum[] = [{ value: 10 }, { value: -3 }];
      const node = render(pieOf(50), data);
      await nextFrame();
      expect(data[0]._a1).toBe(10); // more than a full turn
      expect(data[1]._a1).toBeLessThan(data[1]._a0 as number); // reversed wedge
      // A wedge wider than a full turn degenerates into a closed ring.
      expect(attrs(node, "d")[0]).toMatch(/^M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50/);
    });

    test("poisons every wedge after a NaN angle instead of skipping it", async () => {
      // BUG: `angle += props.angle(value)` makes the running total NaN for good, so one bad
      // data point takes out the rest of the pie. The `isNaN(value.a1)` checks look like
      // guards against exactly this, but their job is resetting a stale carried-over angle,
      // and what they assign is that same poisoned total.
      // current: wedges before the bad value are fine, the bad one and everything after it
      // get NaN geometry and NaN anchors. expected: the bad wedge is skipped or treated as
      // zero-width, the way bar coerces its missing geometry values to 0.
      const data: Datum[] = [{ value: 1 }, { value: Number.NaN }, { value: 1 }];
      const node = render(
        pie()
          .radius(50)
          .angle((d: Datum) => d.value),
        data
      );
      await nextFrame();
      expect(data.map((d) => Number.isNaN(d._a1))).toEqual([false, true, true]);
      expect(attrs(node, "d")[0]).not.toContain("NaN");
      expect(attrs(node, "d")[1]).toContain("NaN");
      expect(attrs(node, "d")[2]).toContain("NaN");
      expect(anchors(node)[0]).not.toContain("NaN");
      expect(anchors(node).slice(1)).toEqual(["translate(NaN,NaN)", "translate(NaN,NaN)"]);
    });

    test("adopts any pre-existing .sszvis-path in the group and corrupts the angles", async () => {
      // BUG: the render matches wedges by the generic .sszvis-path class - also used by
      // stackedArea, stackedAreaMultiples and stackedPyramid - and copies angles off
      // whatever is bound to them, by index. A path another component left in the same group
      // is therefore treated as wedge zero. Here it carries the layer's placeholder datum,
      // the number 0, whose .a0 is undefined, and that undefined overwrites the angles the
      // loop just computed.
      // current: the pie renders NaN geometry. expected: the wedges are keyed to this
      // component, e.g. by a dedicated class or a data key.
      const g = group("foreign");
      g.append("path").attr("class", "sszvis-path").attr("d", "M0,0");
      const data: Datum[] = [{ value: 1 }];
      g.datum(data).call(pieOf(50) as never);
      expect(anchors(g.node() as SVGGElement)).toEqual(["translate(NaN,NaN)"]);
      await nextFrame();
      expect(attrs(g.node() as SVGGElement, "d")[0]).toContain("NaN");
    });

    test("throws outright when a foreign .sszvis-path has no datum bound", () => {
      // BUG: same root cause as above, one step further. A path inserted without d3 - by
      // another library, or by hand - has no __data__ at all, and the each callback reads
      // d.a0 off undefined before the data join can replace it.
      // current: TypeError from inside the component. expected: unrelated paths are ignored.
      const g = group("foreign-nodatum");
      const node = g.node() as SVGGElement;
      const stray = document.createElementNS("http://www.w3.org/2000/svg", "path");
      stray.setAttribute("class", "sszvis-path");
      node.appendChild(stray);
      expect(() => g.datum([{ value: 1 }]).call(pieOf(50) as never)).toThrow(TypeError);
    });
  });
});
