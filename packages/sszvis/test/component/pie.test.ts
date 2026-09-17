import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import pie from "../../src/component/pie.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
import "../../src/d3-selectgroup.js";

/**
 * The component keeps its transition state - the angles currently on screen - in a WeakMap
 * keyed by the wedge element, so nothing is written onto the caller's data. Every assertion
 * about angles therefore reads them back out of the rendered geometry.
 */
type Datum = { value: number; color?: string };

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
    vi.restoreAllMocks();
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

  /**
   * Resolves once a transition has actually moved `attr` on `node`, rather than after a fixed
   * delay. A fixed delay can overshoot the whole 300ms transition under load, which would let
   * these tests pass with the interrupt removed.
   */
  const untilMoved = (node: Element, attr: string) =>
    new Promise<void>((resolve) => {
      const from = node.getAttribute(attr);
      const check = () => (node.getAttribute(attr) === from ? setTimeout(check, 0) : resolve());
      check();
    });
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

  const numbersIn = (path: Element) =>
    (String(path.getAttribute("d")).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g) ?? []).map(Number);

  /**
   * Recovers a wedge's start and end angle from its path. d3's arc starts the outer edge at
   * (r sin a0, -r cos a0) and ends it at (r sin a1, -r cos a1), which is the `M` point and
   * the endpoint of the first `A` command. Angles come back in [0, TAU), so this is only
   * meaningful for a wedge narrower than half a turn.
   */
  const arcAngles = (path: Element) => {
    const n = numbersIn(path);
    const norm = (a: number) => (a < 0 ? a + TAU : a);
    return [norm(Math.atan2(n[0], -n[1])), norm(Math.atan2(n[7], -n[8]))] as const;
  };

  /** The point where a wedge's outer edge ends, in the pie's own coordinates. */
  const arcEnd = (path: Element) => {
    const n = numbersIn(path);
    return [n[7], n[8]] as const;
  };

  /** d3 rounds path coordinates, so the recovered angles are only good to a few decimals. */
  const expectAngles = (path: Element, [a0, a1]: [number, number]) => {
    const [got0, got1] = arcAngles(path);
    expect(got0).toBeCloseTo(a0, 4);
    expect(got1).toBeCloseTo(a1, 4);
  };

  describesTheMarkJoin<Datum>(() => ({
    make: () => pieOf(),
    renderInto: (key, component, data) =>
      group(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ wedges: wedges(node).length, anchors: anchorNodes(node).length }),
    full: { data: testData(), marks: { wedges: 2, anchors: 2 } },
    smaller: { data: [{ value: 1 }], marks: { wedges: 1, anchors: 1 } },
  }));

  describe("rendering", () => {
    test("should class the wedges with a pie-specific class as well as the generic one", () => {
      // The generic class stays for styling and for the documented panning selector; the
      // specific one is what the component's own data join matches.
      const node = render(pieOf(), testData());
      for (const w of wedges(node)) expect(w.classList.contains("sszvis-pie-path")).toBe(true);
    });

    test("should offset every wedge by the radius, so the pie sits in a radius-sized box when rendered", () => {
      const node = render(pieOf(80), testData());
      expect(attrs(node, "transform")).toEqual(["translate(80,80)", "translate(80,80)"]);
    });

    test("should fill each wedge from the fill property, whether it is a constant or an accessor", () => {
      expect(attrs(render(pieOf(), testData()), "fill")).toEqual(["#f00", "#0f0"]);

      const constant = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .fill("#abc"),
        [{ value: 1 }, { value: 2 }],
      );
      expect(attrs(constant, "fill")).toEqual(["#abc", "#abc"]);

      // The accessor is called with the index as well as the datum, as any d3 attr callback
      // is, so a colour scale keyed by position works.
      const byIndex = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .fill((_d: Datum, i: number) => (i === 0 ? "#111" : "#222")),
        [{ value: 1 }, { value: 2 }],
      );
      expect(attrs(byIndex, "fill")).toEqual(["#111", "#222"]);
    });

    test("should write no fill attribute when fill is not configured", () => {
      // The wedges then fall back to the SVG default, black, as the JSDoc says.
      const node = render(
        pie()
          .radius(50)
          .angle(() => 1),
        [{ value: 1 }],
      );
      expect(attrs(node, "fill")).toEqual([null]);
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

    test("should bind the caller's own datum to each wedge, not a layout wrapper", () => {
      // docs/pie-charts/basic.js drives its tooltip off the datum bound to .sszvis-path via
      // sszvis.panning, so the wedges must carry the caller's records, not a layout wrapper.
      const data = testData();
      const node = render(pieOf(), data);
      const bound = wedges(node).map((w) => (w as Element & { __data__: Datum }).__data__);
      expect(bound).toEqual([data[0], data[1]]);
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

  describe("stroke", () => {
    test("should apply a white stroke when no stroke is configured, to separate touching wedges", () => {
      const node = render(pieOf(), testData());
      expect(attrs(node, "stroke")).toEqual(["#FFFFFF", "#FFFFFF"]);
    });

    test("should replace the default with the configured stroke, as a constant, an accessor or none", () => {
      expect(attrs(render(pieOf().stroke("#00f"), testData()), "stroke")).toEqual(["#00f", "#00f"]);

      const byAccessor = render(
        pieOf().stroke((d: Datum) => d.color),
        testData(),
      );
      expect(attrs(byAccessor, "stroke")).toEqual(["#f00", "#0f0"]);

      expect(attrs(render(pieOf().stroke("none"), [{ value: 1 }]), "stroke")).toEqual(["none"]);
    });

    test("should use a falsy stroke rather than the default when one is configured either way", () => {
      // The default applies only when the property was never set, so "" is passed through
      // either way rather than being read as "not configured".
      const asProp = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(""),
        [{ value: 1 }],
      );
      const asAccessor = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(() => ""),
        [{ value: 1 }],
      );
      expect(attrs(asProp, "stroke")).toEqual([""]);
      expect(attrs(asAccessor, "stroke")).toEqual(attrs(asProp, "stroke"));
    });
  });

  describe("required properties", () => {
    test("should name the component and the property when a required property was never set", () => {
      expect(() => render(pie().radius(50).fill("#000"), [{ value: 1 }])).toThrow(
        "[pie] the angle property is required",
      );
      expect(() =>
        render(
          pie()
            .angle(() => 1)
            .fill("#000"),
          [{ value: 1 }],
        ),
      ).toThrow("[pie] the radius property is required");
    });

    test("should leave no wedges or tooltip anchors behind when a required property is missing", () => {
      // The stray anchor is what made the missing radius user-visible: a live 1x1 rect at
      // the group's origin, firing tooltips at the chart's top left corner.
      const g = group("unvalidated");
      const node = g.node() as SVGGElement;
      expect(() => g.datum([{ value: 1 }]).call(pie().angle(() => 1) as never)).toThrow();
      expect(wedges(node)).toEqual([]);
      expect(anchorNodes(node)).toEqual([]);
    });
  });

  describe("angles", () => {
    test("should lay the wedges out cumulatively from zero, whether angle is an accessor or a constant", () => {
      const node = render(pieOf(), testData());
      const [first, second] = wedges(node);
      expectAngles(first, [0, 1]);
      expectAngles(second, [1, 4]);

      // A constant angle gives every wedge the same width, and they still accumulate.
      const constant = render(
        pie()
          .radius(50)
          .angle(Math.PI / 4)
          .fill("#000"),
        [{ value: 1 }, { value: 2 }, { value: 3 }],
      );
      const [a, b, c] = wedges(constant);
      expectAngles(a, [0, Math.PI / 4]);
      expectAngles(b, [Math.PI / 4, Math.PI / 2]);
      expectAngles(c, [Math.PI / 2, (3 * Math.PI) / 4]);
    });

    test("should close the circle when the angles sum to a full turn", () => {
      const data: Datum[] = [{ value: TAU / 4 }, { value: TAU / 4 }, { value: TAU / 2 }];
      const node = render(pieOf(100), data);
      const last = wedges(node)[2];
      // The last wedge starts at half a turn and its outer edge ends back at twelve o'clock.
      expect(arcAngles(last)[0]).toBeCloseTo(TAU / 2, 6);
      const [x, y] = arcEnd(last);
      expect(x).toBeCloseTo(0, 6);
      expect(y).toBeCloseTo(-100, 6);
    });

    test("should keep a zero-width wedge in the DOM when a datum's angle is 0", () => {
      const data: Datum[] = [{ value: 0 }, { value: TAU }];
      const node = render(pieOf(), data);
      expect(wedges(node).length).toBe(2);
      expect(wedges(node)[0].getAttribute("d")).not.toBeNull();
    });
  });

  describe("arc geometry", () => {
    test("should draw the arcs at their final angles on the render tick, without waiting for a frame", () => {
      // The geometry is applied at the data join, so a chart serialised on the render tick -
      // a snapshot, an SVG export - or rendered in a hidden tab is never blank.
      const node = render(pieOf(100), testData());
      expect(attrs(node, "d")).not.toContain(null);
      // The first wedge starts at 12 o'clock, since d3's arc applies its own -PI/2 turn.
      const [first, second] = wedges(node);
      expectAngles(first, [0, 1]);
      expectAngles(second, [1, 4]);
    });

    test("should still hold those angles once the first animation frame has run", async () => {
      // A first render schedules a transition like any other, so the frame that follows it
      // must not tween the wedges away from the geometry the join already wrote.
      const node = render(pieOf(100), testData());
      await nextFrame();
      expect(attrs(node, "d")).not.toContain(null);
      expectAngles(wedges(node)[0], [0, 1]);
      expectAngles(wedges(node)[1], [1, 4]);
    });

    test("should punch a fixed 4px hole in the middle whatever the radius", () => {
      const node = render(pieOf(100), testData());
      // innerRadius is hardcoded to 4 and cannot be configured.
      for (const d of attrs(node, "d")) expect(d).toContain("A4,4");
    });

    test("should reach the destination geometry after the transition", async () => {
      const data = testData();
      const g = group("destination");
      g.datum(data).call(pieOf() as never);
      await settle();
      const [first, second] = wedges(g.node() as SVGGElement);
      expectAngles(first, [0, 1]);
      expectAngles(second, [1, 4]);
    });
  });

  describe("tooltip anchors", () => {
    // The anchor's own shape - an invisible rect that still has a measurable box - belongs to
    // the tooltipAnchor module and is covered in test/annotation/tooltipAnchor.test.ts. What
    // pie owns, and what these tests assert, is where it puts the anchor.

    test("should place the anchor two thirds out along the wedge's bisector, wherever the wedge lies", () => {
      // Two half-circle wedges of a radius-90 pie: the first bisects at 3 o'clock, the
      // second at 9 o'clock, both at 2/3 * 90 = 60 from the centre at (90, 90).
      const halves = render(
        pie()
          .radius(90)
          .angle(() => Math.PI)
          .fill("#000"),
        [{ value: 1 }, { value: 1 }],
      );
      const [first, second] = points(halves);
      expect(first[0]).toBeCloseTo(150, 6);
      expect(first[1]).toBeCloseTo(90, 6);
      expect(second[0]).toBeCloseTo(30, 6);
      expect(second[1]).toBeCloseTo(90, 6);

      // A single full-circle wedge starts at twelve o'clock and bisects at 6 o'clock:
      // 60 + 2/3 * 60 below the centre.
      const whole = render(
        pie()
          .radius(60)
          .angle(() => TAU)
          .fill("#000"),
        [{ value: 1 }],
      );
      const [[x, y]] = points(whole);
      expect(x).toBeCloseTo(60, 6);
      expect(y).toBeCloseTo(100, 6);
    });

    test("should move the anchors to the destination angles on an update", async () => {
      const component = pieOf();
      const g = group("fresh-anchors");
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      const before = points(node);

      // Two wedges of 3 radians each: the first bisects at 1.5, the second at 4.5.
      g.datum([{ value: 3 }, { value: 3 }]).call(component as never);
      const expected = [1.5, 4.5].map((a) => [
        100 + Math.cos(a - Math.PI / 2) * ((100 * 2) / 3),
        100 + Math.sin(a - Math.PI / 2) * ((100 * 2) / 3),
      ]);
      const after = points(node);
      expect(after).not.toEqual(before);
      after.forEach(([x, y], i) => {
        expect(x).toBeCloseTo(expected[i][0], 6);
        expect(y).toBeCloseTo(expected[i][1], 6);
      });
      await settle();
      expect(points(node)).toEqual(after);
    });

    test("should not drift to interpolated angles on a third render", async () => {
      // The anchors used to be placed from the angles the transition was starting from, so a
      // third render mid-flight put them at whatever the tween had last written.
      const component = pieOf();
      const g = group("third-render");
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);
      await settle();
      g.datum([{ value: 3 }, { value: 3 }]).call(component as never);
      await nextFrame();
      const node = g.node() as SVGGElement;

      g.datum([{ value: 2 }, { value: 2 }]).call(component as never);
      const expected = [1, 3].map((a) => [
        100 + Math.cos(a - Math.PI / 2) * ((100 * 2) / 3),
        100 + Math.sin(a - Math.PI / 2) * ((100 * 2) / 3),
      ]);
      points(node).forEach(([x, y], i) => {
        expect(x).toBeCloseTo(expected[i][0], 6);
        expect(y).toBeCloseTo(expected[i][1], 6);
      });
    });
  });

  describe("transition", () => {
    test("should animate the wedge angles from the previous values towards the new ones", async () => {
      const component = pieOf();
      const g = group("animate");
      g.datum([{ value: 1 }]).call(component as never);
      await settle();

      g.datum([{ value: 3 }]).call(component as never);
      await nextFrame();
      const node = g.node() as SVGGElement;
      // Mid-flight: past the old angle, not yet at the new one.
      expect(arcAngles(wedges(node)[0])[1]).toBeGreaterThan(1);
      expect(arcAngles(wedges(node)[0])[1]).toBeLessThan(3);

      await settle();
      expect(arcAngles(wedges(node)[0])[1]).toBeCloseTo(3, 6);
    });

    test("should start from the angles already on screen, not from the new data", async () => {
      const component = pieOf();
      const g = group("carry");
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;

      g.datum([{ value: 2 }, { value: 2 }]).call(component as never);
      // The geometry on the render tick is still the old layout...
      expectAngles(wedges(node)[1], [1, 2]);
      await nextFrame();
      // ...and it eases towards the new one from there.
      const [a0, a1] = arcAngles(wedges(node)[1]);
      expect(a0).toBeGreaterThan(1);
      expect(a0).toBeLessThan(2);
      expect(a1).toBeGreaterThan(2);
      expect(a1).toBeLessThan(4);
    });

    test("should animate the transform, the fill and the stroke as well as the angles", async () => {
      const component = pie()
        .radius(50)
        .angle((d: Datum) => d.value)
        .fill("#ff0000");
      const g = group("live-transition");
      g.datum([{ value: 1 }]).call(component as never);
      await settle();

      g.datum([{ value: 1 }]).call(component.radius(120).fill("#123456") as never);
      const node = g.node() as SVGGElement;
      // Still the old values on the render tick, since the attributes are only written to
      // the transition.
      expect(attrs(node, "transform")).toEqual(["translate(50,50)"]);
      expect(attrs(node, "fill")).toEqual(["#ff0000"]);

      await settle();
      // The browser reserialises the transform it interpolated, hence the space.
      expect(attrs(node, "transform")).toEqual(["translate(120, 120)"]);
      expect(attrs(node, "fill")).toEqual(["rgb(18, 52, 86)"]);
    });

    test("should keep the on-screen angles across separate factory instances", async () => {
      // The shipped examples build a fresh sszvis.pie() inside every render, so the
      // transition state cannot live on the factory: a per-instance map would find nothing
      // for the wedges already on screen and tween each one from its destination to itself.
      const g = group("cross-instance");
      g.datum([{ value: 1 }, { value: 1 }]).call(pieOf(50) as never);
      await settle();

      g.datum([{ value: 1 }, { value: 3 }]).call(pieOf(50) as never);
      const node = g.node() as SVGGElement;
      // Still the old layout on the render tick...
      expectAngles(wedges(node)[1], [1, 2]);
      await nextFrame();
      // ...and easing from it, rather than sitting at the destination already.
      const [a0, a1] = arcAngles(wedges(node)[1]);
      expect(a0).toBeGreaterThan(1);
      expect(a1).toBeLessThan(4);
    });

    test("should interrupt a running transition when the transition is turned off", async () => {
      // The attrTween writes the path and the stored angles on every frame, so a render
      // that turns transitions off has to stop the previous one or it keeps overwriting
      // the attributes this branch just set, settling back at the old destination.
      const g = group("interrupted");
      const component = pieOf(50);
      g.datum([{ value: 1 }, { value: 1 }]).call(component as never);
      await settle();

      g.datum([{ value: 1 }, { value: 3 }]).call(component as never);
      await nextFrame();
      const node = g.node() as SVGGElement;
      g.datum([{ value: 1 }, { value: 3 }]).call(component.transition(false) as never);

      // The destination angles land at once, and - the actual point - they stay put. A
      // surviving tween would keep writing the path on every frame and drag the wedge back
      // towards where it was heading, so the second read after a frame is what proves the
      // interrupt rather than any inspection of d3's own state.
      expectAngles(wedges(node)[1], [1, 4]);
      await nextFrame();
      expectAngles(wedges(node)[1], [1, 4]);
      await settle();
      expectAngles(wedges(node)[1], [1, 4]);
    });

    test("should not interrupt a transition the consumer scheduled on the same wedges", async () => {
      const g = group("consumer-tween");
      const component = pieOf(50);
      g.datum([{ value: 1 }, { value: 1 }]).call(component.transition(false) as never);
      const node = g.node() as SVGGElement;

      // A consumer fades the wedges in with its own, unnamed transition - the name a bare
      // selection.transition() uses, which the component's interrupt used to reach as well.
      g.selectAll("path.sszvis-path")
        .attr("opacity", 0)
        .transition()
        .duration(300)
        .attr("opacity", 1);
      await untilMoved(wedges(node)[0], "opacity");

      g.datum([{ value: 1 }, { value: 3 }]).call(component.transition(false) as never);
      await settle();

      expect(wedges(node).map((w) => w.getAttribute("opacity"))).toEqual(["1", "1"]);
      // The component's own geometry still landed synchronously.
      expectAngles(wedges(node)[1], [1, 4]);
    });

    test("should write every attribute straight to the DOM when the transition is off", async () => {
      const component = pieOf(50).transition(false);
      const g = group("no-transition");
      g.datum([{ value: 1 }]).call(component as never);
      const node = g.node() as SVGGElement;

      g.datum([{ value: 1 }]).call(component.radius(120).fill("#123456") as never);
      // The exact destination values on the render tick - not an interpolated transform or
      // an rgb() blend, which is what a scheduled tween would leave here instead.
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
      expect(attrs(node, "fill")).toEqual(["#123456"]);
      expectAngles(wedges(node)[0], [0, 1]);

      // And unchanged afterwards, so nothing was animating in the background.
      await nextFrame();
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
      expect(attrs(node, "fill")).toEqual(["#123456"]);
      await settle();
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
      expect(attrs(node, "fill")).toEqual(["#123456"]);
    });
  });

  describe("data mutation", () => {
    test("should lay the pie out without writing to the caller's data, whatever shape it is in", () => {
      // The angles live in a WeakMap keyed by the wedge element rather than on the data, and
      // these are the four ways that would show if it were not so: a stray field appearing on
      // a plain record, a frozen record throwing, two entries pointing at one object treading
      // on each other, and existing a0/a1 fields being read back or overwritten.
      const plain = testData();
      render(pieOf(), plain);
      expect(Object.keys(plain[0]).sort()).toEqual(["color", "value"]);
      expect(plain).toEqual(testData());

      const frozen = [Object.freeze({ value: 1 }), Object.freeze({ value: 1 })];
      const fromFrozen = render(pieOf(), frozen);
      expect(wedges(fromFrozen).length).toBe(2);
      expectAngles(wedges(fromFrozen)[0], [0, 1]);
      expectAngles(wedges(fromFrozen)[1], [1, 2]);

      const shared: Datum = { value: 1 };
      const fromShared = render(pieOf(50), [shared, shared]);
      const [first, second] = attrs(fromShared, "d");
      expect(first).not.toBe(second);
      expectAngles(wedges(fromShared)[0], [0, 1]);
      expectAngles(wedges(fromShared)[1], [1, 2]);
      expect(points(fromShared)[0]).not.toEqual(points(fromShared)[1]);

      const withAngleFields = [{ value: 1, a0: 5, a1: 6 }];
      const fromAngleFields = render(pieOf(), withAngleFields);
      expectAngles(wedges(fromAngleFields)[0], [0, 1]);
      expect(withAngleFields[0]).toEqual({ value: 1, a0: 5, a1: 6 });
    });

    test("should render two pies over the same array independently", async () => {
      const data: Datum[] = [{ value: 1 }, { value: 1 }];
      const wide = pie()
        .radius(50)
        .angle((d: Datum) => d.value * 2)
        .fill("#000");
      const narrow = group("share-a");
      narrow.datum(data).call(pieOf(50) as never);
      const broad = group("share-b");
      broad.datum(data).call(wide as never);
      await settle();

      const narrowWedges = wedges(narrow.node() as SVGGElement);
      expectAngles(narrowWedges[0], [0, 1]);
      expectAngles(narrowWedges[1], [1, 2]);
      const broadWedges = wedges(broad.node() as SVGGElement);
      expectAngles(broadWedges[0], [0, 2]);
      expectAngles(broadWedges[1], [2, 4]);
      expect(data).toEqual([{ value: 1 }, { value: 1 }]);
    });
  });

  describe("bad angle values", () => {
    test("should warn and keep every other wedge and anchor drawable when an angle is NaN", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const pieOfValue = () =>
        pie()
          .radius(50)
          .angle((d: Datum) => d.value);

      // The bad wedge is zero-width and the running total carries on from where it was, so
      // neither the paths nor the anchors are poisoned by it.
      const midway = render(pieOfValue(), [{ value: 1 }, { value: Number.NaN }, { value: 1 }]);
      for (const d of attrs(midway, "d")) expect(d).not.toContain("NaN");
      for (const anchor of anchors(midway)) expect(anchor).not.toContain("NaN");
      expectAngles(wedges(midway)[0], [0, 1]);
      expectAngles(wedges(midway)[2], [1, 2]);
      expect(console.warn).toHaveBeenCalled();

      // The first datum is the case where there is no running total to fall back on.
      const leading = render(pieOfValue(), [{ value: Number.NaN }, { value: 1 }]);
      for (const d of attrs(leading, "d")) expect(d).not.toContain("NaN");
      expectAngles(wedges(leading)[1], [0, 1]);
    });
  });

  describe("foreign elements in the group", () => {
    test("should neither adopt nor mutate a foreign .sszvis-path, with or without a datum on it", () => {
      // The join matches .sszvis-pie-path, so a path another component left under the generic
      // class must be passed over entirely: not counted as a wedge, not restyled, and not
      // able to knock the layout - or the anchors read from it - off by one.
      const g = group("foreign");
      g.append("path").attr("class", "sszvis-path").attr("d", "M0,0").attr("fill", "#abc");
      const node = g.node() as SVGGElement;
      const withoutDatum = document.createElementNS("http://www.w3.org/2000/svg", "path");
      withoutDatum.setAttribute("class", "sszvis-path");
      node.appendChild(withoutDatum);

      expect(() => g.datum([{ value: 1 }]).call(pieOf(50) as never)).not.toThrow();

      expect(node.querySelectorAll("path.sszvis-pie-path").length).toBe(1);
      expectAngles(node.querySelector("path.sszvis-pie-path") as Element, [0, 1]);
      for (const anchor of anchors(node)) expect(anchor).not.toContain("NaN");

      const foreign = node.querySelector("path.sszvis-path:not(.sszvis-pie-path)") as Element;
      expect(foreign).not.toBeNull();
      expect(foreign.getAttribute("d")).toBe("M0,0");
      expect(foreign.getAttribute("fill")).toBe("#abc");
      expect(foreign.getAttribute("transform")).toBeNull();
    });
  });

  describe("known quirks", () => {
    test("pops new wedges in at their final angle instead of growing them", () => {
      // NOTE: a wedge that enters has no previous angles to interpolate from, so it is drawn
      // at its destination on the render tick while its neighbours animate. Exits are worse:
      // the join removes them immediately, with no exit transition. Both are consistent with
      // how the angle bookkeeping works, but the result is a pie whose slices behave
      // differently depending on whether they existed a render ago.
      const component = pieOf();
      const g = group("enter");
      g.datum([{ value: 1 }]).call(component as never);
      g.datum([{ value: 1 }, { value: 2 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expectAngles(wedges(node)[1], [1, 3]);
    });

    test("does not clamp the angles it is given", () => {
      // NOTE: angles are summed as-is. A total beyond 2*PI is clamped by d3-path into a full
      // circle, hiding everything the wedge overshot, and a negative angle draws its wedge
      // backwards over its neighbour. Both are plausible with an unclamped linear scale over
      // data containing a negative value or a stale domain, and both fail silently.
      const node = render(pieOf(50), [{ value: 10 }, { value: -3 }]);
      // A wedge wider than a full turn degenerates into a closed ring.
      expect(attrs(node, "d")[0]).toMatch(/^M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50/);
      // The second wedge runs backwards over its neighbour.
      const [a0, a1] = arcAngles(wedges(node)[1]);
      expect(a1).toBeLessThan(a0);
    });
  });
});
