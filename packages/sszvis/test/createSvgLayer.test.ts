import { select } from "d3";
import { afterEach, describe, expect, test } from "vitest";
import { bounds } from "../src/bounds.js";
import { createSvgLayer } from "../src/createSvgLayer.js";

describe("createSvgLayer", () => {
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

  // The same three container forms are accepted by createHtmlLayer, which tests them in the
  // same shape.
  test.each([
    ["a DOM element", (parent: HTMLDivElement) => parent],
    ["a d3 selection", (parent: HTMLDivElement) => select(parent)],
    ["a CSS selector", () => "#chart-container"],
  ])(
    "should create an svg.sszvis-svg-layer in the container when given %s",
    (_label, toArgument) => {
      const parent = container("chart-container");
      createSvgLayer(toArgument(parent) as never);

      const svgs = parent.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
      expect(svgs[0].classList.contains("sszvis-svg-layer")).toBe(true);
    },
  );

  test("should size the svg from the bounds it is given", () => {
    const parent = container();
    createSvgLayer(parent, bounds({ width: 800, height: 600 }));

    const svg = parent.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("800");
    expect(svg?.getAttribute("height")).toBe("600");
  });

  test("should reuse the existing layer rather than add a second when the key repeats", () => {
    const parent = container();
    createSvgLayer(parent, undefined, { key: "same" });
    createSvgLayer(parent, undefined, { key: "same" });
    expect(parent.querySelectorAll("svg")).toHaveLength(1);
  });

  test("should create a separate layer for each distinct key", () => {
    const parent = container();
    createSvgLayer(parent, undefined, { key: "layer1" });
    createSvgLayer(parent, undefined, { key: "layer2" });
    expect(parent.querySelectorAll("svg")).toHaveLength(2);
  });

  test("should name the chart with aria-label and a desc, without a title tooltip", () => {
    const parent = container();
    createSvgLayer(parent, undefined, {
      title: "Chart Title",
      description: "Chart Description",
    });
    const svg = parent.querySelector("svg");
    const desc = svg?.querySelector("desc");
    // The accessible name is the aria-label, not a <title>: a <title> would also make the
    // browser draw a native tooltip over the whole chart, on top of the chart's own hover.
    expect(svg?.querySelector("title")).toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Chart Title – Chart Description");
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toBe("Chart Description");
  });

  test("should offset the returned group by the bounds' padding", () => {
    const parent = container();
    const group = createSvgLayer(parent, bounds({ left: 50, top: 30 })).node();
    expect(group?.getAttribute("transform")).toBe("translate(50,30)");
  });
});
