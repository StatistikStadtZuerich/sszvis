import { afterEach, describe, expect, test } from "vitest";
import { bounds } from "../src/bounds.js";
import { createSvgLayer } from "../src/createSvgLayer.js";
import { describesLayerContainer } from "./support/layerConformance.js";

/**
 * The three container forms and the two key tests are shared with createHtmlLayer through
 * support/layerConformance.ts - each file registers its own copy against its own factory, so a
 * regression in one module still fails only that module's file. What stays here is what only the
 * svg layer does: sizing, the aria naming and the padding transform.
 */
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

  describesLayerContainer({
    containerId: "chart-container",
    makeContainer: container,
    create: (target, key) => {
      // SAFETY: the conformance suite hands back the same three container forms createSvgLayer
      // declares; the union it uses is not the factory's own overload set.
      createSvgLayer(target as never, undefined, key === undefined ? undefined : { key });
    },
    layers: (parent) => parent.querySelectorAll("svg.sszvis-svg-layer"),
  });

  test("should size the svg from the bounds it is given", () => {
    const parent = container();
    createSvgLayer(parent, bounds({ width: 800, height: 600 }));

    const svg = parent.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("800");
    expect(svg?.getAttribute("height")).toBe("600");
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
