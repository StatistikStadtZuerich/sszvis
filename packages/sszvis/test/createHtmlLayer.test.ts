import { afterEach, describe, expect, test } from "vitest";
import { bounds } from "../src/bounds.js";
import { createHtmlLayer } from "../src/createHtmlLayer.js";
import { describesLayerContainer } from "./support/layerConformance.js";

/**
 * The three container forms and the two key tests are shared with createSvgLayer through
 * support/layerConformance.ts - each file registers its own copy against its own factory, so a
 * regression in one module still fails only that module's file. What stays here is positioning,
 * which is the html layer's own job.
 */
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

  describesLayerContainer({
    containerId: "html-container",
    makeContainer: container,
    create: (target, key) => {
      // SAFETY: the conformance suite hands back the same three container forms createHtmlLayer
      // declares; the union it uses is not the factory's own overload set.
      createHtmlLayer(target as never, undefined, key === undefined ? undefined : { key });
    },
    layers,
  });

  test("should position the layer over the svg's padding box, which is the layer's whole job", () => {
    const parent = container();
    createHtmlLayer(parent, bounds({ width: 400, height: 300, left: 25, top: 15 }));

    const style = (parent.querySelector("[data-sszvis-html-layer]") as HTMLElement).style;
    expect(style.position).toBe("absolute");
    expect(style.left).toBe("25px");
    expect(style.top).toBe("15px");
  });

});
