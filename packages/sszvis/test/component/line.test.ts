import { afterEach, beforeEach, describe, expect, test } from "vitest";
import line from "../../src/component/line.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
import "../../src/d3-selectgroup.js";

type Point = { x: number; y: number };

describe("component/line", () => {
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
      key: key ?? `line-${++layerKey}`,
    }).selectGroup("lines");

  const render = (component: unknown, data: unknown[]) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * A line wired to the test point shape.
   *
   * transition is disabled because the "d" attribute is only written inside the
   * transition when it is on, so nothing is observable on the synchronous tick.
   * See the transition block at the bottom of this file.
   */
  const lineOf = () =>
    line()
      .transition(false)
      .x((d: Point) => d.x)
      .y((d: Point) => d.y);

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
   * Waits out the component's 300ms transition, so that a value read afterwards is the one
   * the render settled on rather than one some tween is still moving.
   */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

  const paths = (node: Element) => [...node.querySelectorAll("path.sszvis-line")];
  const ds = (node: Element) => paths(node).map((p) => p.getAttribute("d"));
  const styles = (node: Element, prop: string) =>
    paths(node).map((p) => (p as SVGPathElement).style.getPropertyValue(prop));

  const oneLine = [
    [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 10 },
    ],
  ];
  const twoLines = [
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    [
      { x: 0, y: 50 },
      { x: 10, y: 60 },
    ],
  ];

  describesTheMarkJoin<Point[]>(() => ({
    make: lineOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ paths: paths(node).length }),
    full: { data: twoLines, marks: { paths: 2 } },
    smaller: { data: [twoLines[0]], marks: { paths: 1 } },
  }));

  describe("rendering", () => {
    test("should build each path's d from the x and y accessors, one line's points at a time", () => {
      expect(ds(render(lineOf(), oneLine))).toEqual(["M0,0L10,20L20,10"]);
      // Two lines in one render: each path is drawn from its own inner array, so neither
      // picks up the other's points.
      expect(ds(render(lineOf(), twoLines))).toEqual(["M0,0L10,10", "M0,50L10,60"]);
    });

    test("should redraw the path when the data changes", () => {
      const component = lineOf();
      const g = group("update");
      g.datum(oneLine).call(component as never);
      g.datum([
        [
          { x: 5, y: 5 },
          { x: 15, y: 15 },
        ],
      ]).call(component as never);
      expect(ds(g.node() as SVGGElement)).toEqual(["M5,5L15,15"]);
    });

    test("should reorder the existing paths when the data order changes", () => {
      const component = lineOf().key((d: Point[]) => d[0].y);
      const g = group("order");
      g.datum(twoLines).call(component as never);
      g.datum([twoLines[1], twoLines[0]]).call(component as never);
      // path.order() moves the existing nodes, it does not redraw them
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,50L10,60", "M0,0L10,10"]);
    });
  });

  describe("accessors", () => {
    test("should call the point-level callbacks with the point, its index and the whole line", () => {
      // x, y and defined are all handed to d3.line, so they share one signature. Asserted
      // together because a change to how the points are passed moves all of them at once.
      const seenByX: unknown[][] = [];
      const seenByDefined: unknown[][] = [];
      render(
        line()
          .transition(false)
          .x((...args: unknown[]) => {
            seenByX.push(args);
            return 0;
          })
          .y(() => 0)
          .defined((...args: unknown[]) => {
            seenByDefined.push(args);
            return true;
          }),
        [oneLine[0]],
      );

      for (const seen of [seenByX, seenByDefined]) {
        expect(seen.map((args) => args.length)).toEqual([3, 3, 3]);
        expect(seen.map((args) => args[0])).toEqual(oneLine[0]);
        expect(seen.map((args) => args[1])).toEqual([0, 1, 2]);
        expect(seen.map((args) => args[2])).toEqual([oneLine[0], oneLine[0], oneLine[0]]);
      }
    });

    test("should call the style accessors with the whole line array and its index", () => {
      const seen: unknown[][] = [];
      render(
        lineOf().stroke((...args: unknown[]) => {
          seen.push(args);
          return "#f00";
        }),
        twoLines,
      );
      // Style accessors receive the array of points, not a single point - the inverse of
      // what x and y receive.
      expect(seen[0][0]).toEqual(twoLines[0]);
      expect(seen.map((args) => args[1])).toContain(0);
      expect(seen.map((args) => args[1])).toContain(1);
    });
  });

  describe("defined", () => {
    test("should break the line into subpaths when a point's x or y is not a number", () => {
      // The default predicate guards both dimensions. Each surviving run becomes its own
      // subpath, and a run of one point is emitted as a degenerate "M...Z" by d3.line.
      const brokenByNaNY = render(lineOf(), [
        [
          { x: 0, y: 0 },
          { x: 10, y: Number.NaN },
          { x: 20, y: 20 },
        ],
      ]);
      expect(ds(brokenByNaNY)).toEqual(["M0,0ZM20,20Z"]);

      const brokenByUndefinedY = render(lineOf(), [
        [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: undefined as unknown as number },
          { x: 15, y: 15 },
          { x: 20, y: 20 },
        ],
      ]);
      expect(ds(brokenByUndefinedY)).toEqual(["M0,0L5,5M15,15L20,20"]);

      // A NaN x is what a scale returns for an out-of-domain value or a missing category,
      // and before both dimensions were guarded it went into the d attribute verbatim -
      // which made the browser drop that segment and every segment after it, silently
      // truncating the series.
      const brokenByNaNX = render(lineOf(), [
        [
          { x: 0, y: 0 },
          { x: 30, y: 40 },
          { x: Number.NaN, y: 10 },
          { x: 60, y: 80 },
        ],
      ]);
      expect(ds(brokenByNaNX)).toEqual(["M0,0L30,40M60,80Z"]);
      // The healthy tail after the bad point survives, rather than being amputated.
      expect((paths(brokenByNaNX)[0] as SVGPathElement).getTotalLength()).toBe(50);
    });

    describe("known quirks", () => {
      test("a null y is plotted as zero instead of breaking the line", () => {
        // NOTE: the default predicate uses the global isNaN, which coerces first, and
        // Number(null) is 0. So a null - the usual shape of a gap in a CSV - passes the
        // guard and d3 plots it at the top of the chart. The same coercion trap is
        // documented on bar's handleMissingVal. See the coercion table below for which
        // values break the line and which slip through.
        const node = render(lineOf(), [
          [
            { x: 0, y: 0 },
            { x: 10, y: null as unknown as number },
            { x: 20, y: 20 },
          ],
        ]);
        expect(ds(node)).toEqual(["M0,0L10,0L20,20"]);
      });

      test("only values that coerce to NaN break the line", () => {
        // NOTE: the guard is not a numeric type check, it is `!isNaN(y)`. This table is
        // the line equivalent of the coercion cases documented on bar's handleMissingVal.
        const yOf = (value: unknown) =>
          ds(
            render(lineOf(), [
              [
                { x: 0, y: 0 },
                { x: 10, y: value as number },
                { x: 20, y: 20 },
              ],
            ]),
          )[0];

        // Coerce to NaN, so the line breaks into two degenerate subpaths.
        expect(yOf("abc")).toBe("M0,0ZM20,20Z");
        expect(yOf({})).toBe("M0,0ZM20,20Z");
        // Coerce to a number, so they are plotted as if they were data.
        expect(yOf("")).toBe("M0,0L10,0L20,20");
        expect(yOf([])).toBe("M0,0L10,0L20,20");
        expect(yOf(true)).toBe("M0,0L10,1L20,20");
        expect(yOf("50")).toBe("M0,0L10,50L20,20");
      });

      test("Infinity passes the guard and truncates the rendered line", () => {
        // BUG: a scale over a zero-width domain returns Infinity, which is a number as far
        // as isNaN is concerned. It reaches the d attribute, where it is not a valid SVG
        // coordinate, so the browser drops that segment and everything after it. bar has
        // the same hole in handleMissingVal, and it fails just as silently here.
        const node = render(lineOf(), [
          [
            { x: 0, y: 0 },
            { x: 30, y: 40 },
            { x: 10, y: Number.POSITIVE_INFINITY },
            { x: 60, y: 80 },
          ],
        ]);
        expect(ds(node)).toEqual(["M0,0L30,40L10,InfinityL60,80"]);
        expect((paths(node)[0] as SVGPathElement).getTotalLength()).toBe(50);
      });

      test("setting defined silently gives up the NaN guard", () => {
        // NOTE: defined replaces the default rather than composing with it, so a
        // predicate written for some other purpose - filtering a date range, say - lets
        // NaN y values back into the path.
        const node = render(
          lineOf().defined(() => true),
          [
            [
              { x: 0, y: 0 },
              { x: 10, y: Number.NaN },
            ],
          ],
        );
        expect(ds(node)).toEqual(["M0,0L10,NaN"]);
      });
    });
  });

  describe("stroke and strokeWidth", () => {
    test("should apply a constant stroke to every line", () => {
      // Note that stroke and strokeWidth are written as inline styles here, where bar and
      // dot write fill and stroke as attributes. An inline style outranks a stylesheet
      // rule, so a theme can restyle a bar but never a line.
      const node = render(lineOf().stroke("#f00"), twoLines);
      expect(styles(node, "stroke")).toEqual(["rgb(255, 0, 0)", "rgb(255, 0, 0)"]);
    });

    test("should apply a stroke derived from the line's own data", () => {
      const node = render(
        lineOf().stroke((d: Point[]) => (d[0].y === 0 ? "#f00" : "#00f")),
        twoLines,
      );
      expect(styles(node, "stroke")).toEqual(["rgb(255, 0, 0)", "rgb(0, 0, 255)"]);
    });

    test("should apply strokeWidth whether it is a constant or derived from the line's own data", () => {
      expect(styles(render(lineOf().strokeWidth(4), oneLine), "stroke-width")).toEqual(["4"]);

      const derived = render(
        lineOf().strokeWidth((d: Point[]) => d.length),
        twoLines,
      );
      expect(styles(derived, "stroke-width")).toEqual(["2", "2"]);
    });

    describe("known quirks", () => {
      test("an unset stroke leaves no stroke at all, not black", () => {
        // NOTE: the JSDoc promises "if left undefined, the stroke is black", but nothing
        // sets one - not the component, and not the .sszvis-line rule in sszvis.css,
        // which only sets fill and stroke-width. The SVG initial value for stroke is
        // none, so a line without a stroke accessor renders invisibly. Every chart in
        // docs/line-chart sets stroke explicitly, so this is a documentation bug rather
        // than a live rendering one.
        const node = render(lineOf(), oneLine);
        expect(paths(node)[0].getAttribute("style")).toBeNull();
        expect(getComputedStyle(paths(node)[0]).stroke).toBe("none");
      });

      test("an unset strokeWidth leaves no width, so the CSS default of 1.1 applies", () => {
        // NOTE: the JSDoc says the default strokeWidth is 1. The component sets nothing,
        // so the effective default is the 1.1 in the .sszvis-line rule of sszvis.css.
        const node = render(lineOf(), oneLine);
        expect(styles(node, "stroke-width")).toEqual([""]);
      });

      test("the stroke accessor is invoked twice per line", () => {
        // NOTE: stroke is applied on the join and then applied again a few lines later,
        // together with strokeWidth. Harmless for a pure accessor, but a stroke built
        // from an expensive scale lookup pays for it on every render.
        let calls = 0;
        render(
          lineOf().stroke(() => {
            calls += 1;
            return "#f00";
          }),
          oneLine,
        );
        expect(calls).toBe(2);
      });
    });
  });

  describe("valuesAccessor", () => {
    test("should pull the points out of a wrapper object when valuesAccessor is set", () => {
      const node = render(
        lineOf().valuesAccessor((d: { values: Point[] }) => d.values),
        [
          {
            values: [
              { x: 0, y: 0 },
              { x: 10, y: 10 },
            ],
          },
        ],
      );
      expect(ds(node)).toEqual(["M0,0L10,10"]);
    });

    describe("known quirks", () => {
      test("the style accessors see the wrapper, but defined and x/y see the points", () => {
        // NOTE: valuesAccessor is applied only on the way into d3.line. stroke,
        // strokeWidth and key still receive the raw datum, so a grouped-data shape needs
        // two different accessors for what reads like one line of data.
        let strokeSaw: unknown;
        const node = render(
          lineOf()
            .valuesAccessor((d: { values: Point[] }) => d.values)
            .stroke((d: unknown) => {
              strokeSaw = d;
              return "#f00";
            }),
          [{ values: [{ x: 0, y: 0 }], key: "a" }],
        );
        expect(strokeSaw).toEqual({ values: [{ x: 0, y: 0 }], key: "a" });
        expect(ds(node)).toEqual(["M0,0Z"]);
      });
    });
  });

  describe("key", () => {
    test("should match lines by position when no key is given", () => {
      const component = lineOf();
      const g = group("defaultkey");
      g.datum(twoLines).call(component as never);
      const before = paths(g.node() as SVGGElement);
      g.datum([
        [
          { x: 9, y: 9 },
          { x: 8, y: 8 },
        ],
      ]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[0]);
      expect(ds(g.node() as SVGGElement)).toEqual(["M9,9L8,8"]);
    });

    test("should reuse the same path element for the same key when a key is given", () => {
      // The key function is read with the raw datum and its index - the wrapper, not the
      // points - which is what lets a key like d[0].y or d.category work at all.
      const seen: unknown[][] = [];
      const component = lineOf().key((d: Point[], index: number) => {
        seen.push([d, index]);
        return d[0].y;
      });
      const g = group("keyed");
      g.datum(twoLines).call(component as never);
      expect(seen.map((args) => args[0])).toEqual(twoLines);
      expect(seen.map((args) => args[1])).toEqual([0, 1]);

      const before = paths(g.node() as SVGGElement);
      // Only the line keyed 50 survives, and it must reuse the second node.
      g.datum([
        [
          { x: 0, y: 50 },
          { x: 30, y: 70 },
        ],
      ]).call(component as never);
      const after = paths(g.node() as SVGGElement);
      expect(after.length).toBe(1);
      expect(after[0]).toBe(before[1]);
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,50L30,70"]);
    });
  });

  describe("edge cases", () => {
    test("should still render a path element when a line has too few points to draw", () => {
      // The path is kept either way, so the join stays aligned with the data and a line
      // that briefly runs out of points does not lose its node.
      const empty = render(lineOf(), [[]]);
      expect(paths(empty).length).toBe(1);
      expect(ds(empty)).toEqual([null]);

      // d3.line closes a one-point segment, which is how a single point reaches the DOM.
      expect(ds(render(lineOf(), [[{ x: 5, y: 5 }]]))).toEqual(["M5,5Z"]);
    });

    test("should name the component and the property when a required property is not configured", () => {
      // Both required properties fail the same way. A missing x used to resolve to
      // undefined for every point, which the guard treated as missing, so the path element
      // was left empty and the line simply vanished with a clean console.
      expect(() => render(line().transition(false).x(0), oneLine)).toThrow(
        "[line] the y property is required",
      );
      expect(() =>
        render(
          line()
            .transition(false)
            .y((d: Point) => d.y),
          oneLine,
        ),
      ).toThrow("[line] the x property is required");
    });

    test("should create no path at all when a required property is missing", () => {
      const g = group("line-missing-prop");
      expect(() => g.datum(oneLine).call(line().transition(false).x(0) as never)).toThrow();
      expect(paths(g.node() as SVGGElement)).toEqual([]);
    });

    test("should draw the line when x or y is given as a constant", () => {
      // bar wraps every accessor in fn.functor and dot wraps all five of its properties, so
      // a constant is accepted where an accessor is; line now does the same. A constant y
      // used to throw, because the default defined predicate called it, while a constant x
      // passed straight through to d3.line.
      const constantX = render(
        line()
          .transition(false)
          .x(5)
          .y((d: Point) => d.y),
        [[{ y: 1 }, { y: 2 }]],
      );
      expect(ds(constantX)).toEqual(["M5,1L5,2"]);

      const constantY = render(line().transition(false).x(5).y(7), [[{}, {}]]);
      expect(ds(constantY)).toEqual(["M5,7L5,7"]);

      expect(ds(render(line().transition(false).x(3).y(4), [[{}]]))).toEqual(["M3,4Z"]);
    });

    test("should keep or drop points as the predicate says when defined is set explicitly", () => {
      // The escape hatch callers use today: defined replaces the default guard rather than
      // composing with it, so a predicate that returns true keeps points the default would
      // have dropped - and one that returns false drops points it would have kept.
      const kept = render(
        line()
          .transition(false)
          .x((d: Point) => d.x)
          .y(() => Number.NaN)
          .defined(() => true),
        [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
          ],
        ],
      );
      expect(ds(kept)).toEqual(["M0,NaNL10,NaN"]);

      const dropped = render(
        line()
          .transition(false)
          .x((d: Point) => d.x)
          .y((d: Point) => d.y)
          .defined(() => false),
        oneLine,
      );
      expect(ds(dropped)).toEqual([null]);
    });
  });

  describe("transition", () => {
    test("should report transition as enabled when it has not been configured", () => {
      expect(line().transition()).toBe(true);
    });

    test("should write the geometry and the stroke width straight away when transition is disabled", () => {
      const node = render(lineOf().strokeWidth(3), oneLine);
      expect(ds(node)).toEqual(["M0,0L10,20L20,10"]);
      expect(styles(node, "stroke-width")).toEqual(["3"]);
    });

    test("should keep the synchronous geometry when an in-flight tween is still running", async () => {
      const animated = () =>
        line()
          .x((d: Point) => d.x)
          .y((d: Point) => d.y);
      const g = group("interrupted");
      g.datum(oneLine).call(animated() as never);
      await settle();
      // Schedules a tween towards a different shape.
      g.datum(twoLines).call(animated() as never);
      await untilMoved(paths(g.node() as SVGGElement)[0], "d");

      g.datum(oneLine).call(animated().transition(false) as never);
      // Past the 300ms default, so an uninterrupted tween would have reached its destination.
      await settle();

      expect(ds(g.node() as SVGGElement)).toEqual(["M0,0L10,20L20,10"]);
    });

    test("should animate the path through intermediate shapes when transition is enabled", async () => {
      const component = line()
        .x((d: Point) => d.x)
        .y((d: Point) => d.y);
      const g = group("animated");
      g.datum(oneLine).call(component as never);
      await settle();
      const settled = ds(g.node() as SVGGElement);
      expect(settled).toEqual(["M0,0L10,20L20,10"]);

      g.datum([
        [
          { x: 0, y: 0 },
          { x: 10, y: 20 },
          { x: 200, y: 100 },
        ],
      ]).call(component as never);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const midway = ds(g.node() as SVGGElement)[0] as string;
      // Partway through the 300ms transition the endpoint is somewhere between the two.
      expect(midway).not.toBe("M0,0L10,20L20,10");
      expect(midway).not.toBe("M0,0L10,20L200,100");

      await settle();
      expect(ds(g.node() as SVGGElement)).toEqual(["M0,0L10,20L200,100"]);
    });

    test("should apply the stroke straight away even when transition is enabled", () => {
      // stroke is set on the join, before the transition is created.
      const node = render(
        line()
          .x((d: Point) => d.x)
          .y((d: Point) => d.y)
          .stroke("#f00"),
        oneLine,
      );
      expect(styles(node, "stroke")).toEqual(["rgb(255, 0, 0)"]);
    });

    describe("known quirks", () => {
      test("an entering line has no d attribute at all on the first tick", () => {
        // BUG: with the default transition, d and stroke-width are only written through
        // the transition, so a freshly rendered chart has an empty <path> until the
        // first animation frame runs. Anything that measures the path immediately -
        // getTotalLength, a bounding box, a server-side or synchronous screenshot -
        // sees nothing. bar and dot both write their geometry synchronously first.
        const node = render(
          line()
            .x((d: Point) => d.x)
            .y((d: Point) => d.y)
            .strokeWidth(3),
          oneLine,
        );
        expect(paths(node).length).toBe(1);
        expect(ds(node)).toEqual([null]);
        expect(styles(node, "stroke-width")).toEqual([""]);
      });

      test("an entering line snaps to its final shape instead of animating", async () => {
        // NOTE: the consequence of the above. d3 interpolates the d attribute from the
        // element's current value, which is null, so there are no matching numbers to
        // interpolate and the tween returns the target string immediately. Enter is a
        // jump; only update actually animates.
        const g = group("enter-snap");
        g.datum(oneLine).call(
          line()
            .x((d: Point) => d.x)
            .y((d: Point) => d.y) as never,
        );
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(ds(g.node() as SVGGElement)).toEqual(["M0,0L10,20L20,10"]);
      });
    });
  });
});
