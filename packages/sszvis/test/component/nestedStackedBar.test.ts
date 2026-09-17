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
import { describesTheMarkJoin } from "../support/componentConformance.js";
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
      (d: Row) => d.value,
    );
    return cascade<Row>()
      .arrayBy((d: Row) => d.nested)
      .apply<Row[][]>(data)
      .map((group: Row[]): NestedStack =>
        Object.assign(stackLayout(group), { [tag]: group[0].nested }),
      );
  };

  /** A layout for a nested group that carries no stacks at all. */
  const emptyLayout = (key: string): NestedStack =>
    Object.assign([] as StackedBarSeries<Row>[], { maxValue: 0, minValue: 0, key });

  /** The same layouts with their group key stripped, which is what the fallback is about. */
  const untaggedData = (data: Row[] = rows): NestedStack[] =>
    nestedData(data).map((stack) =>
      Object.assign(stack.slice(), { maxValue: stack.maxValue, minValue: stack.minValue }),
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
    test("should read a prop back unchanged when it was set to a function", () => {
      // Every prop except `slant` is wrapped in fn.functor, which passes functions through
      // untouched but boxes plain values, so only functions survive a get/set round-trip.
      const component = nestedStackedBarsVertical();
      expect(component.xScale(xScale).xScale()).toBe(xScale);
      expect(component.slant("diagonal").slant()).toBe("diagonal");
    });
  });

  describesTheMarkJoin<NestedStack>(() => ({
    make: nestedOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({
      groups: groups(node).length,
      rects: rects(node).length,
      anchors: node.querySelectorAll("[data-tooltip-anchor]").length,
    }),
    full: { data: nestedData(), marks: { groups: 2, rects: 8, anchors: 8 } },
    smaller: {
      data: nestedData(rows.filter((d) => d.nested === "F")),
      marks: { groups: 1, rects: 4, anchors: 4 },
    },
  }));

  describe("rendering", () => {
    test("should render each nested group as a g element when the layout is bound to it", () => {
      // How many groups there are is covered by the shared join contract above; what is left
      // here is that the group-key attribute the count selects on sits on a <g>.
      const node = render(nestedOf());
      for (const g of groups(node)) expect(g.tagName).toBe("g");
    });

    test("should position each group where the offset accessor puts it", () => {
      const node = render(nestedOf());
      expect(attrs(groups(node), "transform")).toEqual([
        `translate(${offsetScale("F")},0)`,
        `translate(${offsetScale("M")},0)`,
      ]);
    });

    test("should put an x-axis group at the y-scale zero line in every nested group", () => {
      const node = render(nestedOf());
      for (const g of groups(node)) {
        const axis = axisOf(g);
        expect(axis).not.toBeNull();
        expect(axis?.getAttribute("transform")).toBe(`translate(0,${yScale(0)})`);
      }
    });

    test("should take the axis tick labels from the x-scale domain", () => {
      const node = render(nestedOf());
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2020", "2021"]);
    });

    test("should give every nested group its own bar group when the layout is bound to it", () => {
      // The flat rect count is covered by the shared join contract above; the per-group split
      // and the barchart group the rects live in are not expressible as a flat count.
      const node = render(nestedOf());
      for (const g of groups(node)) {
        expect(barsOf(g)).not.toBeNull();
        expect(rects(g).length).toBe(4);
      }
    });

    test("should size the bars from the x-scale bandwidth when it renders", () => {
      const node = render(nestedOf());
      for (const r of rects(node)) {
        expect(r.getAttribute("width")).toBe(String(xScale.bandwidth()));
      }
    });

    test("should position the bars from the two scales when it renders", () => {
      const node = render(nestedOf());
      // stackedBarVerticalData uses stackOrderReverse, so the last key ("B", 20) sits on the
      // baseline and the first key ("A", 10) is stacked on top of it, spanning [20, 30].
      const first = rects(groups(node)[0])[0];
      expect(first.getAttribute("x")).toBe(String(xScale("2020")));
      expect(first.getAttribute("y")).toBe(String(yScale(30)));
      expect(first.getAttribute("height")).toBe(String(yScale(20) - yScale(30)));
    });

    test("should forward fill to the bars whether it is a colour or an accessor", () => {
      expect(new Set(attrs(rects(render(nestedOf())), "fill"))).toEqual(new Set(["#f00", "#0f0"]));
      expect(new Set(attrs(rects(render(nestedOf().fill("#123456"))), "fill"))).toEqual(
        new Set(["#123456"]),
      );
    });

    test("should render one tooltip anchor per bar when it renders", () => {
      const node = render(nestedOf());
      expect(node.querySelectorAll("[data-tooltip-anchor]").length).toBe(rows.length);
    });

    test("should call the tooltip once with every nested group's anchors rather than once per group", () => {
      const calls: number[] = [];
      const tooltip = (selection: { size(): number }) => {
        calls.push(selection.size());
      };
      render(nestedOf().tooltip(tooltip));
      // NOTE: d3's selection.call() invokes the tooltip exactly once, with the anchors of
      // every nested group in one (multi-group) selection - not once per nested group.
      expect(calls).toEqual([rows.length]);
    });
  });

  describe("re-rendering", () => {
    test("should reuse the axis groups rather than stack them up when it renders twice", () => {
      const component = nestedOf();
      const g = group("rerender-axis");
      g.datum(nestedData()).call(component as never);
      g.datum(nestedData()).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="nested-x-axis"]').length).toBe(2);
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2020", "2021"]);
    });

    test("should move the groups when the offset scale changes", () => {
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
    test("should rotate the tick labels by the angle the slant names, and not at all without one", () => {
      const tickOf = (node: Element) =>
        axisOf(groups(node)[0])?.querySelector(".tick text")?.getAttribute("transform");

      expect(tickOf(render(nestedOf().slant("vertical")))).toContain("rotate(-90)");
      expect(tickOf(render(nestedOf().slant("diagonal")))).toContain("rotate(-45)");
      // The negative control on the same code path: no slant writes no transform at all.
      expect(tickOf(render(nestedOf()))).toBeNull();
    });

    test("should label every category when the x-domain has three values", () => {
      const threeYears: Row[] = [
        { year: "2019", category: "A", nested: "F", value: 10 },
        { year: "2020", category: "A", nested: "F", value: 20 },
        { year: "2021", category: "A", nested: "F", value: 30 },
      ];
      const component = nestedOf().xScale(
        scaleBand<string>().domain(["2019", "2020", "2021"]).range([0, 300]).paddingInner(0.2),
      );
      const node = render(component, nestedData(threeYears));
      expect(rects(node).length).toBe(3);
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(["2019", "2020", "2021"]);
    });

    test("should label every category when a five-value x-domain is drawn narrow", () => {
      // No thinning is applied at any width: the axis labels every band.
      const domain = ["2017", "2018", "2019", "2020", "2021"];
      const rowsFive: Row[] = domain.map((year) => ({
        year,
        category: "A",
        nested: "F",
        value: 10,
      }));
      const component = nestedOf().xScale(
        scaleBand<string>().domain(domain).range([0, 60]).paddingInner(0.2),
      );
      const node = render(component, nestedData(rowsFive));
      expect(tickLabels(axisOf(groups(node)[0]))).toEqual(domain);
    });

    test("should title the axis with xLabel, evaluating it when it is a function, and leave it untitled without one", () => {
      const titleOf = (node: Element) =>
        axisOf(groups(node)[0])?.querySelector(".sszvis-axis__title")?.textContent ?? null;

      expect(titleOf(render(nestedOf().xLabel("Jahr")))).toBe("Jahr");
      // The non-obvious case: a function-valued label is evaluated rather than stringified.
      expect(titleOf(render(nestedOf().xLabel(() => "Jahr")))).toBe("Jahr");
      expect(
        axisOf(groups(render(nestedOf()))[0])?.querySelector(".sszvis-axis__title"),
      ).toBeNull();
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
          `[nestedStackedBarsVertical] the ${prop} property is required`,
        );
      });
    }

    // `xAcc` is accepted but never read: the groups take their identity from the group key, so
    // a caller that omits the accessor gets the same chart instead of an error.
    test("should render without complaint when the deprecated xAcc is not set", () => {
      const node = render(
        nestedStackedBarsVertical()
          .offset((d: NestedStack) => offsetScale(String(d.key)))
          .xScale(xScale)
          .yScale(yScale)
          .tooltip(() => undefined),
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
      expect(rects(node).length).toBe(rows.length);
    });

    test("should leave the layer empty when a required prop is missing", () => {
      const node = render(nestedOf());
      expect(groups(node).length).toBe(2);
      const empty = group("validate-first");
      expect(() => empty.datum(nestedData()).call(withoutProp("xScale") as never)).toThrow();
      expect(groups(empty.node() as SVGGElement).length).toBe(0);
    });

    test("should write no fill attribute when fill is not set", () => {
      const component = withoutProp("none");
      const node = render(component);
      expect(rects(node).length).toBe(rows.length);
      expect(attrs(rects(node), "fill")).toEqual(Array.from({ length: rows.length }, () => null));
    });
  });

  describe("module shape", () => {
    test("should be the same factory when reached through the library barrel", async () => {
      const sszvis = await import("../../src/index.js");
      expect(sszvis.nestedStackedBarsVertical).toBe(nestedStackedBarsVertical);
    });
  });

  describe("group identity", () => {
    test("should label every group with its own group key when it renders", () => {
      const node = render(nestedOf());
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
    });

    test("should still find the key when a layout uses the older name nest", () => {
      // Most call sites tag the layout with `key`; a few use `nest`, which is what this
      // component's own docs example used to do. Both are read, `key` first.
      const node = render(
        nestedOf().offset((d: NestedStack) => offsetScale(String(d.nest))),
        nestedData(rows, "nest"),
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "M"]);
      expect(rects(node).length).toBe(rows.length);
    });

    test("should warn and label by index when a layout has no group key", () => {
      // Neither name is required. The label falls back to the group index and the chart still
      // renders: `offset` is the caller's own functor and need not read the key at all, so a
      // missing key is a diagnostic rather than a reason to draw nothing. This offset ignores
      // the key so the only warning under test is the missing-key one.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(
        nestedOf().offset(() => 0),
        untaggedData(),
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["0", "1"]);
      expect(rects(node).length).toBe(rows.length);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "[nestedStackedBarsVertical] the nested group at index 0 has no key",
        ),
      );
      warn.mockRestore();
    });

    test("should name the offending index when only a later layout has no group key", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const [first] = nestedData();
      const [, second] = untaggedData();
      // A key-independent offset again, so the untagged group warns only about its missing key.
      const node = render(
        nestedOf().offset(() => 0),
        [first, second],
      );
      expect(attrs(groups(node), "data-nested-stacked-bars")).toEqual(["F", "1"]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "[nestedStackedBarsVertical] the nested group at index 1 has no key",
        ),
      );
      warn.mockRestore();
    });
  });

  describe("empty nested groups", () => {
    test("should render an empty group rather than throw when a nested group has no rows", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(nestedOf(), [emptyLayout("E")]);
      expect(groups(node).length).toBe(1);
      expect(rects(node).length).toBe(0);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should keep the populated groups when one nested group is empty", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const data = [...nestedData(), emptyLayout("E")];
      const node = render(nestedOf(), data);
      expect(groups(node).length).toBe(3);
      expect(rects(node).length).toBe(rows.length);
      warn.mockRestore();
    });
  });

  describe("axis baseline", () => {
    test("should clamp the axis into the plotting area when the y-domain excludes zero", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const offDomain = scaleLinear().domain([10, 60]).range([300, 0]);
      const node = render(nestedOf().yScale(offDomain));
      expect(offDomain(0)).toBe(360);
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe("translate(0,300)");
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should place the axis at yScale(0) when the y-domain starts at zero", () => {
      const node = render(nestedOf());
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe(`translate(0,${yScale(0)})`);
    });

    test("should still place the axis correctly when the y-range is inverted", () => {
      const inverted = scaleLinear().domain([0, 60]).range([0, 300]);
      const node = render(nestedOf().yScale(inverted));
      expect(axisOf(groups(node)[0])?.getAttribute("transform")).toBe("translate(0,0)");
    });
  });

  describe("stroke", () => {
    test("should forward stroke to every bar, leaving stackedBar's white separator when it is unset", () => {
      expect(new Set(attrs(rects(render(nestedOf().stroke("#000000"))), "stroke"))).toEqual(
        new Set(["#000000"]),
      );
      // "none" is just another value to forward, and is how a caller asks for a seamless stack.
      expect(new Set(attrs(rects(render(nestedOf().stroke("none"))), "stroke"))).toEqual(
        new Set(["none"]),
      );
      expect(new Set(attrs(rects(render(nestedOf())), "stroke"))).toEqual(new Set(["#FFFFFF"]));
    });
  });

  describe("offset", () => {
    test("should fall back to translate(0,0) when the offset accessor returns undefined", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const node = render(nestedOf().offset(() => undefined));
      expect(attrs(groups(node), "transform")).toEqual(["translate(0,0)", "translate(0,0)"]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should warn once per group when the offset accessor returns undefined", () => {
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
