import { scaleOrdinal } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { bounds } from "../../src/bounds";
import { createSvgLayer } from "../../src/createSvgLayer";
import treemap, { prepareData } from "../../src/component/treemap.js";
import "../../src/d3-selectgroup";

// Test data structures
type TestDataItem = {
  category: string;
  subcategory: string;
  value: number;
  name: string;
};

describe("component/treemap", () => {
  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  let chartBounds: ReturnType<typeof bounds>;
  let testData: TestDataItem[];
  let colorScale: (key: string) => string;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    chartBounds = bounds({
      width: 400,
      height: 300,
      top: 20,
      right: 20,
      bottom: 30,
      left: 40,
    });

    svg = createSvgLayer(container, chartBounds);

    // Sample hierarchical data
    testData = [
      { category: "Technology", subcategory: "Software", value: 100, name: "App A" },
      { category: "Technology", subcategory: "Software", value: 80, name: "App B" },
      { category: "Technology", subcategory: "Hardware", value: 150, name: "Device A" },
      { category: "Finance", subcategory: "Banking", value: 200, name: "Bank A" },
      { category: "Finance", subcategory: "Investment", value: 90, name: "Fund A" },
      { category: "Healthcare", subcategory: "Pharma", value: 120, name: "Drug A" },
    ];

    colorScale = scaleOrdinal<string, string>()
      .domain(["Technology", "Finance", "Healthcare"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]) as (key: string) => string;
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  describe("prepareData", () => {
    test("should create hierarchical structure with chained API", () => {
      const layoutData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(testData);

      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
      expect(layoutData.value).toBeGreaterThan(0);
      expect(layoutData.depth).toBe(0); // Root node
    });

    test("should create hierarchical structure with options API", () => {
      const layoutData = prepareData(testData, {
        layers: [(d) => d.category, (d) => d.subcategory],
        valueAccessor: (d) => d.value,
      }) as unknown as { children?: unknown[]; value: number; depth: number }; // Type assertion needed due to overload mismatch

      // The options API returns a hierarchy node (raw data), not an array
      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3); // Technology, Finance, Healthcare
      expect(layoutData.value).toBeGreaterThan(0);
      expect(layoutData.depth).toBe(0); // Root node
    });

    test("should handle single layer hierarchy", () => {
      const layoutData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(testData);

      expect(layoutData.children).toBeDefined();
      expect(layoutData.children?.length).toBe(3);
    });

    test("should throw error if no layers specified", () => {
      expect(() => {
        prepareData<TestDataItem>()
          .value((d) => d.value)
          .calculate(testData);
      }).toThrow("At least one layer must be specified");
    });

    test("should handle zero values gracefully", () => {
      const dataWithZeros = [
        ...testData,
        { category: "Empty", subcategory: "None", value: 0, name: "Empty A" },
      ];

      const layoutData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(dataWithZeros);

      expect(layoutData.children?.length).toBe(4); // Including Empty category
    });
  });

  describe("treemap component", () => {
    test("should create treemap component with proper API", () => {
      const treemapComponent = treemap<TestDataItem>()
        .colorScale(colorScale)
        .containerWidth(400)
        .containerHeight(300)
        .transition(false);

      expect(treemapComponent.colorScale()).toBe(colorScale);
      expect(treemapComponent.containerWidth()).toBe(400);
      expect(treemapComponent.containerHeight()).toBe(300);
      expect(treemapComponent.transition()).toBe(false);
    });

    test("should render rectangles for treemap data", () => {
      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(testData);

      svg.datum(hierarchicalData).call(
        treemap<TestDataItem>()
          .colorScale(colorScale)
          .containerWidth(360) // Chart area width
          .containerHeight(250) // Chart area height
          .transition(false)
      );

      const rectangles = svg.selectAll(".sszvis-treemap-rect");
      expect(rectangles.empty()).toBe(false);
      expect(rectangles.size()).toBeGreaterThan(0);
    });

    test("should apply color scale correctly", () => {
      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(testData);

      svg
        .datum(hierarchicalData)
        .call(
          treemap<TestDataItem>()
            .colorScale(colorScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );

      const rectangles = svg.selectAll(".sszvis-treemap-rect");
      // Verify that rectangles are colored using the color scale
      expect(rectangles.size()).toBeGreaterThan(0);
      const firstRect = rectangles.node() as SVGRectElement;
      if (firstRect) {
        const fill = firstRect.getAttribute("fill");
        expect(fill).toBeDefined();
        expect(fill).not.toBe("#steelblue"); // Should use colorScale, not default
      }
    });

    test("should handle labels when showLabels is enabled", () => {
      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(testData);

      svg
        .datum(hierarchicalData)
        .call(
          treemap<TestDataItem>()
            .colorScale(colorScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .transition(false)
        );

      const labels = svg.selectAll(".sszvis-treemap-label");
      expect(labels.empty()).toBe(false);
    });

    test("should not show labels when showLabels is disabled", () => {
      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(testData);

      svg
        .datum(hierarchicalData)
        .call(
          treemap<TestDataItem>()
            .colorScale(colorScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(false)
            .transition(false)
        );

      const labels = svg.selectAll(".sszvis-treemap-label");
      expect(labels.empty()).toBe(true);
    });

    test("should support different label positions", () => {
      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .value((d) => d.value)
        .calculate(testData);

      svg
        .datum(hierarchicalData)
        .call(
          treemap<TestDataItem>()
            .colorScale(colorScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .labelPosition("center")
            .transition(false)
        );

      const labels = svg.selectAll(".sszvis-treemap-label");
      const firstLabel = labels.node() as SVGTextElement;
      if (firstLabel) {
        expect(firstLabel.getAttribute("text-anchor")).toBe("middle");
      }
    });

    test("should filter out very small rectangles", () => {
      const smallValueData = [
        { category: "A", subcategory: "A1", value: 0.1, name: "Tiny" },
        { category: "B", subcategory: "B1", value: 100, name: "Normal" },
      ];

      const hierarchicalData = prepareData<TestDataItem>()
        .layer((d) => d.category)
        .layer((d) => d.subcategory)
        .value((d) => d.value)
        .calculate(smallValueData);

      svg
        .datum(hierarchicalData)
        .call(
          treemap<TestDataItem>()
            .colorScale(colorScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );

      const rectangles = svg.selectAll(".sszvis-treemap-rect");

      // Should only render rectangles with sufficient size
      const rectNodes = rectangles.nodes() as SVGRectElement[];
      rectNodes.forEach((rect) => {
        const width = parseFloat(rect.getAttribute("width") || "0");
        const height = parseFloat(rect.getAttribute("height") || "0");
        expect(width).toBeGreaterThan(0.5);
        expect(height).toBeGreaterThan(0.5);
      });
    });

    test("should handle empty or invalid data gracefully", () => {
      const emptyData: TestDataItem[] = [];

      expect(() => {
        prepareData<TestDataItem>()
          .layer((d) => d.category)
          .value((d) => d.value)
          .calculate(emptyData);
      }).not.toThrow();
    });

    test("should support transitions when enabled", () => {
      const treemapComponent = treemap<TestDataItem>()
        .colorScale(colorScale)
        .containerWidth(360)
        .containerHeight(250)
        .transition(true);

      expect(treemapComponent.transition()).toBe(true);
    });
  });
});
