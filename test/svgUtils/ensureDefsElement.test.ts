import { select } from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import ensureDefsElement from "../../src/svgUtils/ensureDefsElement.js";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("ensureDefsElement", () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = document.createElementNS(SVG_NS, "svg");
    document.body.append(svg);
  });

  test("creates the defs container and the element within it", () => {
    const pattern = ensureDefsElement(select(svg), "pattern", "stripes");

    expect(svg.querySelector("defs > pattern#stripes")).toBe(pattern.node());
  });

  test("reuses the element instead of appending a second one", () => {
    const first = ensureDefsElement(select(svg), "pattern", "stripes").node();
    const second = ensureDefsElement(select(svg), "pattern", "stripes").node();

    expect(second).toBe(first);
    expect(svg.querySelectorAll("pattern")).toHaveLength(1);
  });

  test("distinguishes two elements of the same type by id", () => {
    ensureDefsElement(select(svg), "pattern", "stripes");
    ensureDefsElement(select(svg), "pattern", "dots");

    expect(svg.querySelectorAll("pattern")).toHaveLength(2);
  });

  test("looks up an id holding a CSS-significant character", () => {
    // Unescaped, `pattern#a"b` is not a valid selector and selectAll throws.
    const first = ensureDefsElement(select(svg), "pattern", 'a"b').node();
    const second = ensureDefsElement(select(svg), "pattern", 'a"b').node();

    expect(second).toBe(first);
    expect(svg.querySelectorAll("pattern")).toHaveLength(1);
  });

  test("looks up an empty id", () => {
    // `pattern#` is not a valid selector, so an id selector threw before the element
    // could be created.
    const first = ensureDefsElement(select(svg), "pattern", "").node();
    const second = ensureDefsElement(select(svg), "pattern", "").node();

    expect(second).toBe(first);
    expect(svg.querySelectorAll("pattern")).toHaveLength(1);
  });

  test("keeps a nested group's defs separate from its ancestor's", () => {
    // A descendant lookup let an outer selection reuse a nested group's defs, so the two
    // shared one definition and either could clear the other's.
    const outer = svg.appendChild(document.createElementNS(SVG_NS, "g"));
    const inner = outer.appendChild(document.createElementNS(SVG_NS, "g"));

    const innerPattern = ensureDefsElement(select(inner), "pattern", "stripes").node();
    const outerPattern = ensureDefsElement(select(outer), "pattern", "stripes").node();

    expect(outerPattern).not.toBe(innerPattern);
    expect(innerPattern?.parentElement?.parentElement).toBe(inner);
    expect(outerPattern?.parentElement?.parentElement).toBe(outer);
  });

  test("looks up an id holding a space", () => {
    // This is the case that failed silently: `pattern#a b` is a *valid* descendant
    // selector - a <pattern id="a"> containing a <b> - so it matched nothing and a
    // second definition was appended on every render.
    const first = ensureDefsElement(select(svg), "pattern", "a b").node();
    const second = ensureDefsElement(select(svg), "pattern", "a b").node();

    expect(second).toBe(first);
    expect(svg.querySelectorAll("pattern")).toHaveLength(1);
  });
});
