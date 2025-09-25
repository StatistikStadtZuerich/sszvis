import { scaleOrdinal } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { bounds } from "../../src/bounds";
import pack from "../../src/component/pack.js";
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

describe("component/pack", () => {
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

  describe("pack component", () => {
    test("should have default values for all properties", () => {
      const packComponent = pack<TestDatum>();
      expect(packComponent.containerWidth()).toBe(800);
      expect(packComponent.containerHeight()).toBe(600);
      expect(packComponent.transition()).toBe(true);
      expect(packComponent.showLabels()).toBe(false);
      expect(packComponent.minRadius()).toBe(20);
      expect(packComponent.circleStroke()).toBe("#ffffff");
      expect(packComponent.circleStrokeWidth()).toBe(1);
    });

    test("should render circles for pack data", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360) // Chart area width
            .containerHeight(250) // Chart area height
            .transition(false)
        );
      const circles = svg.selectAll(".sszvis-pack-circle");
      expect(circles.empty()).toBe(false);
      expect(circles.size()).toBeGreaterThan(0);
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );
      const circles = svg.selectAll(".sszvis-pack-circle");
      expect(circles.size()).toBeGreaterThan(0);
      const firstCircle = circles.node() as SVGCircleElement;
      if (firstCircle) {
        const fill = firstCircle.getAttribute("fill");
        expect(fill).toBeDefined();
        // Leaf nodes should have color fill, branch nodes should have "none"
        expect(fill === "none" || ["#1f77b4", "#ff7f0e", "#2ca02c"].includes(fill || "")).toBe(
          true
        );
      }
    });

    test("should handle stroke properties correctly", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .circleStroke("#ff0000")
            .circleStrokeWidth(2)
            .transition(false)
        );

      const leafCircles = svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .filter((circle) => circle.getAttribute("fill") !== "none");

      if (leafCircles.length > 0) {
        const leafCircle = leafCircles[0];
        expect(leafCircle.getAttribute("stroke")).toBe("#ff0000");
        expect(leafCircle.getAttribute("stroke-width")).toBe("2");
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .transition(false)
        );
      expect(svg.selectAll(".sszvis-pack-label").empty()).toBe(false);
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(false)
            .transition(false)
        );
      expect(svg.selectAll(".sszvis-pack-label").empty()).toBe(true);
    });

    test("should support custom label accessor", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .showLabels(true)
            .label((d) => `Label: ${d.data && "key" in d.data ? d.data.key : ""}`)
            .transition(false)
        );
      const firstLabel = svg.selectAll<SVGTextElement, TestDatum>(".sszvis-pack-label").node();
      if (firstLabel) {
        const text = firstLabel.textContent;
        expect(text).toMatch(/^Label: /);
      }
    });

    test("should filter out circles smaller than minRadius", () => {
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .minRadius(5)
            .transition(false)
        );
      svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .forEach((circle) => {
          expect(parseFloat(circle.getAttribute("r") || "0")).toBeGreaterThanOrEqual(5);
        });
    });

    test("should support custom radius scale", () => {
      const customRScale = vi.fn().mockReturnValue(10);
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .radiusScale(customRScale)
            .transition(false)
        );
      expect(customRScale).toHaveBeenCalled();
    });

    test("should handle empty or invalid data gracefully", () => {
      expect(() => {
        svg
          .datum(
            prepareHierarchyData<TestDatum>()
              .layer((d) => d.category)
              .value((d) => d.value)
              .calculate([])
          )
          .call(
            pack<TestDatum>()
              .colorScale(cScale)
              .containerWidth(360)
              .containerHeight(250)
              .transition(false)
          );
      }).not.toThrow();
    });

    test("should support transitions when enabled", () => {
      const packComponent = pack<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .transition(true);
      expect(packComponent.transition()).toBe(true);
    });

    test("should differentiate between branch and leaf nodes", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );
      let branchCount = 0;
      let leafCount = 0;
      svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .forEach((circle) => {
          const fill = circle.getAttribute("fill");
          const strokeWidth = circle.getAttribute("stroke-width");

          if (fill === "none") {
            branchCount++;
            expect(strokeWidth).toBe("2"); // Branch nodes have thicker stroke
          } else {
            leafCount++;
            expect(strokeWidth).toBe("1"); // Leaf nodes have default stroke width
          }
        });
      expect(branchCount).toBeGreaterThan(0);
      expect(leafCount).toBeGreaterThan(0);
    });

    test("should have proper circle positioning", () => {
      svg
        .datum(
          prepareHierarchyData<TestDatum>()
            .layer((d) => d.category)
            .value((d) => d.value)
            .calculate(data)
        )
        .call(
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );
      svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .forEach((circle) => {
          const cx = parseFloat(circle.getAttribute("cx") || "0");
          const cy = parseFloat(circle.getAttribute("cy") || "0");
          const r = parseFloat(circle.getAttribute("r") || "0");
          expect(cx - r).toBeGreaterThanOrEqual(0);
          expect(cy - r).toBeGreaterThanOrEqual(0);
          expect(cx + r).toBeLessThanOrEqual(360);
          expect(cy + r).toBeLessThanOrEqual(250);
        });
    });
  });
});
