import { createHtmlLayer } from "../src/createHtmlLayer.js";
import { bounds } from "../src/bounds.js";
import { expect, test, describe } from "vitest";
import { select } from "d3";

describe("createHtmlLayer", () => {
  test("should create HTML layer with default bounds", () => {
    const container = document.createElement("div");
    document.body.append(container);
    expect(createHtmlLayer(container)).toBeDefined();
    const htmlLayer = container.querySelector("[data-sszvis-html-layer]");
    expect(htmlLayer).toBeTruthy();
  });

  test("should create HTML layer with CSS selector", () => {
    const container = document.createElement("div");
    container.id = "html-container";
    document.body.append(container);
    expect(createHtmlLayer("#html-container")).toBeDefined();
    const htmlLayer = container.querySelector("[data-sszvis-html-layer]");
    expect(htmlLayer).toBeTruthy();
  });

  test("should create HTML layer with d3 selection", () => {
    const container = document.createElement("div");
    document.body.append(container);
    expect(createHtmlLayer(select(container))).toBeDefined();
    const htmlLayer = container.querySelector("[data-sszvis-html-layer]");
    expect(htmlLayer).toBeTruthy();
  });

  test("should apply custom bounds positioning", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const customBounds = bounds({
      width: 400,
      height: 300,
      left: 25,
      top: 15,
    });
    createHtmlLayer(container, customBounds);
    const style = container.querySelector("[data-sszvis-html-layer]").style;
    expect(style.position).toBe("absolute");
    expect(style.left).toBe("25px");
    expect(style.top).toBe("15px");
  });

  test("should be idempotent with same key", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createHtmlLayer(container, null, { key: "same" });
    createHtmlLayer(container, null, { key: "same" });
    expect(container.querySelectorAll("[data-sszvis-html-layer]")).toHaveLength(1);
  });

  test("should create different layers with different keys", () => {
    const container = document.createElement("div");
    document.body.append(container);
    createHtmlLayer(container, null, { key: "layer1" });
    createHtmlLayer(container, null, { key: "layer2" });
    expect(container.querySelectorAll("[data-sszvis-html-layer]")).toHaveLength(2);
  });
});
