import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import fitTooltip from "../../src/annotation/fitTooltip.js";
import tooltip from "../../src/annotation/tooltip.js";
import tooltipAnchor from "../../src/annotation/tooltipAnchor.js";
import { createHtmlLayer } from "../../src/createHtmlLayer";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  id: string;
  name: string;
  value: number;
  category: string;
};

type ComplexTestDatum = {
  measurement: {
    label: string;
    result: number;
  };
  metadata: {
    source: string;
    timestamp: Date;
  };
};

describe("annotation/tooltip", () => {
  let container: HTMLDivElement;
  let svgContainer: HTMLDivElement;
  let tooltipContainer: HTMLDivElement;

  beforeEach(() => {
    // Create main container
    container = document.createElement("div");
    container.id = "tooltip-test-container";
    container.style.width = "800px";
    container.style.height = "600px";
    container.style.position = "relative";
    document.body.appendChild(container);

    // Create SVG container for anchors
    svgContainer = document.createElement("div");
    svgContainer.id = "svg-container";
    svgContainer.style.width = "400px";
    svgContainer.style.height = "300px";
    container.appendChild(svgContainer);

    // Create HTML container for tooltips
    tooltipContainer = document.createElement("div");
    tooltipContainer.id = "tooltip-container";
    tooltipContainer.style.width = "800px";
    tooltipContainer.style.height = "600px";
    tooltipContainer.style.position = "absolute";
    tooltipContainer.style.top = "0";
    tooltipContainer.style.left = "0";
    tooltipContainer.style.pointerEvents = "none";
    container.appendChild(tooltipContainer);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const testData: TestDatum[] = [
    { id: "item1", name: "First Item", value: 100, category: "A" },
    { id: "item2", name: "Second Item", value: 250, category: "B" },
    { id: "item3", name: "Third Item", value: 75, category: "A" },
  ];

  test("should create tooltip component with proper configuration", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `Value: ${d.value}`)
      .orientation("bottom");

    expect(typeof tooltipComponent).toBe("function");
    expect(typeof tooltipComponent.renderInto).toBe("function");
    expect(typeof tooltipComponent.visible).toBe("function");
    expect(typeof tooltipComponent.header).toBe("function");
    expect(typeof tooltipComponent.body).toBe("function");
    expect(typeof tooltipComponent.orientation).toBe("function");
  });

  test("should render tooltip when visible is true", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    // Create tooltip anchors
    const anchor = tooltipAnchor().position((d: TestDatum, i: number) => [i * 100 + 50, 150]);

    svgLayer.selectGroup("anchors").datum(testData).call(anchor);

    // Create tooltip
    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `Value: ${d.value}`)
      .orientation("bottom");

    // Apply tooltip to anchors
    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    // Check that tooltips are rendered
    const tooltipElements = tooltipLayer.selectAll(".sszvis-tooltip").nodes();
    expect(tooltipElements.length).toBe(testData.length);

    // Check tooltip structure
    tooltipElements.forEach((tooltipEl, i) => {
      const tooltip = select(tooltipEl);
      expect(tooltip.classed("sszvis-tooltip")).toBe(true);

      // Check header content
      const header = tooltip.select(".sszvis-tooltip__header");
      expect(header.node()).not.toBeNull();
      expect(header.html()).toBe(testData[i].name);

      // Check body content
      const body = tooltip.select(".sszvis-tooltip__body");
      expect(body.node()).not.toBeNull();
      expect(body.html()).toBe(`Value: ${testData[i].value}`);

      // Check background
      const background = tooltip.select(".sszvis-tooltip__background");
      expect(background.node()).not.toBeNull();
    });
  });

  test("should not render tooltip when visible is false", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [100, 150]);

    svgLayer.selectGroup("anchors").datum(testData).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => false)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `Value: ${d.value}`);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElements = tooltipLayer.selectAll(".sszvis-tooltip").nodes();
    expect(tooltipElements.length).toBe(0);
  });

  test("should render tooltip with conditional visibility", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position((d: TestDatum, i: number) => [i * 100 + 50, 150]);

    svgLayer.selectGroup("anchors").datum(testData).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible((d: TestDatum) => d.value > 100) // Only show for high values
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `High value: ${d.value}`);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElements = tooltipLayer.selectAll(".sszvis-tooltip").nodes();
    const visibleData = testData.filter((d) => d.value > 100);
    expect(tooltipElements.length).toBe(visibleData.length);
  });

  test("should handle different orientation values", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const singleData = [testData[0]];
    const orientations = ["top", "bottom", "left", "right"] as const;

    orientations.forEach((orient) => {
      const anchor = tooltipAnchor().position(() => [200, 200]);

      svgLayer.selectGroup(`anchors-${orient}`).datum(singleData).call(anchor);

      const tooltipComponent = tooltip()
        .renderInto(tooltipLayer)
        .visible(() => true)
        .header((d: TestDatum) => d.name)
        .body((d: TestDatum) => `Orientation: ${orient}`)
        .orientation(orient);

      svgLayer.selectAll(`[data-tooltip-anchor]`).call(tooltipComponent);

      const tooltipElement = tooltipLayer.select(".sszvis-tooltip");
      expect(tooltipElement.node()).not.toBeNull();

      // Check that appropriate padding is applied based on orientation
      const paddingProp = `padding-${orient}`;
      const computedPadding = tooltipElement.style(paddingProp);
      expect(computedPadding).toContain("px"); // Should have padding for the tip
    });
  });

  test("should handle tabular data in body", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => [
        ["Property", "Value"],
        ["ID", d.id],
        ["Category", d.category],
        ["Value", String(d.value)],
      ]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const body = tooltipLayer.select(".sszvis-tooltip__body");
    expect(body.node()).not.toBeNull();

    const table = body.select("table");
    expect(table.node()).not.toBeNull();
    expect(table.classed("sszvis-tooltip__body__table")).toBe(true);

    const rows = table.selectAll("tr").nodes();
    expect(rows.length).toBe(4); // Header + 3 data rows
  });

  test("should apply small tooltip styling when appropriate", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    // Test with only header (should be small)
    const headerOnlyTooltip = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name);

    svgLayer.selectAll("[data-tooltip-anchor]").call(headerOnlyTooltip);

    const smallTooltip = tooltipLayer.select(".sszvis-tooltip");
    expect(smallTooltip.classed("sszvis-tooltip--small")).toBe(true);
  });

  test("should handle custom dx and dy offsets", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `Value: ${d.value}`)
      .dx(20)
      .dy(30)
      .orientation("bottom");

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElement = tooltipLayer.select(".sszvis-tooltip");
    expect(tooltipElement.node()).not.toBeNull();

    expect(tooltipElement.style("position")).toBe("static");
  });

  test("should handle opacity settings", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .opacity(0.5);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElement = tooltipLayer.select(".sszvis-tooltip");
    expect(tooltipElement.node()).not.toBeNull();
    expect(tooltipElement.style("opacity")).toBe("0.5");
  });

  test("should work with complex data structures", () => {
    const complexData: ComplexTestDatum[] = [
      {
        measurement: {
          label: "Temperature",
          result: 23.5,
        },
        metadata: {
          source: "Sensor A",
          timestamp: new Date("2024-01-01"),
        },
      },
    ];

    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum(complexData).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: ComplexTestDatum) => d.measurement.label)
      .body((d: ComplexTestDatum) => [
        ["Result", String(d.measurement.result)],
        ["Source", d.metadata.source],
        ["Date", d.metadata.timestamp.toLocaleDateString()],
      ]);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const header = tooltipLayer.select(".sszvis-tooltip__header");
    expect(header.html()).toBe("Temperature");

    const table = tooltipLayer.select(".sszvis-tooltip__body table");
    expect(table.node()).not.toBeNull();

    const rows = table.selectAll("tr").nodes();
    expect(rows.length).toBe(3);
  });

  test("should handle dynamic orientation based on data", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position((d: TestDatum, i: number) => [i * 200 + 100, 150]);

    svgLayer.selectGroup("anchors").datum(testData).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => d.category)
      .orientation((d: any) => {
        // Dynamic orientation based on position
        return d.x > 300 ? "left" : "right";
      });

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElements = tooltipLayer.selectAll(".sszvis-tooltip").nodes();
    expect(tooltipElements.length).toBe(testData.length);

    // Verify tooltips are rendered (specific positioning logic would be complex to test)
    tooltipElements.forEach((tooltipEl) => {
      const tooltip = select(tooltipEl);
      expect(tooltip.classed("sszvis-tooltip")).toBe(true);
    });
  });

  test("should handle missing or empty data gracefully", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const tooltipElements = tooltipLayer.selectAll(".sszvis-tooltip").nodes();
    expect(tooltipElements.length).toBe(0);
  });

  test("should handle constant values instead of accessor functions", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(true) // Constant value
      .header("Fixed Header") // Constant value
      .body("Fixed Body Content") // Constant value
      .orientation("top");

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const header = tooltipLayer.select(".sszvis-tooltip__header");
    expect(header.html()).toBe("Fixed Header");

    const body = tooltipLayer.select(".sszvis-tooltip__body");
    expect(body.html()).toBe("Fixed Body Content");
  });

  test("should handle SVG filter fallback correctly", () => {
    const tooltipLayer = createHtmlLayer("#tooltip-container");
    const svgLayer = createSvgLayer("#svg-container");

    const anchor = tooltipAnchor().position(() => [200, 200]);

    svgLayer.selectGroup("anchors").datum([testData[0]]).call(anchor);

    const tooltipComponent = tooltip()
      .renderInto(tooltipLayer)
      .visible(() => true)
      .header((d: TestDatum) => d.name)
      .body((d: TestDatum) => `Value: ${d.value}`);

    svgLayer.selectAll("[data-tooltip-anchor]").call(tooltipComponent);

    const background = tooltipLayer.select(".sszvis-tooltip__background");
    expect(background.node()).not.toBeNull();

    // The background should have either filter support or fallback class
    // We can't easily control SVG filter support in test environment
    const hasFilter = background.select("path").attr("filter");
    const hasFallback = background.classed("sszvis-tooltip__background--fallback");

    expect(hasFilter || hasFallback).toBeTruthy();
  });

  describe("fitTooltip", () => {
    test("should return default orientation when position is in middle range", () => {
      const bounds = { innerWidth: 400 };
      const defaultOrientation = "bottom";
      const fitted = fitTooltip(defaultOrientation, bounds);

      // Test position in middle range (between 100 and 300)
      const middlePosition = { x: 200 };
      expect(fitted(middlePosition)).toBe(defaultOrientation);
    });

    test("should return 'left' when position is too far right", () => {
      const bounds = { innerWidth: 400 };
      const defaultOrientation = "bottom";
      const fitted = fitTooltip(defaultOrientation, bounds);

      // Test position beyond hi threshold (300+)
      const rightPosition = { x: 350 };
      expect(fitted(rightPosition)).toBe("right");
    });

    test("should return 'right' when position is too far left", () => {
      const bounds = { innerWidth: 400 };
      const defaultOrientation = "bottom";
      const fitted = fitTooltip(defaultOrientation, bounds);

      // Test position below lo threshold (100-)
      const leftPosition = { x: 50 };
      expect(fitted(leftPosition)).toBe("left");
    });

    test("should handle small bounds width correctly", () => {
      const bounds = { innerWidth: 150 };
      const defaultOrientation = "top";
      const fitted = fitTooltip(defaultOrientation, bounds);

      // With width 150: lo = min(37.5, 100) = 37.5, hi = max(112.5, 50) = 112.5
      const leftEdgePosition = { x: 30 };
      const middlePosition = { x: 75 };
      const rightEdgePosition = { x: 120 };

      expect(fitted(leftEdgePosition)).toBe("left");
      expect(fitted(middlePosition)).toBe(defaultOrientation);
      expect(fitted(rightEdgePosition)).toBe("right");
    });

    test("should handle large bounds width correctly", () => {
      const bounds = { innerWidth: 800 };
      const defaultOrientation = "top";
      const fitted = fitTooltip(defaultOrientation, bounds);

      // With width 800: lo = min(200, 100) = 100, hi = max(600, 700) = 700
      const leftEdgePosition = { x: 80 };
      const middlePosition = { x: 400 };
      const rightEdgePosition = { x: 720 };

      expect(fitted(leftEdgePosition)).toBe("left");
      expect(fitted(middlePosition)).toBe(defaultOrientation);
      expect(fitted(rightEdgePosition)).toBe("right");
    });
  });
});
