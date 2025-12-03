import { scaleOrdinal } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { bounds } from "../../src/bounds";
import treemap from "../../src/component/treemap.js";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";
import { prepareHierarchyData } from "../../src/layout/hierarchy.js";

// Test data structures
type TestDatum = {
  category: string;
  subcategory: string;
  value: number;
  name: string;
};

describe("component/treemap", () => {
  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
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
      })
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

  describe("treemap component", () => {
    test("should create treemap component with proper API", () => {
      const treemapComponent = treemap<TestDatum>()
        .colorScale(cScale)
        .containerWidth(400)
        .containerHeight(300)
        .transition(false);
      expect(treemapComponent.colorScale()).toBe(cScale);
      expect(treemapComponent.containerWidth()).toBe(400);
      expect(treemapComponent.containerHeight()).toBe(300);
      expect(treemapComponent.transition()).toBe(false);
    });

    test("should render rectangles for treemap data", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360) // Chart area width
            .containerHeight(250) // Chart area height
            .transition(false)
        );
      const rectangles = svg.selectAll(".sszvis-treemap-rect");
      expect(rectangles.empty()).toBe(false);
      expect(rectangles.size()).toBeGreaterThan(0);
    });

    test("should apply color scale correctly", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );
      const rectangles = svg.selectAll(".sszvis-treemap-rect");
      expect(rectangles.size()).toBeGreaterThan(0);
      const firstRect = rectangles.node() as SVGRectElement;
      if (firstRect) {
        const fill = firstRect.getAttribute("fill");
        expect(fill).toBeDefined();
        expect(fill).not.toBe("#steelblue"); // Should use colorScale, not default
      }
    });

    test("should handle labels when showLabels is enabled", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .transition(false)
        );
      expect(svg.selectAll(".sszvis-treemap-label").empty()).toBe(false);
    });

    test("should not show labels when showLabels is disabled", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(false)
            .transition(false)
        );
      expect(svg.selectAll(".sszvis-treemap-label").empty()).toBe(true);
    });

    test("should support different label positions", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .labelPosition("center")
            .transition(false)
        );
      const firstLabel = svg.selectAll<SVGTextElement, TestDatum>(".sszvis-treemap-label").node();
      if (firstLabel) {
        expect(firstLabel.getAttribute("text-anchor")).toBe("middle");
      }
    });

    test("should filter out very small rectangles", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate([
              { category: "A", subcategory: "A1", value: 0.1, name: "Tiny" },
              { category: "B", subcategory: "B1", value: 100, name: "Normal" },
            ])
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );
      svg
        .selectAll<SVGRectElement, TestDatum>(".sszvis-treemap-rect")
        .nodes()
        .forEach((rect) => {
          expect(parseFloat(rect.getAttribute("width") || "0")).toBeGreaterThan(0.5);
          expect(parseFloat(rect.getAttribute("height") || "0")).toBeGreaterThan(0.5);
        });
    });

    test("should handle empty or invalid data gracefully", () => {
      expect(() => {
        prepareHierarchyData<TestDatum>()
          .layer((d) => d.category)
          .value((d) => d.value)
          .calculate([]);
      }).not.toThrow();
    });

    test("should support transitions when enabled", () => {
      const treemapComponent = treemap<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .transition(true);
      expect(treemapComponent.transition()).toBe(true);
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
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;
      expect(rect).toBeDefined();

      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    test("should pass correct node data to onClick handler", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;
      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        expect.objectContaining({
          data: expect.any(Object),
          x0: expect.any(Number),
          y0: expect.any(Number),
          x1: expect.any(Number),
          y1: expect.any(Number),
          value: expect.any(Number),
        })
      );
    });

    test("should pass MouseEvent to onClick handler", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;
      const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 50,
      });
      rect.dispatchEvent(mouseEvent);

      const [eventArg] = clickHandler.mock.calls[0];
      expect(eventArg).toBeInstanceOf(MouseEvent);
      expect(eventArg.type).toBe("click");
    });

    test("should show pointer cursor when onClick is provided", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rectangles = svg.selectAll<SVGRectElement, TestDatum>(".sszvis-treemap-rect");
      rectangles.each(function () {
        const cursor = this.style.cursor || this.getAttribute("cursor");
        expect(cursor).toBe("pointer");
      });
    });

    test("should show default cursor when onClick is not provided", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );

      const rectangles = svg.selectAll<SVGRectElement, TestDatum>(".sszvis-treemap-rect");
      rectangles.each(function () {
        const cursor = this.style.cursor || this.getAttribute("cursor");
        expect(cursor).not.toBe("pointer");
      });
    });

    test("should not interfere with existing hover behavior", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;

      // Simulate hover
      rect.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      rect.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

      // Click should still work after hover
      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    test("onClick should receive node with hierarchy structure", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;
      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const [, nodeArg] = clickHandler.mock.calls[0];
      // Node should have hierarchy data structure with traversal methods
      expect(nodeArg).toBeDefined();
      expect(nodeArg.data).toBeDefined();
      expect(typeof nodeArg.ancestors).toBe("function");
      expect(typeof nodeArg.descendants).toBe("function");
      // Ancestors should include at least the node itself
      expect(nodeArg.ancestors().length).toBeGreaterThanOrEqual(1);
    });

    test("onClick should receive parent node when parent is clicked", () => {
      const clickHandler = vi.fn();

      // Create data with parent nodes visible (single layer)
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rect = svg.select(".sszvis-treemap-rect").node() as SVGRectElement;
      rect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const [, nodeArg] = clickHandler.mock.calls[0];
      // Parent nodes may have children (depending on hierarchy depth)
      expect(nodeArg).toBeDefined();
      expect(nodeArg.data).toBeDefined();
    });

    test("should handle multiple clicks correctly", () => {
      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          treemap<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const rectangles = svg.selectAll<SVGRectElement, TestDatum>(".sszvis-treemap-rect");
      const firstRect = rectangles.nodes()[0];
      const secondRect = rectangles.nodes()[1];

      firstRect.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      secondRect.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      firstRect.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    test("should support onClick getter/setter API", () => {
      const clickHandler = vi.fn();
      const treemapComponent = treemap<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .onClick(clickHandler);

      expect(treemapComponent.onClick()).toBe(clickHandler);
    });
  });

  describe("hierarchy navigation helpers", () => {
    test("ancestors() returns path from node to root", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(data);

      // Find a leaf node
      const findLeaf = (node: typeof layoutData): typeof layoutData | null => {
        if (!node.children) return node;
        for (const child of node.children) {
          const leaf = findLeaf(child);
          if (leaf) return leaf;
        }
        return null;
      };

      const leafNode = findLeaf(layoutData);
      expect(leafNode).toBeDefined();

      if (leafNode) {
        const ancestors = leafNode.ancestors();
        expect(ancestors.length).toBeGreaterThan(0);
        // Root should be the last ancestor
        expect(ancestors[ancestors.length - 1]).toBe(layoutData);
        // First ancestor should be the node itself
        expect(ancestors[0]).toBe(leafNode);
      }
    });

    test("parent property provides direct parent access", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(data);

      // Find a leaf node
      const findLeaf = (node: typeof layoutData): typeof layoutData | null => {
        if (!node.children) return node;
        for (const child of node.children) {
          const leaf = findLeaf(child);
          if (leaf) return leaf;
        }
        return null;
      };

      const leafNode = findLeaf(layoutData);
      expect(leafNode).toBeDefined();

      if (leafNode) {
        expect(leafNode.parent).toBeDefined();
        expect(leafNode.parent?.children).toContain(leafNode);
      }
    });

    test("depth property indicates hierarchy level", () => {
      const layoutData = prepareHierarchyData<TestDatum>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(data);

      expect(layoutData.depth).toBe(0); // Root is depth 0

      if (layoutData.children) {
        const firstChild = layoutData.children[0];
        expect(firstChild.depth).toBe(1);

        if (firstChild.children) {
          const grandchild = firstChild.children[0];
          expect(grandchild.depth).toBe(2);
        }
      }
    });
  });
});
