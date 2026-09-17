import { afterEach, beforeEach, describe, expect, test } from "vitest";
import bar from "../../src/component/bar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
import "../../src/d3-selectgroup.js";

type Datum = { x: number; y: number; w: number; h: number; color?: string };

describe("component/bar", () => {
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
      key: key ?? `bar-${++layerKey}`,
    }).selectGroup("bars");

  const render = (component: unknown, data: unknown[]) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  const testData: Datum[] = [
    { x: 10, y: 20, w: 30, h: 40, color: "#f00" },
    { x: 60, y: 25, w: 30, h: 50, color: "#0f0" },
  ];

  /** A bar wired to the test datum shape. */
  const barOf = () =>
    bar()
      .x((d: Datum) => d.x)
      .y((d: Datum) => d.y)
      .width((d: Datum) => d.w)
      .height((d: Datum) => d.h);

  const bars = (node: Element) => [...node.querySelectorAll("rect.sszvis-bar-rect")];
  const attrs = (node: Element, attr: string) => bars(node).map((b) => b.getAttribute(attr));
  const anchors = (node: Element) =>
    [...node.querySelectorAll("[data-tooltip-anchor]")].map((a) => a.getAttribute("transform"));

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

  /**
   * Waits out the component's 300ms transition, so that an attribute read afterwards is the
   * value the render settled on rather than a value some tween is still moving.
   */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

  describesTheMarkJoin<Datum>(() => ({
    make: barOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ bars: bars(node).length, anchors: anchors(node).length }),
    full: { data: testData, marks: { bars: 2, anchors: 2 } },
    smaller: { data: [testData[0]], marks: { bars: 1, anchors: 1 } },
  }));

  describe("rendering", () => {
    test("should carry both the generic and the component-owned class", () => {
      // The join matches on .sszvis-bar-rect; .sszvis-bar stays on the node so the
      // stylesheet rule and any consumer selector aimed at it keep working.
      const node = render(barOf(), [testData[0]]);
      expect(bars(node)[0].getAttribute("class")).toBe("sszvis-bar sszvis-bar-rect");
    });

    test("should place each rect from x, y, width and height whether they are accessors or constants", () => {
      const fromAccessors = render(barOf(), testData);
      expect(attrs(fromAccessors, "x")).toEqual(["10", "60"]);
      expect(attrs(fromAccessors, "y")).toEqual(["20", "25"]);
      expect(attrs(fromAccessors, "width")).toEqual(["30", "30"]);
      expect(attrs(fromAccessors, "height")).toEqual(["40", "50"]);

      // A constant reaches every rect as though an accessor had returned it for each datum,
      // which is the whole observable effect of the fn.functor wrapping on set.
      const fromConstants = render(bar().x(5).y(6).width(7).height(8), [{}, {}]);
      expect(attrs(fromConstants, "x")).toEqual(["5", "5"]);
      expect(attrs(fromConstants, "y")).toEqual(["6", "6"]);
      expect(attrs(fromConstants, "width")).toEqual(["7", "7"]);
      expect(attrs(fromConstants, "height")).toEqual(["8", "8"]);
    });

    test("should apply fill and stroke when they are configured", () => {
      const node = render(
        barOf()
          .fill((d: Datum) => d.color)
          .stroke("#00f"),
        testData,
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#0f0"]);
      expect(attrs(node, "stroke")).toEqual(["#00f", "#00f"]);
    });

    test("should write no fill or stroke attribute when neither is configured", () => {
      const node = render(bar().x(0).y(0).width(10).height(10), [{}]);
      expect(bars(node)[0].getAttribute("fill")).toBeNull();
      expect(bars(node)[0].getAttribute("stroke")).toBeNull();
    });

    test("should move the rects to the new geometry when the data changes", () => {
      // transition is off so that the updated geometry is readable on this tick; the
      // transitioning case is covered in the transition block.
      const component = barOf().transition(false);
      const g = group("update");
      g.datum(testData).call(component as never);
      g.datum([{ x: 99, y: 88, w: 77, h: 66 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["99"]);
      expect(attrs(node, "height")).toEqual(["66"]);
    });
  });

  describe("missing values", () => {
    // Which values count as unusable, and what each one coerces to, is the guard's own
    // contract and is covered once in test/svgUtils/toFinite.test.ts. What belongs here is
    // only that bar routes all four of its geometry attributes through that guard, which is
    // the part a change to bar can break.
    test("should fall back to 0 on every geometry attribute when an accessor returns an unusable value", () => {
      const node = render(
        bar()
          .x(() => Number.NaN)
          .y(() => Number.NaN)
          .width(() => Number.NaN)
          .height(() => Number.NaN),
        [{}],
      );
      expect(attrs(node, "x")).toEqual(["0"]);
      expect(attrs(node, "y")).toEqual(["0"]);
      expect(attrs(node, "width")).toEqual(["0"]);
      expect(attrs(node, "height")).toEqual(["0"]);
    });
  });

  describe("tooltip anchors", () => {
    // The anchor's own shape - an invisible rect that still has a measurable box - belongs to
    // the tooltipAnchor module and is covered in test/annotation/tooltipAnchor.test.ts. What
    // bar owns, and what these tests assert, is where it puts the anchor.

    test("should place the anchor at the top centre when neither anchor property is set", () => {
      const node = render(barOf(), testData);
      // x + width / 2, y
      expect(anchors(node)).toEqual(["translate(25,20)", "translate(75,25)"]);
    });

    test("should centre the anchor vertically when centerTooltip is true and leave it at the top when false", () => {
      // x + width / 2, y + height / 2
      expect(anchors(render(barOf().centerTooltip(true), testData))).toEqual([
        "translate(25,40)",
        "translate(75,50)",
      ]);
      expect(anchors(render(barOf().centerTooltip(false), testData))).toEqual([
        "translate(25,20)",
        "translate(75,25)",
      ]);
    });

    test("should place the anchor at a fractional position when tooltipAnchor is set", () => {
      expect(anchors(render(barOf().tooltipAnchor([0, 0]), [testData[0]]))).toEqual([
        "translate(10,20)",
      ]);
      expect(anchors(render(barOf().tooltipAnchor([1, 1]), [testData[0]]))).toEqual([
        "translate(40,60)",
      ]);
      expect(anchors(render(barOf().tooltipAnchor([0.5, 0.5]), [testData[0]]))).toEqual([
        "translate(25,40)",
      ]);
    });

    test("should parse the fractions when tooltipAnchor is given as strings", () => {
      expect(anchors(render(barOf().tooltipAnchor(["0.5", "1"]), [testData[0]]))).toEqual([
        "translate(25,60)",
      ]);
      // A trailing unit only survives parseFloat - plain arithmetic coercion yields NaN,
      // so this is what actually pins the parse rather than JS's own string coercion.
      expect(anchors(render(barOf().tooltipAnchor(["0.5px", "1"]), [testData[0]]))).toEqual([
        "translate(25,60)",
      ]);
    });

    test("should centre the anchor when centerTooltip and tooltipAnchor are both set", () => {
      const node = render(barOf().centerTooltip(true).tooltipAnchor([0, 0]), [testData[0]]);
      expect(anchors(node)).toEqual(["translate(25,40)"]);
    });

    test("should read the accessors with each datum's index when positioning the anchor in any anchor mode", () => {
      // Index-dependent accessors, so an anchor computed without the index - or with the
      // wrong one - lands somewhere else. All three modes read the same accessors, so they
      // stand or fall together.
      const indexed = () =>
        bar()
          .x((_d: Datum, i: number) => i * 100)
          .y((_d: Datum, i: number) => i * 10)
          .width(20)
          .height(10);

      const byDefault = render(indexed(), testData);
      expect(attrs(byDefault, "x")).toEqual(["0", "100"]);
      // x + width / 2, y
      expect(anchors(byDefault)).toEqual(["translate(10,0)", "translate(110,10)"]);

      expect(anchors(render(indexed().centerTooltip(true), testData))).toEqual([
        "translate(10,5)",
        "translate(110,15)",
      ]);
      expect(anchors(render(indexed().tooltipAnchor([1, 1]), testData))).toEqual([
        "translate(20,10)",
        "translate(120,20)",
      ]);
    });

    test("should position the anchor from the guarded geometry when an accessor returns NaN", () => {
      const node = render(
        bar()
          .x(() => Number.NaN)
          .y(() => Number.NaN)
          .width(20)
          .height(10),
        [{}],
      );
      // NaN x and y become 0, so the anchor lands at 0 + 20 / 2, 0
      expect(anchors(node)).toEqual(["translate(10,0)"]);
    });

    describe("known quirks", () => {
      test("a tooltipAnchor with fewer than two entries yields NaN in the transform", () => {
        // NOTE: documented on the tooltipAnchor property in bar.ts. A shorter array
        // leaves uv[1] undefined, so y becomes NaN and the transform is invalid - silently,
        // unlike the missing-prop errors the legends log.
        expect(anchors(render(barOf().tooltipAnchor([0.5]), [testData[0]]))).toEqual([
          "translate(25,NaN)",
        ]);
        expect(anchors(render(barOf().tooltipAnchor([]), [testData[0]]))).toEqual([
          "translate(NaN,NaN)",
        ]);
      });

      test("ignores tooltipAnchor entries beyond the first two", () => {
        // NOTE: documented on the tooltipAnchor property in bar.ts.
        expect(anchors(render(barOf().tooltipAnchor([0, 0, 9]), [testData[0]]))).toEqual([
          "translate(10,20)",
        ]);
      });
    });
  });

  describe("foreign elements", () => {
    /** Appends a rect carrying only the generic class, as another component would. */
    const plantForeign = (parent: Element) => {
      const foreign = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      foreign.setAttribute("class", "sszvis-bar");
      foreign.setAttribute("x", "1");
      foreign.setAttribute("y", "2");
      foreign.setAttribute("width", "3");
      foreign.setAttribute("height", "4");
      parent.appendChild(foreign);
      return foreign;
    };

    const geometry = (node: Element) =>
      ["x", "y", "width", "height"].map((attr) => node.getAttribute(attr));

    test("should neither adopt nor mutate a foreign rect when it carries only the generic class", () => {
      // Both placements at once: the join uses a descendant selector, so a foreign rect is
      // equally reachable as a direct child and from further down, and either one being
      // adopted would shift the whole series by one.
      const g = group("foreign");
      const sibling = plantForeign(g.node() as SVGGElement);
      const nest = document.createElementNS("http://www.w3.org/2000/svg", "g");
      (g.node() as SVGGElement).appendChild(nest);
      const nested = plantForeign(nest);

      g.datum(testData).call(barOf() as never);

      const node = g.node() as SVGGElement;
      expect(bars(node).length).toBe(2);
      expect(attrs(node, "x")).toEqual(["10", "60"]);

      expect(sibling.parentNode).toBe(node);
      expect(nested.parentNode).toBe(nest);
      expect(geometry(sibling)).toEqual(["1", "2", "3", "4"]);
      expect(geometry(nested)).toEqual(["1", "2", "3", "4"]);
      expect(sibling.getAttribute("class")).toBe("sszvis-bar");
      expect(nested.getAttribute("class")).toBe("sszvis-bar");
    });
  });

  describe("transition", () => {
    test("should render the same markup whether or not transition is enabled", () => {
      const withTransition = render(barOf().transition(true), testData);
      const withoutTransition = render(barOf().transition(false), testData);
      expect(withTransition.innerHTML).toBe(withoutTransition.innerHTML);
    });

    test("should give entering bars their geometry synchronously when transition is enabled", () => {
      // The entering elements are positioned on the join, so a fresh render is correct
      // synchronously - nothing waits for the first animation frame.
      const node = render(barOf().transition(true), testData);
      expect(attrs(node, "x")).toEqual(["10", "60"]);
      expect(attrs(node, "y")).toEqual(["20", "25"]);
      expect(attrs(node, "width")).toEqual(["30", "30"]);
      expect(attrs(node, "height")).toEqual(["40", "50"]);
    });

    test("should animate the geometry towards the new values when transition is left at its default", async () => {
      // No .transition() call, so this also pins the default: were it false, the update below
      // would land on the new geometry straight away instead of still holding the old one.
      const component = barOf();
      const g = group("animated");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["0"]);

      g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(component as never);
      // The update tweens from its previous value, so it still holds it on this tick.
      expect(attrs(node, "x")).toEqual(["0"]);
      expect(attrs(node, "y")).toEqual(["0"]);
      expect(attrs(node, "width")).toEqual(["10"]);
      expect(attrs(node, "height")).toEqual(["10"]);

      await settle();
      expect(attrs(node, "x")).toEqual(["500"]);
      expect(attrs(node, "y")).toEqual(["400"]);
      expect(attrs(node, "width")).toEqual(["20"]);
      expect(attrs(node, "height")).toEqual(["30"]);
    });

    test("should write the new geometry straight away and animate nothing when transition is disabled", async () => {
      const component = barOf().transition(false);
      const g = group("no-transition");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(component as never);
      g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["500"]);
      expect(attrs(node, "height")).toEqual(["30"]);

      // Nothing was scheduled, so nothing moves afterwards either. Reading the geometry again
      // past the transition's own duration is the observable form of "no tween was created" -
      // a tween would have had to start from the old value and travel, which would show up
      // either here or in the synchronous read above.
      await settle();
      expect(attrs(node, "x")).toEqual(["500"]);
      expect(attrs(node, "height")).toEqual(["30"]);
    });

    test("should keep the geometry a synchronous render wrote when a stale tween is still in flight", async () => {
      const g = group("interrupted");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(barOf().transition(true) as never);
      // Schedules a tween from 0 towards 500.
      g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(barOf().transition(true) as never);
      // Synchronised on the tween actually moving, so the tween is provably in flight when
      // the synchronous render below lands.
      await untilMoved(bars(g.node() as SVGGElement)[0], "x");

      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(barOf().transition(false) as never);
      // The stale tween must have been interrupted: it may not tick again and reinstate its
      // own interpolation over the geometry the synchronous render just wrote. Waited out
      // past the 300ms default, so an uninterrupted tween would have reached its destination.
      await settle();

      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["0"]);
      expect(attrs(node, "y")).toEqual(["0"]);
      expect(attrs(node, "width")).toEqual(["10"]);
      expect(attrs(node, "height")).toEqual(["10"]);
    });

    test("should leave the consumer's own transition running when it re-renders the same bars", async () => {
      const g = group("consumer-tween");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(barOf().transition(false) as never);
      const node = g.node() as SVGGElement;

      // A consumer fades the bars in with its own transition, which is unnamed - that is what
      // a bare selection.transition() gives you, and it used to be the same name the
      // component's interrupt reached, so this animation was killed mid-flight.
      g.selectAll("rect.sszvis-bar-rect")
        .attr("opacity", 0)
        .transition()
        .duration(300)
        .attr("opacity", 1);
      await untilMoved(bars(g.node() as SVGGElement)[0], "opacity");

      g.datum([{ x: 5, y: 5, w: 20, h: 20 }]).call(barOf().transition(false) as never);
      // Past the consumer transition's own duration, so it has had time to finish.
      await settle();

      expect(attrs(node, "opacity")).toEqual(["1"]);
      // The component's own geometry still landed synchronously.
      expect(attrs(node, "x")).toEqual(["5"]);
      expect(attrs(node, "width")).toEqual(["20"]);
    });

    test("should land the new colour immediately rather than interpolating when the fill changes", async () => {
      // Decided rather than inherited: the colour scales these charts use are categorical,
      // and interpolating between two category colours reads as a third category. So the
      // colour is applied to the selection, with the transition left to the geometry.
      const component = barOf();
      const g = group("colour-jump");
      g.datum([testData[0]]).call(component.fill("#f00") as never);
      g.datum([testData[0]]).call(component.fill("#0f0") as never);
      const node = g.node() as SVGGElement;

      // Already the destination colour on the tick of the render, with no intermediate
      // blend, and unchanged once a tween would have run its course.
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
      await settle();
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
    });
  });
});
