import { type ScaleBand, type ScaleLinear, scaleBand, scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cascade } from "../../src/cascade.js";
// @ts-expect-error - nestedStackedBar.js has no type declarations until it is ported
import { nestedStackedBarsVertical } from "../../src/component/nestedStackedBar.js";
import { stackedBarVerticalData } from "../../src/component/stackedBar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type Row = { year: string; category: string; nested: string; value: number };

/** One slice of a stack: [y0, y1] plus the properties stackedBarVerticalData attaches. */
type Slice = [number, number] & { data: Row; series: string; stack: string };
/** One stack layout (an array of series), tagged with the nested group it belongs to. */
type NestedStack = Slice[][] & { nest: string };

describe("component/nestedStackedBar", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  const rows: Row[] = [
    { year: "2020", category: "A", nested: "F", value: 10 },
    { year: "2020", category: "B", nested: "F", value: 20 },
    { year: "2021", category: "A", nested: "F", value: 15 },
    { year: "2021", category: "B", nested: "F", value: 25 },
    { year: "2020", category: "A", nested: "M", value: 5 },
    { year: "2020", category: "B", nested: "M", value: 30 },
    { year: "2021", category: "A", nested: "M", value: 8 },
    { year: "2021", category: "B", nested: "M", value: 12 },
  ];

  /** Builds the two-level structure the component expects: cascade by nest, then stack by year. */
  const nestedData = (data: Row[] = rows): NestedStack[] => {
    const stackLayout = stackedBarVerticalData(
      (d: Row) => d.year,
      (d: Row) => d.category,
      (d: Row) => d.value
    );
    return cascade<Row>()
      .arrayBy((d: Row) => d.nested)
      .apply(data)
      .map((group: Row[]) => {
        const stack = stackLayout(group) as unknown as NestedStack;
        stack.nest = group[0].nested;
        return stack;
      });
  };

  let offsetScale: ScaleBand<string>;
  let xScale: ScaleBand<string>;
  let yScale: ScaleLinear<number, number>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);

    offsetScale = scaleBand<string>().domain(["F", "M"]).range([0, 500]).paddingInner(0.2);
    xScale = scaleBand<string>()
      .domain(["2020", "2021"])
      .range([0, offsetScale.bandwidth()])
      .paddingInner(0.2);
    yScale = scaleLinear().domain([0, 60]).range([300, 0]);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `nested-${++layerKey}`,
    }).selectGroup("nested-stacked-bars");

  const render = (component: unknown, data: unknown[] = nestedData()) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /** A component wired to the test row shape, with every required prop set. */
  const nestedOf = () =>
    nestedStackedBarsVertical()
      .offset((d: NestedStack) => offsetScale(d.nest))
      .xScale(xScale)
      .yScale(yScale)
      .xAcc((d: Row) => d.year)
      .fill((d: Slice) => (d.series === "A" ? "#f00" : "#0f0"))
      .tooltip(() => undefined);

  const groups = (node: Element) => [...node.querySelectorAll("[data-nested-stacked-bars]")];
  const rects = (node: Element) => [...node.querySelectorAll("rect.sszvis-bar")];
  const axisOf = (node: Element) => node.querySelector('[data-d3-selectgroup="nested-x-axis"]');
  const barsOf = (node: Element) => node.querySelector('[data-d3-selectgroup="barchart"]');
  const attrs = (nodes: Element[], attr: string) => nodes.map((n) => n.getAttribute(attr));
  const tickLabels = (node: Element | null) =>
    [...(node?.querySelectorAll(".tick text") ?? [])].map((t) => t.textContent);

  describe("props", () => {
    test("should expose every documented prop", () => {
      const component = nestedStackedBarsVertical();
      for (const prop of [
        "offset",
        "xScale",
        "yScale",
        "fill",
        "tooltip",
        "xAcc",
        "xLabel",
        "slant",
      ]) {
        expect(typeof component[prop]).toBe("function");
      }
    });

    test("props should be chainable", () => {
      const component = nestedStackedBarsVertical();
      expect(
        component
          .offset(() => 0)
          .xScale(xScale)
          .yScale(yScale)
          .fill("#000")
          .tooltip(() => undefined)
          .xAcc((d: Row) => d.year)
          .xLabel("Jahr")
          .slant("vertical")
      ).toBe(component);
    });

    test("should read back a function-valued prop unchanged", () => {
      // Every prop except `slant` is wrapped in fn.functor, which passes functions through
      // untouched but boxes plain values, so only functions survive a get/set round-trip.
      const component = nestedStackedBarsVertical();
      expect(component.xScale(xScale).xScale()).toBe(xScale);
      expect(component.slant("diagonal").slant()).toBe("diagonal");
    });
  });

  describe("rendering", () => {
    test("should render one group per nested group", () => {
      const node = render(nestedOf());
      expect(groups(node).length).toBe(2);
      for (const g of groups(node)) expect(g.tagName).toBe("g");
    });

    test("should position each group with the offset accessor", () => {
      const node = render(nestedOf());
      expect(attrs(groups(node), "transform")).toEqual([
        `translate(${offsetScale("F")} 0)`,
        `translate(${offsetScale("M")} 0)`,
      ]);
    });

    test("should render an x-axis group per nested group, at the y-scale zero line", () => {
      const node = render(nestedOf());
      for (const g of groups(node)) {
        const axis = axisOf(g);
        expect(axis).not.toBeNull();
        expect(axis?.getAttribute("transform")).toBe(`translate(0,${yScale(0)})`);
      }
    });

    test("should render axis tick labels from the x-scale domain", () => {
      const node = render(nestedOf());
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2020", "2021"]);
    });

    test("should render a bar group holding one rect per data point", () => {
      const node = render(nestedOf());
      expect(rects(node).length).toBe(rows.length);
      for (const g of groups(node)) {
        expect(barsOf(g)).not.toBeNull();
        expect(rects(g).length).toBe(4);
      }
    });

    test("should group the rects into one sszvis-stack per series", () => {
      const node = render(nestedOf());
      const stacks = [...groups(node)[0].querySelectorAll(".sszvis-stack")];
      expect(stacks.length).toBe(2);
      for (const s of stacks) expect(rects(s).length).toBe(2);
    });

    test("should size the bars using the x-scale bandwidth", () => {
      const node = render(nestedOf());
      for (const r of rects(node)) {
        expect(r.getAttribute("width")).toBe(String(xScale.bandwidth()));
      }
    });

    test("should position the bars using the two scales", () => {
      const node = render(nestedOf());
      // stackedBarVerticalData uses stackOrderReverse, so the last key ("B", 20) sits on the
      // baseline and the first key ("A", 10) is stacked on top of it, spanning [20, 30].
      const first = rects(groups(node)[0])[0];
      expect(first.getAttribute("x")).toBe(String(xScale("2020")));
      expect(first.getAttribute("y")).toBe(String(yScale(30)));
      expect(first.getAttribute("height")).toBe(String(yScale(20) - yScale(30)));
    });

    test("should fill the bars with the fill accessor", () => {
      const node = render(nestedOf());
      const fills = new Set(attrs(rects(node), "fill"));
      expect(fills).toEqual(new Set(["#f00", "#0f0"]));
    });

    test("should accept a constant fill", () => {
      const node = render(nestedOf().fill("#123456"));
      expect(new Set(attrs(rects(node), "fill"))).toEqual(new Set(["#123456"]));
    });

    test("should render a tooltip anchor per bar", () => {
      const node = render(nestedOf());
      expect(node.querySelectorAll("[data-tooltip-anchor]").length).toBe(rows.length);
    });

    test("should pass the tooltip anchors to the tooltip component", () => {
      const calls: number[] = [];
      const tooltip = (selection: { size(): number }) => {
        calls.push(selection.size());
      };
      render(nestedOf().tooltip(tooltip));
      // NOTE: d3's selection.call() invokes the tooltip exactly once, with the anchors of
      // every nested group in one (multi-group) selection - not once per nested group.
      expect(calls).toEqual([rows.length]);
    });

    test("should render nothing for an empty data array", () => {
      const node = render(nestedOf(), []);
      expect(groups(node).length).toBe(0);
      expect(rects(node).length).toBe(0);
    });
  });

  describe("re-rendering", () => {
    test("should render in place rather than appending duplicates", () => {
      const component = nestedOf();
      const g = group("rerender");
      g.datum(nestedData()).call(component as never);
      g.datum(nestedData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(groups(node).length).toBe(2);
      expect(rects(node).length).toBe(rows.length);
    });

    test("should reuse the axis groups rather than stacking them up", () => {
      const component = nestedOf();
      const g = group("rerender-axis");
      g.datum(nestedData()).call(component as never);
      g.datum(nestedData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="nested-x-axis"]').length).toBe(2);
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2020", "2021"]);
    });

    test("should remove groups when the data shrinks", () => {
      const component = nestedOf();
      const g = group("shrink");
      g.datum(nestedData()).call(component as never);
      g.datum(nestedData(rows.filter((d) => d.nested === "F"))).call(component as never);
      const node = g.node() as SVGGElement;
      expect(groups(node).length).toBe(1);
      expect(rects(node).length).toBe(4);
    });

    test("should update the offsets when the scale changes", () => {
      const component = nestedOf();
      const g = group("reoffset");
      g.datum(nestedData()).call(component as never);
      offsetScale.range([0, 250]);
      g.datum(nestedData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(groups(node), "transform")).toEqual([
        `translate(${offsetScale("F")} 0)`,
        `translate(${offsetScale("M")} 0)`,
      ]);
    });

    test("should follow the data order when the groups are reordered", () => {
      // The join has no key function, so groups are matched by index: reordering the data
      // re-binds the existing nodes rather than moving them.
      const component = nestedOf();
      const g = group("reorder");
      g.datum(nestedData()).call(component as never);
      g.datum(nestedData().reverse()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(groups(node), "transform")).toEqual([
        `translate(${offsetScale("M")} 0)`,
        `translate(${offsetScale("F")} 0)`,
      ]);
    });
  });

  describe("axis", () => {
    test("should slant the tick labels", () => {
      const node = render(nestedOf().slant("vertical"));
      const tick = axisOf(groups(node)[0])?.querySelector(".tick text");
      expect(tick?.getAttribute("transform")).toContain("rotate(-90)");
    });

    test("should support a diagonal slant", () => {
      const node = render(nestedOf().slant("diagonal"));
      const tick = axisOf(groups(node)[0])?.querySelector(".tick text");
      expect(tick?.getAttribute("transform")).toContain("rotate(-45)");
    });

    test("should leave the tick labels upright without a slant", () => {
      const node = render(nestedOf());
      const tick = axisOf(groups(node)[0])?.querySelector(".tick text");
      expect(tick?.getAttribute("transform")).toBeNull();
    });
  });

  describe("required props", () => {
    /** The component with one prop deliberately left unset. */
    const withoutProp = (skip: string) => {
      const component = nestedStackedBarsVertical();
      const setters: Record<string, () => void> = {
        offset: () => component.offset(() => 0),
        xScale: () => component.xScale(xScale),
        yScale: () => component.yScale(yScale),
        xAcc: () => component.xAcc((d: Row) => d.year),
        tooltip: () => component.tooltip(() => undefined),
      };
      for (const [name, set] of Object.entries(setters)) if (name !== skip) set();
      return component;
    };

    // NOTE: five of the eight props are required; only `fill`, `xLabel` and `slant` may be
    // omitted. None of the five is defaulted or validated, so each one fails at render time
    // with a low-level TypeError instead of a message naming the missing prop.
    for (const prop of ["offset", "xScale", "yScale", "xAcc", "tooltip"]) {
      test(`should throw when ${prop} is not set`, () => {
        expect(() => render(withoutProp(prop))).toThrow();
      });
    }

    test("should render without a fill", () => {
      const component = withoutProp("none");
      const node = render(component);
      expect(rects(node).length).toBe(rows.length);
      expect(attrs(rects(node), "fill")).toEqual(Array.from({ length: rows.length }, () => null));
    });
  });

  describe("known quirks", () => {
    test("labels every group with the first datum's x-value instead of the nest key", () => {
      // NOTE: the group is identified by `xAcc(d[0][0].data)`, the x-value of the first
      // slice, which is the same for every nested group. Nothing breaks - the attribute is
      // only ever used as a presence selector - but it cannot identify the group it names.
      const node = render(nestedOf());
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["2020", "2020"]);
    });

    test("throws for a nested group with no stacks", () => {
      // NOTE: `xAcc(d[0][0].data)` reaches two levels into the datum without a guard, so an
      // empty group - which cascade produces for a filtered-out category - throws.
      expect(() => render(nestedOf(), [[]])).toThrow();
    });

    test("renders the source of the xLabel function as the axis title", () => {
      // BUG: `xLabel` is wrapped in `fn.functor` but `axis.title()` expects a string, so d3
      // stringifies the wrapper into the title text. There is no input that works: a string
      // renders as the functor source, a function renders as its own source.
      const node = render(nestedOf().xLabel("Jahr"));
      const title = axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title");
      expect(title?.textContent).not.toBe("Jahr");
      expect(title?.textContent ?? "").toMatch(/^\s*(function|\()/);
    });

    test("renders the source of a function xLabel too", () => {
      // BUG: same root cause - `xLabel` cannot be set at all in its current form.
      const node = render(nestedOf().xLabel(() => "Jahr"));
      const title = axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title");
      expect(title?.textContent).not.toBe("Jahr");
    });

    test("drops all but the first and last tick label", () => {
      // BUG: `ticks(1)` is hardcoded, and `axisX.ordinal` reinterprets it as "keep the first
      // and last domain value plus 1 in between", so with three or more x-categories the
      // middle labels silently disappear. The library's own example uses two categories.
      const threeYears: Row[] = [
        { year: "2019", category: "A", nested: "F", value: 10 },
        { year: "2020", category: "A", nested: "F", value: 20 },
        { year: "2021", category: "A", nested: "F", value: 30 },
      ];
      const component = nestedOf().xScale(
        scaleBand<string>().domain(["2019", "2020", "2021"]).range([0, 300]).paddingInner(0.2)
      );
      const node = render(component, nestedData(threeYears));
      expect(rects(node).length).toBe(3);
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2019", "2021"]);
    });

    test("places the axis outside the chart when the y-domain excludes zero", () => {
      // NOTE: the axis is placed at `yScale(0)`, which a linear scale happily extrapolates
      // past the end of its range. A y-domain that does not start at 0 pushes the axis of
      // every nested group off the bottom of the chart, with no warning.
      const offDomain = scaleLinear().domain([10, 60]).range([300, 0]);
      const node = render(nestedOf().yScale(offDomain));
      expect(offDomain(0)).toBe(360);
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe("translate(0,360)");
    });

    test("throws when the x-scale is not a band scale", () => {
      // NOTE: `xScale.bandwidth()` is called directly, so a continuous scale fails hard. The
      // axis renders first, so the failure leaves a partially drawn chart behind.
      const component = nestedOf().xScale(scaleLinear().domain([0, 1]).range([0, 100]));
      expect(() => render(component)).toThrow();
    });

    test("renders zero-height bars when the y-scale is a constant", () => {
      // NOTE: `yScale` goes through `fn.functor`, so a non-function is silently boxed into a
      // constant. Unlike the x-scale, this fails silently: every bar collapses to height 0.
      const node = render(nestedOf().yScale(5));
      expect(new Set(attrs(rects(node), "height"))).toEqual(new Set(["0"]));
    });

    test("writes an invalid transform when the offset accessor returns undefined", () => {
      // NOTE: the offset is interpolated straight into the transform string with no guard,
      // so a scale miss (a nest key outside the domain) silently produces
      // "translate(undefined 0)". The axis on the next line uses `translateString` instead.
      const node = render(nestedOf().offset(() => undefined));
      expect(attrs(groups(node), "transform")).toEqual([
        "translate(undefined 0)",
        "translate(undefined 0)",
      ]);
    });

    test("forces a white stroke on every bar", () => {
      // NOTE: `stackedBarVertical` defaults `stroke` to #FFFFFF and this component does not
      // expose the prop, so the separator colour cannot be changed or removed.
      const node = render(nestedOf());
      expect(nestedStackedBarsVertical().stroke).toBeUndefined();
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["#FFFFFF"]));
    });
  });
});
