import { select } from "d3";
import { afterEach, describe, expect, test } from "vitest";
import { bounds } from "../src/bounds.js";
import { createHtmlLayer } from "../src/createHtmlLayer.js";

describe("createHtmlLayer", () => {
  // Containers are removed between tests: the selector case below looks an id up in the
  // whole document, so a leftover container from an earlier test would shadow the new one.
  const created: Element[] = [];
  afterEach(() => {
    for (const element of created.splice(0)) element.remove();
  });

  const container = (id?: string) => {
    const div = document.createElement("div");
    if (id) div.id = id;
    document.body.append(div);
    created.push(div);
    return div;
  };

  const layers = (parent: Element) => parent.querySelectorAll("[data-sszvis-html-layer]");

  // The same three container forms are accepted by createSvgLayer, which tests them in the
  // same shape.
  test.each([
    ["a DOM element", (parent: HTMLDivElement) => parent],
    ["a d3 selection", (parent: HTMLDivElement) => select(parent)],
    ["a CSS selector", () => "#html-container"],
  ])("should create the layer in the container when given %s", (_label, toArgument) => {
    const parent = container("html-container");
    createHtmlLayer(toArgument(parent) as never);
    expect(layers(parent)).toHaveLength(1);
  });

  test("should position the layer over the svg's padding box, which is the layer's whole job", () => {
    const parent = container();
    createHtmlLayer(parent, bounds({ width: 400, height: 300, left: 25, top: 15 }));

    const style = (parent.querySelector("[data-sszvis-html-layer]") as HTMLElement).style;
    expect(style.position).toBe("absolute");
    expect(style.left).toBe("25px");
    expect(style.top).toBe("15px");
  });

  test("should reuse the existing layer rather than add a second when the key repeats", () => {
    const parent = container();
    createHtmlLayer(parent, undefined, { key: "same" });
    createHtmlLayer(parent, undefined, { key: "same" });
    expect(layers(parent)).toHaveLength(1);
  });

  test("should create a separate layer for each distinct key", () => {
    const parent = container();
    createHtmlLayer(parent, undefined, { key: "layer1" });
    createHtmlLayer(parent, undefined, { key: "layer2" });
    expect(layers(parent)).toHaveLength(2);
  });
});
