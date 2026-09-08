import { type ScaleBand, type ScaleLinear, scaleBand, scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cascade } from "../../src/cascade.js";
import nestedStackedBarsVertical from "../../src/component/nestedStackedBar.js";
import {
  type StackedBarSeries,
  type StackedBarSeriesData,
  stackedBarVerticalData,
} from "../../src/component/stackedBar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type Row = { year: string; category: string; nested: string; value: number };

/** One slice of a stack: [y0, y1] plus the properties stackedBarVerticalData attaches. */
type Slice = [number, number] & { data: Row; series: string; stack: string };
/** One stack layout, tagged with the nested group it belongs to. */
type NestedStack = StackedBarSeriesData<Row>;

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
  const nestedData = (data: Row[] = rows, tag: "key" | "nest" = "key"): NestedStack[] => {
    const stackLayout = stackedBarVerticalData(
      (d: Row) => d.year,
      (d: Row) => d.category,
      (d: Row) => d.value
    );
    return cascade<Row>()
      .arrayBy((d: Row) => d.nested)
      .apply<Row[][]>(data)
      .map(
        (group: Row[]): NestedStack => Object.assign(stackLayout(group), { [tag]: group[0].nested })
      );
  };

  /** A layout for a nested group that carries no stacks at all. */
  const emptyLayout = (key: string): NestedStack =>
    Object.assign([] as StackedBarSeries<Row>[], { maxValue: 0, minValue: 0, key });

  /** The same layouts with their group key stripped, which is what the fallback is about. */
  const untaggedData = (data: Row[] = rows): NestedStack[] =>
    nestedData(data).map((stack) =>
      Object.assign(stack.slice(), { maxValue: stack.maxValue, minValue: stack.minValue })
    );

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
      .offset((d: NestedStack) => offsetScale(String(d.key)))
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
        "stroke",
      ]) {
        expect(typeof Reflect.get(component, prop)).toBe("function");
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
          .stroke("#000")
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
        `translate(${offsetScale("F")},0)`,
        `translate(${offsetScale("M")},0)`,
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
        `translate(${offsetScale("F")},0)`,
        `translate(${offsetScale("M")},0)`,
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
        `translate(${offsetScale("M")},0)`,
        `translate(${offsetScale("F")},0)`,
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

    test("should label every category of a three-value x-domain", () => {
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
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2019", "2020", "2021"]);
    });

    test("should label every category of a narrow five-value x-domain", () => {
      // No thinning is applied at any width: the axis labels every band.
      const domain = ["2017", "2018", "2019", "2020", "2021"];
      const rowsFive: Row[] = domain.map((year) => ({
        year,
        category: "A",
        nested: "F",
        value: 10,
      }));
      const component = nestedOf().xScale(
        scaleBand<string>().domain(domain).range([0, 60]).paddingInner(0.2)
      );
      const node = render(component, nestedData(rowsFive));
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(domain);
    });

    test("should render the xLabel as the axis title", () => {
      const node = render(nestedOf().xLabel("Jahr"));
      const title = axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title");
      expect(title?.textContent).toBe("Jahr");
    });

    test("should evaluate a function-valued xLabel", () => {
      const node = render(nestedOf().xLabel(() => "Jahr"));
      const title = axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title");
      expect(title?.textContent).toBe("Jahr");
    });

    test("should render no axis title without an xLabel", () => {
      const node = render(nestedOf());
      expect(axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title")).toBeNull();
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
        tooltip: () => component.tooltip(() => undefined),
      };
      for (const [name, set] of Object.entries(setters)) if (name !== skip) set();
      return component;
    };

    // Four of the nine props are required; `fill`, `stroke`, `xAcc`, `xLabel` and `slant` may
    // be omitted. Each required prop is validated before any element is created, and the error
    // names the component and the property.
    for (const prop of ["offset", "xScale", "yScale", "tooltip"]) {
      test(`should throw a named error when ${prop} is not set`, () => {
        expect(() => render(withoutProp(prop))).toThrow(
          `[nestedStackedBarsVertical] the ${prop} property is required`
        );
      });
    }

    // `xAcc` is accepted but never read: the groups take their identity from the group key, so
    // a caller that omits the accessor gets the same chart instead of an error.
    test("should render without xAcc", () => {
      const node = render(
        nestedStackedBarsVertical()
          .offset((d: NestedStack) => offsetScale(String(d.key)))
          .xScale(xScale)
          .yScale(yScale)
          .tooltip(() => undefined)
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
      expect(rects(node).length).toBe(rows.length);
    });

    test("should validate before rendering anything", () => {
      const node = render(nestedOf());
      expect(groups(node).length).toBe(2);
      const empty = group("validate-first");
      expect(() => empty.datum(nestedData()).call(withoutProp("xScale") as never)).toThrow();
      expect(groups(empty.node() as SVGGElement).length).toBe(0);
    });

    test("should render without a fill", () => {
      const component = withoutProp("none");
      const node = render(component);
      expect(rects(node).length).toBe(rows.length);
      expect(attrs(rects(node), "fill")).toEqual(Array.from({ length: rows.length }, () => null));
    });
  });

  describe("module shape", () => {
    test("should be reachable from the library barrel as the same factory", async () => {
      const sszvis = await import("../../src/index.js");
      expect(sszvis.nestedStackedBarsVertical).toBe(nestedStackedBarsVertical);
    });
  });

  describe("group identity", () => {
    test("should label every group with its own group key", () => {
      const node = render(nestedOf());
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
    });

    test("should mark every group with the attribute", () => {
      const node = render(nestedOf());
      expect(groups(node).length).toBe(2);
      for (const g of groups(node)) {
        expect(g.hasAttribute("data-nested-stacked-bars")).toBe(true);
      }
    });

    test("should accept nest as the older name of the group key", () => {
      // Most call sites tag the layout with `key`; a few use `nest`, which is what this
      // component's own docs example used to do. Both are read, `key` first.
      const node = render(
        nestedOf().offset((d: NestedStack) => offsetScale(String(d.nest))),
        nestedData(rows, "nest")
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
      expect(rects(node).length).toBe(rows.length);
    });

    test("should warn and label by index for a layout with no group key", () => {
      // Neither name is required. The label falls back to the group index and the chart still
      // renders: `offset` is the caller's own functor and need not read the key at all, so a
      // missing key is a diagnostic rather than a reason to draw nothing.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(nestedOf(), untaggedData());
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["0", "1"]);
      expect(rects(node).length).toBe(rows.length);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "[nestedStackedBarsVertical] the nested group at index 0 has no key"
        )
      );
      warn.mockRestore();
    });

    test("should name the offending index when only a later layout has no group key", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const [first] = nestedData();
      const [, second] = untaggedData();
      const node = render(nestedOf(), [first, second]);
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "1"]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "[nestedStackedBarsVertical] the nested group at index 1 has no key"
        )
      );
      warn.mockRestore();
    });
  });

  describe("empty nested groups", () => {
    test("should render an empty group rather than throwing", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(nestedOf(), [emptyLayout("E")]);
      expect(groups(node).length).toBe(1);
      expect(rects(node).length).toBe(0);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should keep the populated groups when one group is empty", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const data = [...nestedData(), emptyLayout("E")];
      const node = render(nestedOf(), data);
      expect(groups(node).length).toBe(3);
      expect(rects(node).length).toBe(rows.length);
      warn.mockRestore();
    });
  });

  describe("axis baseline", () => {
    test("should keep the axis inside the range when the y-domain excludes zero", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const offDomain = scaleLinear().domain([10, 60]).range([300, 0]);
      const node = render(nestedOf().yScale(offDomain));
      expect(offDomain(0)).toBe(360);
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe("translate(0,300)");
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should place the axis at yScale(0) for a zero-based domain", () => {
      const node = render(nestedOf());
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe(`translate(0,${yScale(0)})`);
    });

    test("should follow an inverted range", () => {
      const inverted = scaleLinear().domain([0, 60]).range([0, 300]);
      const node = render(nestedOf().yScale(inverted));
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe("translate(0,0)");
    });
  });

  describe("stroke", () => {
    test("should forward a configured stroke to every bar", () => {
      const node = render(nestedOf().stroke("#000000"));
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["#000000"]));
    });

    test("should default to a white separator stroke", () => {
      const node = render(nestedOf());
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["#FFFFFF"]));
    });

    test("should support a seamless stack with stroke none", () => {
      const node = render(nestedOf().stroke("none"));
      expect(new Set(attrs(rects(node), "stroke"))).toEqual(new Set(["none"]));
    });
  });

  describe("offset", () => {
    test("should write a valid transform when the offset accessor returns undefined", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(nestedOf().offset(() => undefined));
      expect(attrs(groups(node), "transform")).toEqual(["translate(0,0)", "translate(0,0)"]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should warn once per group for a missing offset", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(nestedOf().offset(() => undefined));
      expect(warn).toHaveBeenCalledTimes(2);
      warn.mockRestore();
    });
  });

  describe("known quirks", () => {
    test("throws when the x-scale is not a band scale", () => {
      // NOTE: `xScale.bandwidth()` is called directly, so a continuous scale fails hard. The
      // axis renders first, so the failure leaves a partially drawn chart behind.
      // @ts-expect-error - the port types xScale as a band scale, which catches this statically
      const component = nestedOf().xScale(scaleLinear().domain([0, 1]).range([0, 100]));
      expect(() => render(component)).toThrow();
    });

    test("renders zero-height bars when the y-scale is a constant", () => {
      // NOTE: `yScale` goes through `fn.functor`, so a non-function is silently boxed into a
      // constant. Unlike the x-scale, this fails silently: every bar collapses to height 0. The
      // boxed constant exposes no `range()`, so the baseline cannot be checked either.
      // @ts-expect-error - the port types yScale as a function, which catches this statically
      const node = render(nestedOf().yScale(5));
      expect(new Set(attrs(rects(node), "height"))).toEqual(new Set(["0"]));
    });
  });
});
