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
      { category: "Technology", subcategory: "Software", value: 100, name: "App A" },
      { category: "Technology", subcategory: "Software", value: 80, name: "App B" },
      { category: "Technology", subcategory: "Hardware", value: 150, name: "Device A" },
      { category: "Finance", subcategory: "Banking", value: 200, name: "Bank A" },
      { category: "Finance", subcategory: "Investment", value: 90, name: "Fund A" },
      { category: "Healthcare", subcategory: "Pharma", value: 120, name: "Drug A" },
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
});
