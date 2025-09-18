import { createSvgLayer } from "../src/createSvgLayer.js";
import { bounds } from "../src/bounds.js";
import { expect, test, describe } from "vitest";
import { select } from "d3";

describe("createSvgLayer", () => {
  test("should create SVG layer with default bounds", () => {
    const container = document.createElement("div");
    document.body.append(container);
    expect(createSvgLayer(container)).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.classList.contains("sszvis-svg-layer")).toBe(true);
  });

  test("should create SVG layer with CSS selector", () => {
    const container = document.createElement("div");
    container.id = "chart-container";
    document.body.append(container);
    expect(createSvgLayer("#chart-container", null, { key: "test-layer" })).toBeDefined();
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
    expect(svg.getAttribute("width")).toBe("800");
    expect(svg.getAttribute("height")).toBe("600");
  });

  test("should be idempotent with same key", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, null, { key: "same" });
    createSvgLayer(container, null, { key: "same" });
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  test("should create different layers with different keys", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, null, { key: "layer1" });
    createSvgLayer(container, null, { key: "layer2" });
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  test("should set accessibility attributes", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, null, {
      title: "Test Chart",
      description: "A test chart description",
    });
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toContain("Test Chart");
    expect(svg.getAttribute("aria-label")).toContain("A test chart description");
  });

  test("should include title and description elements", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createSvgLayer(container, null, {
      title: "Chart Title",
      description: "Chart Description",
    });
    const svg = container.querySelector("svg");
    const title = svg.querySelector("title");
    const desc = svg.querySelector("desc");
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
    expect(title.textContent).toBe("Chart Title");
    expect(desc.textContent).toBe("Chart Description");
  });

  test("should apply transform for padding", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const customBounds = bounds({
      left: 50,
      top: 30,
    });
    const group = createSvgLayer(container, customBounds).node();
    expect(group.getAttribute("transform")).toBe("translate(50,30)");
  });

  test("should return a d3 selection", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const layer = createSvgLayer(container);
    expect(typeof layer.append).toBe("function");
    expect(typeof layer.attr).toBe("function");
    expect(typeof layer.selectAll).toBe("function");
  });
});
