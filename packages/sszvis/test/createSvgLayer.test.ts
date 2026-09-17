import { select } from "d3";
import { describe, expect, test } from "vitest";
import { bounds } from "../src/bounds.js";
import { createSvgLayer } from "../src/createSvgLayer.js";

describe("createSvgLayer", () => {
  test("should create SVG layer with default bounds", () => {
    const container = document.createElement("div");
    document.body.append(container);
    expect(createSvgLayer(container)).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains("sszvis-svg-layer")).toBe(true);
  });

  test("should create SVG layer with CSS selector", () => {
    const container = document.createElement("div");
    container.id = "chart-container";
    document.body.append(container);
    expect(createSvgLayer("#chart-container", undefined, { key: "test-layer" })).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  test("should create SVG layer with d3 selection", () => {
    const container = document.createElement("div");
    document.body.append(container);
    expect(createSvgLayer(select(container))).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  test("should apply custom bounds", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const customBounds = bounds({
      width: 800,
      height: 600,
    });
    createSvgLayer(container, customBounds);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("800");
    expect(svg?.getAttribute("height")).toBe("600");
  });

  test("should be idempotent with same key", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, undefined, { key: "same" });
    createSvgLayer(container, undefined, { key: "same" });
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  test("should create different layers with different keys", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, undefined, { key: "layer1" });
    createSvgLayer(container, undefined, { key: "layer2" });
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  test("should name the chart with aria-label and a desc, without a title tooltip", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, undefined, {
      title: "Chart Title",
      description: "Chart Description",
    });
    const svg = container.querySelector("svg");
    const desc = svg?.querySelector("desc");
    // The accessible name is the aria-label, not a <title>: a <title> would also make the
    // browser draw a native tooltip over the whole chart, on top of the chart's own hover.
    expect(svg?.querySelector("title")).toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Chart Title – Chart Description");
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toBe("Chart Description");
  });

  test("should apply transform for padding", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const customBounds = bounds({
      left: 50,
      top: 30,
    });
    const group = createSvgLayer(container, customBounds).node();
    expect(group?.getAttribute("transform")).toBe("translate(50,30)");
  });
});
