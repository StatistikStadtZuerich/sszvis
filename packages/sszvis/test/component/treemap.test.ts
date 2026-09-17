import { scaleOrdinal, select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bounds } from "../../src/bounds.js";
import treemap, { type TreemapLayout } from "../../src/component/treemap.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";
import { type NodeDatum, prepareHierarchyData } from "../../src/layout/hierarchy.js";

// Test data structures
type TestDatum = {
  category: string;
  subcategory: string;
  value: number;
  name: string;
};

describe("component/treemap", () => {
  let container: HTMLDivElement;
  let svg: LayerSelection<SVGGElement, number>;
  let data: TestDatum[];
  let cScale: (key: string) => string;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    svg = createSvgLayer(
      container,
      bounds({
        width: 400,
        height: 300,
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      }),
    );

    // Sample hierarchical data
    data = [
      {
        category: "Technology",
        subcategory: "Software",
        value: 100,
        name: "App A",
      },
      {
        category: "Technology",
        subcategory: "Software",
        value: 80,
        name: "App B",
      },
      {
        category: "Technology",
        subcategory: "Hardware",
        value: 150,
        name: "Device A",
      },
      {
        category: "Finance",
        subcategory: "Banking",
        value: 200,
        name: "Bank A",
      },
      {
        category: "Finance",
        subcategory: "Investment",
        value: 90,
        name: "Fund A",
      },
      {
        category: "Healthcare",
        subcategory: "Pharma",
        value: 120,
        name: "Drug A",
      },
    ];

    cScale = scaleOrdinal<string, string>()
      .domain(["Technology", "Finance", "Healthcare"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  describe("prepareData", () => {
    test("should create hierarchical structure with chained API", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(data);

      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
      expect(layoutData.value).toBeGreaterThan(0);
      expect(layoutData.depth).toBe(0); // Root node
    });

    test("should handle uneven tree depth with null keys by using parent key as fallback", () => {
      type UnevenDatum = {
        category: string;
        subcategory: string;
        division: string | null;
        team: string | null;
        value: number;
      };

      const unevenData: UnevenDatum[] = [
        // Full depth path
        {
          category: "Technology",
          subcategory: "Hardware",
          division: "Servers",
          team: "Team Alpha",
          value: 100,
        },
        // Missing team (null at deepest level)
        {
          category: "Technology",
          subcategory: "Hardware",
          division: "Servers",
          team: null,
          value: 85,
        },
        // Missing both division and team
        {
          category: "Finance",
          subcategory: "Banking",
          division: null,
          team: null,
          value: 200,
        },
      ];

      const layoutData = prepareHierarchyData<UnevenDatum>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .layer((d) => d.division)
        .layer((d) => d.team)
        .value((d) => d.value)
        .calculate(unevenData);

      // Collect all leaf nodes and their keys
      const leafNodes: Array<{ key: string; data: UnevenDatum }> = [];
      layoutData.each((node) => {
        if (node.data._tag === "leaf") {
          leafNodes.push({
            key: node.data.key,
            data: node.data.data,
          });
        }
      });

      // All leaf nodes should have non-null keys
      for (const leaf of leafNodes) {
        expect(leaf.key).not.toBeNull();
        expect(leaf.key).toBeDefined();
        expect(typeof leaf.key).toBe("string");
        expect(leaf.key.length).toBeGreaterThan(0);
      }

      // The node with team=null should have key="Servers" (parent's key)
      const serverNullTeamNode = leafNodes.find(
        (n) => n.data.team === null && n.data.division === "Servers",
      );
      expect(serverNullTeamNode).toBeDefined();
      expect(serverNullTeamNode?.key).toBe("Servers");

      // The node with both division=null and team=null should have key="Banking" (grandparent's key)
      const bankingNullDivisionNode = leafNodes.find(
        (n) => n.data.division === null && n.data.subcategory === "Banking",
      );
      expect(bankingNullDivisionNode).toBeDefined();
      expect(bankingNullDivisionNode?.key).toBe("Banking");
    });

    test("should create hierarchical structure with options API", () => {
      const layoutData = prepareHierarchyData(data, {
        layers: [(d) => d.category, (d) => d.subcategory],
        valueAccessor: (d) => d.value,
      });
      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
      expect(layoutData.value).toBeGreaterThan(0);
      expect(layoutData.depth).toBe(0); // Root node
    });

    test("should handle single layer hierarchy", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(data);
      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3);
    });

    test("should throw error if no layers specified", () => {
      expect(() => {
        prepareHierarchyData<TestDatum>()
          .value((d) => d.value)
          .calculate(data);
      }).toThrow("At least one layer must be specified");
    });

    test("should handle zero values gracefully", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate([
          ...data,
          { category: "Empty", subcategory: "None", value: 0, name: "Empty A" },
        ]);
      expect(layoutData.children?.length).toBe(4); // Including Empty category
    });
  });

  /** The hierarchy the treemap is normally given: rows grouped by category, then subcategory. */
  const nested = (rows: TestDatum[] = data) =>
    prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .layer((d) => d.subcategory)
      .value((d) => d.value)
      .calculate(rows);

  /** The same rows grouped by category only, for the cases that want a two-level tree. */
  const flat = (rows: TestDatum[] = data) =>
    prepareHierarchyData<TestDatum>()
      .layer((d) => d.category)
      .value((d) => d.value)
      .calculate(rows);

  /**
   * Renders a treemap of the given hierarchy at a fixed size with transitions off, so every
   * assertion reads the settled geometry on the same tick. `configure` adds whatever the test
   * under way needs on top.
   */
  const renderTreemap = (
    hierarchy: ReturnType<typeof nested>,
    configure: (
      c: ReturnType<typeof treemap<TestDatum>>,
    ) => ReturnType<typeof treemap<TestDatum>> = (c) => c,
  ) => {
    svg
      .datum(hierarchy)
      .call(
        configure(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false),
        ),
      );
    return svg;
  };

  const rectNodes = () => [
    ...svg.selectAll<SVGRectElement, unknown>(".sszvis-treemap-rect").nodes(),
  ];
  const labelNodes = () => [
    ...svg.selectAll<SVGTextElement, unknown>(".sszvis-treemap-label").nodes(),
  ];
  const anchorNodes = () => [
    ...svg.selectAll<SVGRectElement, unknown>("[data-tooltip-anchor]").nodes(),
  ];

  describe("treemap component", () => {
    test("should paint the same fill whether colorScale is a constant or an accessor", () => {
      // colorScale is wrapped in fn.functor on set, so a colour and an accessor returning
      // that colour agree - the rule every other colour property in the library follows.
      const hierarchy = () =>
        prepareHierarchyData<TestDatum>()
          .layer((d) => d.category)
          .value((d) => d.value)
          .calculate(data);
      const fills = (scale: string | ((key: string) => string)) => {
        svg
          .datum(hierarchy())
          .call(
            treemap<TestDatum>()
              .colorScale(scale)
              .containerWidth(360)
              .containerHeight(250)
              .transition(false),
          );
        return svg
          .selectAll<SVGRectElement, unknown>(".sszvis-treemap-rect")
          .nodes()
          .map((rect) => rect.getAttribute("fill"));
      };
      const constant = fills("#ff0000");
      expect(constant.length).toBeGreaterThan(0);
      expect(new Set(constant)).toEqual(new Set(["#ff0000"]));
      expect(fills(() => "#ff0000")).toEqual(constant);
    });

    test("should fill every rect with the colour of its own top-level category", () => {
      // Each expected fill comes from the source row's category rather than from the
      // component's own colorKeyOf, so this fails when the scale is applied to the wrong
      // node even though every fill is still a legitimate palette colour. The test this
      // replaces asserted only that the first rect's fill was not "#steelblue" - a string
      // no code path produces - so any fill at all satisfied it, and the whole file passed
      // with the scale misapplied.
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false),
        );

      // The renderer filters to leaves, so every rect on screen carries a source row.
      const painted = svg
        .selectAll<SVGRectElement, { data: NodeDatum<TestDatum> }>(".sszvis-treemap-rect")
        .nodes()
        .map((rect) => ({
          datum: select<SVGRectElement, { data: NodeDatum<TestDatum> }>(rect).datum().data,
          fill: rect.getAttribute("fill"),
        }));

      expect(painted.length).toBeGreaterThan(1);
      for (const { datum, fill } of painted) {
        expect(datum._tag).toBe("leaf");
        const row = (datum as Extract<NodeDatum<TestDatum>, { _tag: "leaf" }>).data;
        expect(fill).toBe(cScale(row.category));
      }

      // More than one category is on screen, so a scale collapsed onto a single key fails
      // here as well as in the per-rect assertion above.
      expect(new Set(painted.map(({ fill }) => fill)).size).toBeGreaterThan(1);
    });

    test("should draw a label per labelled rect when showLabels is on and none when it is off", () => {
      renderTreemap(nested(), (c) => c.showLabels(true));
      expect(labelNodes().length).toBeGreaterThan(0);

      renderTreemap(flat(), (c) => c.showLabels(false));
      expect(labelNodes()).toEqual([]);
    });

    test("should align each label to the corner or centre that labelPosition names", () => {
      // All five positions, since only "center" was ever covered. The alignment attributes
      // and the side of the rect the label sits on are the observable half of the position
      // policy; the exact padding is not restated here.
      const cases = [
        { position: "top-left", anchor: "start", baseline: "hanging", left: true, top: true },
        { position: "top-right", anchor: "end", baseline: "hanging", left: false, top: true },
        {
          position: "bottom-left",
          anchor: "start",
          baseline: "alphabetic",
          left: true,
          top: false,
        },
        {
          position: "bottom-right",
          anchor: "end",
          baseline: "alphabetic",
          left: false,
          top: false,
        },
        { position: "center", anchor: "middle", baseline: "middle", left: null, top: null },
      ] as const;

      for (const { position, anchor, baseline, left, top } of cases) {
        renderTreemap(flat(), (c) => c.showLabels(true).labelPosition(position));
        const labels = labelNodes();
        // Asserted before the loop, so an empty render fails here rather than passing an
        // assertion that never runs.
        expect(labels.length).toBeGreaterThan(0);

        for (const label of labels) {
          expect(label.getAttribute("text-anchor")).toBe(anchor);
          expect(label.getAttribute("dominant-baseline")).toBe(baseline);

          const d = select<SVGTextElement, TreemapLayout<TestDatum>>(label).datum();
          const x = parseFloat(label.getAttribute("x") || "0");
          const y = parseFloat(label.getAttribute("y") || "0");
          const midX = (d.x0 + d.x1) / 2;
          const midY = (d.y0 + d.y1) / 2;
          if (left === true) expect(x).toBeLessThan(midX);
          if (left === false) expect(x).toBeGreaterThan(midX);
          if (top === true) expect(y).toBeLessThan(midY);
          if (top === false) expect(y).toBeGreaterThan(midY);
        }
      }
    });

    test("should draw no rect thinner than half a pixel in either dimension", () => {
      renderTreemap(
        nested([
          { category: "A", subcategory: "A1", value: 0.1, name: "Tiny" },
          { category: "B", subcategory: "B1", value: 100, name: "Normal" },
        ]),
      );
      const rects = rectNodes();
      expect(rects.length).toBeGreaterThan(0);
      for (const rect of rects) {
        expect(parseFloat(rect.getAttribute("width") || "0")).toBeGreaterThan(0.5);
        expect(parseFloat(rect.getAttribute("height") || "0")).toBeGreaterThan(0.5);
      }
    });

    test("should draw nothing at all, without throwing, when the data is empty", () => {
      expect(() => renderTreemap(flat([]))).not.toThrow();
      expect(rectNodes()).toEqual([]);
      expect(anchorNodes()).toEqual([]);
    });

    test("should re-render without throwing when the caller does not re-bind the group", () => {
      // The render binds the flattened nodes to the group for the tooltip anchors and then
      // restores the hierarchy, so the group's datum is still a root the next time round. A
      // caller holding its own group selection can re-render without re-binding; leaving the
      // array there made the treemap layout throw on the second call - see #303.
      const treemapComponent = treemap<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .transition(false);

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(treemapComponent);
      const first = svg.selectAll(".sszvis-treemap-rect").size();

      expect(() => {
        svg.call(treemapComponent);
      }).not.toThrow();
      expect(svg.selectAll(".sszvis-treemap-rect").size()).toBe(first);
    });
  });

  describe("onClick functionality", () => {
    test("should call onClick handler when rectangle is clicked", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data),
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false),
        );

      // NOTE: selectAll, not select - d3's select propagates the group's datum onto
      // the child it picks, which would overwrite the drawn node's datum with the
      // array the group is bound to for the tooltip anchors.
      const rect = svg.selectAll<SVGRectElement, unknown>(".sszvis-treemap-rect").nodes()[0];
      expect(rect).toBeDefined();

      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    test("should hand the handler the click event and the clicked node's laid-out data", () => {
      const clickHandler = vi.fn();
      renderTreemap(nested(), (c) => c.onClick(clickHandler));

      rectNodes()[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        expect.objectContaining({
          data: expect.any(Object),
          x0: expect.any(Number),
          y0: expect.any(Number),
          x1: expect.any(Number),
          y1: expect.any(Number),
          value: expect.any(Number),
        }),
      );
    });

    test("should show a pointer cursor on every rect when onClick is provided and none when it is not", () => {
      const cursors = () =>
        rectNodes().map((rect) => rect.style.cursor || rect.getAttribute("cursor"));

      renderTreemap(nested(), (c) => c.onClick(vi.fn()));
      expect(cursors().length).toBeGreaterThan(0);
      for (const cursor of cursors()) expect(cursor).toBe("pointer");

      renderTreemap(nested());
      expect(cursors().length).toBeGreaterThan(0);
      for (const cursor of cursors()) expect(cursor).not.toBe("pointer");
    });
  });

  describe("tooltip anchors", () => {
    const anchorData = () =>
      anchorNodes().map((el) => select<SVGRectElement, TreemapLayout<TestDatum>>(el).datum());
    const keyOf = (d: TreemapLayout<TestDatum>) => ("key" in d.data ? d.data.key : undefined);

    test("should render one anchor per drawn rect, in the same order and at its centre", () => {
      renderTreemap(nested());
      const rects = rectNodes();
      expect(rects.length).toBeGreaterThan(0);
      expect(anchorNodes().length).toBe(rects.length);

      const rectData = rects.map((el) =>
        select<SVGRectElement, TreemapLayout<TestDatum>>(el).datum(),
      );
      expect(anchorData().map(keyOf)).toEqual(rectData.map(keyOf));

      // Same order is not enough on its own - each anchor also has to sit on the rect it is
      // paired with, which is what a tooltip reads.
      for (const el of anchorNodes()) {
        const d = select<SVGRectElement, TreemapLayout<TestDatum>>(el).datum();
        const cx = (d.x0 + d.x1) / 2;
        const cy = (d.y0 + d.y1) / 2;
        expect(el.getAttribute("transform")).toBe(`translate(${cx},${cy})`);
      }
    });

    test("should give no anchor to a branch node or the root, neither of which is drawn", () => {
      // visibleData is filtered to leaves, so the category and subcategory nodes have no
      // rectangle - and must not gain an anchor a tooltip could latch on to.
      renderTreemap(nested());
      expect(anchorNodes().length).toBeGreaterThan(0);
      expect(anchorNodes().length).toBe(rectNodes().length);
      for (const d of anchorData()) {
        expect(d.data._tag).toBe("leaf");
        expect(keyOf(d)).toBeDefined();
      }
      expect(anchorData().map(keyOf)).not.toContain("Technology");
    });

    test("should re-render the anchors in place rather than appending duplicates", () => {
      renderTreemap(nested());
      const first = anchorNodes().length;
      expect(first).toBeGreaterThan(0);
      renderTreemap(nested());
      expect(anchorNodes().length).toBe(first);
    });
  });
});
