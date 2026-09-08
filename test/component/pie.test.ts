import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import pie from "../../src/component/pie.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
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

  describe("rendering", () => {
    test("should render one classed path per datum", () => {
      const node = render(pieOf(), testData());
      expect(wedges(node).length).toBe(2);
      for (const w of wedges(node)) expect(w.tagName).toBe("path");
    });

    test("should class the wedges with a pie-specific class as well as the generic one", () => {
      // The generic class stays for styling and for the documented panning selector; the
      // specific one is what the component's own data join matches.
      const node = render(pieOf(), testData());
      for (const w of wedges(node)) expect(w.classList.contains("sszvis-pie-path")).toBe(true);
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

    test("should bind the caller's own datum to each wedge", () => {
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

    test("should treat a falsy stroke the same as a property and as an accessor", () => {
      // The default applies only when the property was never set, so "" is passed through
      // either way rather than being read as "not configured".
      const asProp = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(""),
        [{ value: 1 }]
      );
      const asAccessor = render(
        pie()
          .radius(50)
          .angle(() => 1)
          .stroke(() => ""),
        [{ value: 1 }]
      );
      expect(attrs(asProp, "stroke")).toEqual([""]);
      expect(attrs(asAccessor, "stroke")).toEqual(attrs(asProp, "stroke"));
    });
  });

  describe("required properties", () => {
    test("should throw a named error when the angle property was never set", () => {
      expect(() => render(pie().radius(50).fill("#000"), [{ value: 1 }])).toThrow(
        "[pie] the angle property is required"
      );
    });

    test("should throw a named error when the radius property was never set", () => {
      expect(() =>
        render(
          pie()
            .angle(() => 1)
            .fill("#000"),
          [{ value: 1 }]
        )
      ).toThrow("[pie] the radius property is required");
    });

    test("should leave no wedges or tooltip anchors behind when validation fails", () => {
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
    test("should lay the wedges out cumulatively, starting at zero", () => {
      const node = render(pieOf(), testData());
      const [first, second] = wedges(node);
      expectAngles(first, [0, 1]);
      expectAngles(second, [1, 4]);
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

    test("should accept a constant angle, which fn.functor wraps", () => {
      const node = render(
        pie()
          .radius(50)
          .angle(Math.PI / 4)
          .fill("#000"),
        [{ value: 1 }, { value: 2 }, { value: 3 }]
      );
      const [a, b, c] = wedges(node);
      expectAngles(a, [0, Math.PI / 4]);
      expectAngles(b, [Math.PI / 4, Math.PI / 2]);
      expectAngles(c, [Math.PI / 2, (3 * Math.PI) / 4]);
    });

    test("should keep a zero-width wedge in the DOM", () => {
      const data: Datum[] = [{ value: 0 }, { value: TAU }];
      const node = render(pieOf(), data);
      expect(wedges(node).length).toBe(2);
      expect(wedges(node)[0].getAttribute("d")).not.toBeNull();
    });
  });

  describe("arc geometry", () => {
    test("should draw the arc synchronously, without waiting for an animation frame", () => {
      // The geometry is applied at the data join, so a chart serialised on the render tick -
      // a snapshot, an SVG export - or rendered in a hidden tab is never blank.
      const node = render(pieOf(100), testData());
      expect(attrs(node, "d")).not.toContain(null);
      // The first wedge starts at 12 o'clock, since d3's arc applies its own -PI/2 turn.
      expect(wedges(node)[0].getAttribute("d")).toMatch(/^M0,-100A100,100/);
    });

    test("should keep the geometry through the first animation frame", async () => {
      const node = render(pieOf(100), testData());
      await nextFrame();
      for (const d of attrs(node, "d")) expect(d).not.toBeNull();
    });

    test("should punch a fixed 4px hole in the middle of the pie", () => {
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

    test("should start a first render already at its destination, so nothing animates in", () => {
      const node = render(pieOf(), testData());
      const before = attrs(node, "d");
      expectAngles(wedges(node)[0], [0, 1]);
      expect(before).toEqual(attrs(node, "d"));
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

      const withState = wedges(node)[1] as SVGPathElement & { __transition?: unknown };
      expect(withState.__transition).toBeUndefined();
      expectAngles(wedges(node)[1], [1, 4]);
      await nextFrame();
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
      await new Promise((resolve) => setTimeout(resolve, 50));

      g.datum([{ value: 1 }, { value: 3 }]).call(component.transition(false) as never);
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(wedges(node).map((w) => w.getAttribute("opacity"))).toEqual(["1", "1"]);
      // The component's own geometry still landed synchronously.
      expectAngles(wedges(node)[1], [1, 4]);
    });

    test("should schedule a d3 transition on every wedge", () => {
      const node = render(pieOf(), [{ value: 1 }]);
      const withState = wedges(node)[0] as SVGPathElement & { __transition?: unknown };
      expect(withState.__transition).not.toBeUndefined();
    });

    test("should write every attribute straight to the DOM when the transition is off", async () => {
      const component = pieOf(50).transition(false);
      const g = group("no-transition");
      g.datum([{ value: 1 }]).call(component as never);
      const node = g.node() as SVGGElement;
      const withState = wedges(node)[0] as SVGPathElement & { __transition?: unknown };
      expect(withState.__transition).toBeUndefined();

      g.datum([{ value: 1 }]).call(component.radius(120).fill("#123456") as never);
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
      expect(attrs(node, "fill")).toEqual(["#123456"]);
      expectAngles(wedges(node)[0], [0, 1]);
      await nextFrame();
      expect(attrs(node, "transform")).toEqual(["translate(120,120)"]);
    });
  });

  describe("data mutation", () => {
    test("should leave the caller's data untouched", () => {
      const data = testData();
      render(pieOf(), data);
      expect(Object.keys(data[0]).sort()).toEqual(["color", "value"]);
      expect(data).toEqual(testData());
    });

    test("should render frozen data", () => {
      const frozen = [Object.freeze({ value: 1 }), Object.freeze({ value: 1 })];
      const node = render(pieOf(), frozen);
      expect(wedges(node).length).toBe(2);
      expectAngles(wedges(node)[0], [0, 1]);
      expectAngles(wedges(node)[1], [1, 2]);
    });

    test("should render two distinct wedges for two entries sharing one datum object", () => {
      const shared: Datum = { value: 1 };
      const node = render(pieOf(50), [shared, shared]);
      const [first, second] = attrs(node, "d");
      expect(first).not.toBe(second);
      expectAngles(wedges(node)[0], [0, 1]);
      expectAngles(wedges(node)[1], [1, 2]);
      expect(points(node)[0]).not.toEqual(points(node)[1]);
    });

    test("should ignore a0 and a1 fields the incoming data happens to carry", () => {
      const data = [{ value: 1, a0: 5, a1: 6 }];
      const node = render(pieOf(), data);
      expectAngles(wedges(node)[0], [0, 1]);
      expect(data[0]).toEqual({ value: 1, a0: 5, a1: 6 });
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
    test("should keep the wedges after a NaN angle valid", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const node = render(
        pie()
          .radius(50)
          .angle((d: Datum) => d.value),
        [{ value: 1 }, { value: Number.NaN }, { value: 1 }]
      );
      // The bad wedge is zero-width and the running total carries on from where it was.
      for (const d of attrs(node, "d")) expect(d).not.toContain("NaN");
      expectAngles(wedges(node)[0], [0, 1]);
      expectAngles(wedges(node)[2], [1, 2]);
      expect(console.warn).toHaveBeenCalled();
    });

    test("should keep the wedges after a NaN angle in the first datum valid", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const node = render(
        pie()
          .radius(50)
          .angle((d: Datum) => d.value),
        [{ value: Number.NaN }, { value: 1 }]
      );
      for (const d of attrs(node, "d")) expect(d).not.toContain("NaN");
      expectAngles(wedges(node)[1], [0, 1]);
    });

    test("should keep the tooltip anchors valid around a NaN angle", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const node = render(
        pie()
          .radius(50)
          .angle((d: Datum) => d.value),
        [{ value: 1 }, { value: Number.NaN }, { value: 1 }]
      );
      for (const anchor of anchors(node)) expect(anchor).not.toContain("NaN");
    });
  });

  describe("foreign elements in the group", () => {
    test("should ignore a pre-existing .sszvis-path carrying a foreign datum", () => {
      const g = group("foreign");
      g.append("path").attr("class", "sszvis-path").attr("d", "M0,0");
      const node = g.node() as SVGGElement;
      g.datum([{ value: 1 }]).call(pieOf(50) as never);
      for (const anchor of anchors(node)) expect(anchor).not.toContain("NaN");
      expect(node.querySelectorAll("path.sszvis-pie-path").length).toBe(1);
      expectAngles(node.querySelector("path.sszvis-pie-path") as Element, [0, 1]);
    });

    test("should not throw when a foreign .sszvis-path has no datum bound", () => {
      const g = group("foreign-nodatum");
      const node = g.node() as SVGGElement;
      const stray = document.createElementNS("http://www.w3.org/2000/svg", "path");
      stray.setAttribute("class", "sszvis-path");
      node.appendChild(stray);
      expect(() => g.datum([{ value: 1 }]).call(pieOf(50) as never)).not.toThrow();
      expectAngles(node.querySelector("path.sszvis-pie-path") as Element, [0, 1]);
    });

    test("should leave a foreign .sszvis-path untouched", () => {
      const g = group("foreign-untouched");
      g.append("path").attr("class", "sszvis-path").attr("d", "M0,0").attr("fill", "#abc");
      const node = g.node() as SVGGElement;
      g.datum([{ value: 1 }]).call(pieOf(50) as never);
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
