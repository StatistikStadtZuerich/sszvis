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
        .filter((circle) => circle.getAttribute("fill") !== "white");

      if (leafCircles.length > 0) {
        const leafCircle = leafCircles[0];
        // The component applies color scale to stroke, not circleStroke prop
        const stroke = leafCircle.getAttribute("stroke");
        expect(stroke).toBeDefined();
        // Stroke should be from the color scale
        expect(["#1f77b4", "#ff7f0e", "#2ca02c"].includes(stroke || "")).toBe(true);
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

          if (fill === "white") {
            branchCount++;
            expect(strokeWidth).toBe("2"); // Branch nodes have thicker stroke
          } else {
            leafCount++;
            // Leaf nodes can have stroke-width of 1 or 2 depending on hierarchy
            expect(["1", "2"].includes(strokeWidth || "")).toBe(true);
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

  describe("onClick functionality", () => {
    test("should call onClick handler when circle is clicked", () => {
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;
      expect(circle).toBeDefined();

      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;
      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        expect.objectContaining({
          data: expect.any(Object),
          x: expect.any(Number),
          y: expect.any(Number),
          r: expect.any(Number),
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;
      const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 50,
      });
      circle.dispatchEvent(mouseEvent);

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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circles = svg.selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle");
      circles.each(function () {
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .transition(false)
        );

      const circles = svg.selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle");
      circles.each(function () {
        const cursor = this.style.cursor || this.getAttribute("cursor");
        expect(cursor).not.toBe("pointer");
      });
    });

    test("should handle clicks on leaf nodes", () => {
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      // Find a leaf node (circle with fill color, not "white")
      const leafCircle = svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .find((circle) => circle.getAttribute("fill") !== "white");

      expect(leafCircle).toBeDefined();
      if (leafCircle) {
        leafCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(clickHandler).toHaveBeenCalledTimes(1);

        const [, nodeArg] = clickHandler.mock.calls[0];
        // Leaf nodes should not have children or have an empty children array
        expect(!nodeArg.children || nodeArg.children.length === 0).toBe(true);
      }
    });

    test("should handle clicks on branch nodes (category circles)", () => {
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      // Find a branch node (circle with fill="white")
      const branchCircle = svg
        .selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle")
        .nodes()
        .find((circle) => circle.getAttribute("fill") === "white");

      expect(branchCircle).toBeDefined();
      if (branchCircle) {
        branchCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(clickHandler).toHaveBeenCalledTimes(1);

        const [, nodeArg] = clickHandler.mock.calls[0];
        // Branch nodes should have children
        expect(nodeArg.children).toBeDefined();
        expect(Array.isArray(nodeArg.children)).toBe(true);
        expect(nodeArg.children.length).toBeGreaterThan(0);
      }
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;

      // Simulate hover
      circle.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      circle.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

      // Click should still work after hover
      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;
      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const [, nodeArg] = clickHandler.mock.calls[0];
      // Node should have hierarchy data structure with traversal methods
      expect(nodeArg).toBeDefined();
      expect(nodeArg.data).toBeDefined();
      expect(typeof nodeArg.ancestors).toBe("function");
      expect(typeof nodeArg.descendants).toBe("function");
      // Ancestors should include at least the node itself
      expect(nodeArg.ancestors().length).toBeGreaterThanOrEqual(1);
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
          pack<TestDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circles = svg.selectAll<SVGCircleElement, TestDatum>(".sszvis-pack-circle");
      const firstCircle = circles.nodes()[0];
      const secondCircle = circles.nodes()[1];

      firstCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      secondCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      firstCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    test("should support onClick getter/setter API", () => {
      const clickHandler = vi.fn();
      const packComponent = pack<TestDatum>()
        .colorScale(cScale)
        .containerWidth(360)
        .containerHeight(250)
        .onClick(clickHandler);

      expect(packComponent.onClick()).toBe(clickHandler);
    });

    test("should work with 4-level hierarchy data", () => {
      type DeepDatum = {
        category: string;
        subcategory: string;
        division: string;
        team: string;
        value: number;
      };

      const deepData: DeepDatum[] = [
        {
          category: "Technology",
          subcategory: "Software",
          division: "Frontend",
          team: "Team A",
          value: 100,
        },
        {
          category: "Technology",
          subcategory: "Software",
          division: "Backend",
          team: "Team B",
          value: 80,
        },
        {
          category: "Finance",
          subcategory: "Banking",
          division: "Retail",
          team: "Team C",
          value: 150,
        },
      ];

      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<DeepDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .layer((d) => d.division)
            .layer((d) => d.team)
            .value((d) => d.value)
            .calculate(deepData)
        )
        .call(
          pack<DeepDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circle = svg.select(".sszvis-pack-circle").node() as SVGCircleElement;
      expect(circle).toBeDefined();

      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(1);
      const [, nodeArg] = clickHandler.mock.calls[0];
      expect(nodeArg).toBeDefined();
      expect(nodeArg.data).toBeDefined();
    });

    test("should work with uneven tree structures", () => {
      type UnevenDatum = {
        category: string;
        subcategory: string;
        division: string | null;
        value: number;
      };

      const unevenData: UnevenDatum[] = [
        {
          category: "Technology",
          subcategory: "Software",
          division: "Frontend",
          value: 100,
        },
        {
          category: "Technology",
          subcategory: "Hardware",
          division: null, // Missing division
          value: 80,
        },
        {
          category: "Finance",
          subcategory: "Banking",
          division: "Retail",
          value: 150,
        },
      ];

      const clickHandler = vi.fn();

      svg
        .datum(
          prepareHierarchyData<UnevenDatum>()
            .layer((d) => d.category)
            .layer((d) => d.subcategory)
            .layer((d) => d.division)
            .value((d) => d.value)
            .calculate(unevenData)
        )
        .call(
          pack<UnevenDatum>()
            .colorScale(cScale)
            .containerWidth(360)
            .containerHeight(250)
            .onClick(clickHandler)
            .transition(false)
        );

      const circles = svg.selectAll<SVGCircleElement, UnevenDatum>(".sszvis-pack-circle");
      expect(circles.size()).toBeGreaterThan(0);

      // Click on multiple circles to ensure all work with uneven structure
      const firstCircle = circles.nodes()[0];
      const lastCircle = circles.nodes()[circles.size() - 1];

      firstCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      lastCircle.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(clickHandler).toHaveBeenCalledTimes(2);
    });
  });
});
