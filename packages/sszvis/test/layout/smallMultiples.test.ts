import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import layoutSmallMultiples from "../../src/layout/smallMultiples.js";
import "../../src/d3-selectgroup.js";

/** One group of the grid. `values` holds the data for the chart drawn inside it. */
type Group = {
  name: string;
  values: number[];
  // written back onto the datum by the layout
  gx?: number;
  gy?: number;
  gw?: number;
  gh?: number;
  cx?: number;
  cy?: number;
};

const groups = (count: number): Group[] =>
  Array.from({ length: count }, (_, i) => ({ name: `group-${i}`, values: [i] }));

describe("layout/smallMultiples", () => {
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

  const render = (component: unknown, data: Group[]) =>
    createSvgLayer("#chart-container", undefined, { key: `multiples-${++layerKey}` })
      .selectGroup("multiples")
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /** A 3 x 2 grid of 100 x 100 units with 10px gutters. */
  const grid = () =>
    layoutSmallMultiples<Group>().width(320).height(210).cols(3).rows(2).paddingX(10).paddingY(10);

  const multiples = (node: SVGGElement) => [...node.querySelectorAll("g.sszvis-multiple")];
  const transformOf = (el: Element) => el.getAttribute("transform");

  describe("grid", () => {
    test("should create one group per datum", () => {
      const node = render(grid(), groups(6));
      expect(multiples(node)).toHaveLength(6);
    });

    test("should divide the space into equal units, minus the gutters", () => {
      const node = render(grid(), groups(6));
      const [first] = multiples(node) as [SVGGElement];
      const datum = (first as SVGGElement & { __data__: Group }).__data__;
      expect(datum.gw).toBe(100);
      expect(datum.gh).toBe(100);
    });

    test("should place the groups left to right then top to bottom when the grid has several rows", () => {
      const node = render(grid(), groups(6));
      expect(multiples(node).map(transformOf)).toEqual([
        "translate(0,0)",
        "translate(110,0)",
        "translate(220,0)",
        "translate(0,110)",
        "translate(110,110)",
        "translate(220,110)",
      ]);
    });

    test("should report the centre of a unit rather than of the whole grid", () => {
      const node = render(grid(), groups(6));
      for (const el of multiples(node)) {
        const datum = (el as SVGGElement & { __data__: Group }).__data__;
        expect(datum.cx).toBe(50);
        expect(datum.cy).toBe(50);
      }
    });

    test("should stack the groups vertically when there is a single column", () => {
      const layout = layoutSmallMultiples<Group>()
        .width(100)
        .height(320)
        .cols(1)
        .rows(3)
        .paddingX(0)
        .paddingY(10);
      const node = render(layout, groups(3));
      expect(multiples(node).map(transformOf)).toEqual([
        "translate(0,0)",
        "translate(0,110)",
        "translate(0,220)",
      ]);
    });

    test("should let the units touch when the padding is zero", () => {
      const layout = layoutSmallMultiples<Group>()
        .width(300)
        .height(200)
        .cols(3)
        .rows(2)
        .paddingX(0)
        .paddingY(0);
      const node = render(layout, groups(6));
      const datum = (multiples(node)[0] as SVGGElement & { __data__: Group }).__data__;
      expect(datum.gw).toBe(100);
      expect(multiples(node).map(transformOf)).toContain("translate(200,100)");
    });
  });

  describe("chart groups", () => {
    test("should nest one chart group per multiple, bound to its values", () => {
      const node = render(grid(), groups(6));
      const charts = node.querySelectorAll("g.sszvis-multiple-chart");
      expect(charts).toHaveLength(6);
      const bound = (charts[0] as SVGGElement & { __data__: number[] }).__data__;
      expect(bound).toEqual([0]);
    });

    test("should remove the surplus groups when the dataset gets shorter", () => {
      const selection = createSvgLayer("#chart-container", undefined, {
        key: "multiples-shrink",
      }).selectGroup("multiples");
      selection.datum(groups(6)).call(grid() as never);
      expect(multiples(selection.node() as SVGGElement)).toHaveLength(6);
      selection.datum(groups(3)).call(grid() as never);
      expect(multiples(selection.node() as SVGGElement)).toHaveLength(3);
    });

    test("should re-render in place rather than append duplicates when called twice", () => {
      const layout = grid();
      const data = groups(6);
      const selection = createSvgLayer("#chart-container", undefined, {
        key: "multiples-rerender",
      }).selectGroup("multiples");
      selection.datum(data).call(layout as never);
      selection.datum(data).call(layout as never);
      const node = selection.node() as SVGGElement;
      expect(multiples(node)).toHaveLength(6);
      expect(node.querySelectorAll("g.sszvis-multiple-chart")).toHaveLength(6);
    });
  });

  describe("titles", () => {
    test("should draw no title when showTitle is not set", () => {
      const node = render(grid(), groups(6));
      expect(node.querySelectorAll(".sszvis-multiple-title")).toHaveLength(0);
    });

    test("should draw one title per multiple when showTitle is set", () => {
      const layout = grid()
        .showTitle(true)
        .titleLabel((d: Group) => d.name);
      const node = render(layout, groups(6));
      const titles = [...node.querySelectorAll(".sszvis-multiple-title")];
      expect(titles).toHaveLength(6);
      expect(titles.map((t) => t.textContent)).toEqual([
        "group-0",
        "group-1",
        "group-2",
        "group-3",
        "group-4",
        "group-5",
      ]);
    });

    test("should centre the title over its unit by default and anchor it to either edge on request", () => {
      const layout = grid()
        .showTitle(true)
        .titleLabel(() => "t");
      const title = render(layout, groups(6)).querySelector(".sszvis-multiple-title");
      expect(title?.getAttribute("x")).toBe("50");
      expect(title?.getAttribute("text-anchor")).toBe("middle");

      const start = render(
        grid()
          .showTitle(true)
          .titleAnchor("start")
          .titleLabel(() => "t"),
        groups(6),
      ).querySelector(".sszvis-multiple-title");
      expect(start?.getAttribute("x")).toBe("0");

      const end = render(
        grid()
          .showTitle(true)
          .titleAnchor("end")
          .titleLabel(() => "t"),
        groups(6),
      ).querySelector(".sszvis-multiple-title");
      expect(end?.getAttribute("x")).toBe("100");
    });

    test("should offset the title vertically when titleY is set", () => {
      const layout = grid()
        .showTitle(true)
        .titleY(-8)
        .titleLabel(() => "t");
      const title = render(layout, groups(6)).querySelector(".sszvis-multiple-title");
      expect(title?.getAttribute("y")).toBe("-8");
    });

    test("should remove the titles again when showTitle is turned off", () => {
      const data = groups(6);
      const selection = createSvgLayer("#chart-container", undefined, {
        key: "multiples-titles-off",
      }).selectGroup("multiples");
      selection.datum(data).call(
        grid()
          .showTitle(true)
          .titleLabel(() => "t") as never,
      );
      expect(
        (selection.node() as SVGGElement).querySelectorAll(".sszvis-multiple-title"),
      ).toHaveLength(6);
      selection.datum(data).call(grid() as never);
      expect(
        (selection.node() as SVGGElement).querySelectorAll(".sszvis-multiple-title"),
      ).toHaveLength(0);
    });
  });

  describe("required properties", () => {
    test("should throw when a geometry property is missing", () => {
      for (const missing of ["width", "height", "rows", "cols"] as const) {
        const layout = layoutSmallMultiples<Group>().paddingX(10).paddingY(10);
        if (missing !== "width") layout.width(320);
        if (missing !== "height") layout.height(210);
        if (missing !== "rows") layout.rows(2);
        if (missing !== "cols") layout.cols(3);
        expect(() => render(layout, groups(2))).toThrow(new RegExp(missing));
      }
    });

    test("should draw nothing at all when a required property is missing", () => {
      const layout = layoutSmallMultiples<Group>().width(320).height(210).paddingX(10);
      const selection = createSvgLayer("#chart-container", undefined, {
        key: "multiples-required",
      }).selectGroup("multiples");
      expect(() => selection.datum(groups(2)).call(layout as never)).toThrow();
      expect(multiples(selection.node() as SVGGElement)).toHaveLength(0);
    });

    test("should throw when there is more data than the declared grid has room for", () => {
      // eight groups in a 3 x 2 grid used to spill into a third row below the declared height
      expect(() => render(grid(), groups(8))).toThrow(/2 x 3/);
    });

    test("should throw when a group has no values property", () => {
      expect(() => render(grid(), [{ name: "no values" }] as unknown as Group[])).toThrow(
        /group 0 has no values/,
      );
    });

    test("should throw when the titleAnchor cannot be positioned", () => {
      const layout = grid()
        .showTitle(true)
        .titleAnchor("centre" as unknown as "middle")
        .titleLabel(() => "t");
      expect(() => render(layout, groups(6))).toThrow(/titleAnchor/);
    });

    test("should default the paddings to zero when they are not set", () => {
      const layout = layoutSmallMultiples<Group>().width(300).height(200).cols(3).rows(2);
      const node = render(layout, groups(6));
      const datum = (multiples(node)[0] as SVGGElement & { __data__: Group }).__data__;
      expect(datum.gw).toBe(100);
      expect(datum.gh).toBe(100);
    });
  });

  describe("known quirks", () => {
    test("writes its layout back onto the bound data objects", () => {
      // NOTE: intended and documented - the component attaches gx/gy/gw/gh/cx/cy to each
      // group datum. The JSDoc warns not to pass source data objects for this reason.
      const data = groups(6);
      render(grid(), data);
      expect(data[0]).toMatchObject({ gx: 0, gy: 0, gw: 100, gh: 100, cx: 50, cy: 50 });
      expect(data[4]).toMatchObject({ gx: 110, gy: 110 });
    });

    test("cx and cy are unit-relative while gx and gy are grid-absolute", () => {
      // NOTE: the two pairs are in different coordinate systems, which is easy to misread.
      // gx/gy position the group within the grid; cx/cy are the centre of the unit inside
      // the group's own translated frame, so they are the same for every multiple.
      const node = render(grid(), groups(6));
      const last = (multiples(node).at(-1) as SVGGElement & { __data__: Group }).__data__;
      expect(last.gx).toBe(220);
      expect(last.cx).toBe(50);
    });

    test("titleLabel is called with the datum after the layout has been written onto it", () => {
      // NOTE: the layout fields are attached by a .datum() call that runs before the title
      // join, so a title accessor sees gx/gy/gw/gh/cx/cy alongside the caller's own fields.
      const seen: Group[] = [];
      const layout = grid()
        .showTitle(true)
        .titleLabel((d: Group) => {
          seen.push({ ...d });
          return d.name;
        });
      render(layout, groups(2));
      expect(seen[0]).toMatchObject({ name: "group-0", gx: 0, gw: 100, cx: 50 });
    });
  });
});
