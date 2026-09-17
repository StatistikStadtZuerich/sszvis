import { describe, expect, test } from "vitest";
import {
  type ModularTextBuilder,
  modularTextHTML,
  modularTextSVG,
} from "../../src/svgUtils/modularText.js";

type Artist = { name: string; age: number };

/** Each row is [what the builder renders and when, the builder, the expected markup]. */
type MarkupCase = [string, ModularTextBuilder, string];

describe("svgUtils/modularText", () => {
  describe("modularTextHTML", () => {
    test("should render the example from the module documentation", () => {
      const fmtHtml = modularTextHTML()
        .plain("Artist:")
        .plain((d: Artist) => d.name)
        .newline()
        .bold((d: Artist) => d.age)
        .italic("years old");
      expect(fmtHtml({ name: "Patti", age: 67 })).toBe(
        "Artist: Patti<br/><strong>67</strong> <em>years old</em>",
      );
    });

    const htmlMarkup: MarkupCase[] = [
      [
        '"a b c" when plain words share a line',
        modularTextHTML().plain("a").plain("b").plain("c"),
        "a b c",
      ],
      [
        '"<strong>b</strong>" when a word is bold',
        modularTextHTML().bold("b"),
        "<strong>b</strong>",
      ],
      ['"<em>i</em>" when a word is italic', modularTextHTML().italic("i"), "<em>i</em>"],
      ['"p" when a word is plain', modularTextHTML().plain("p"), "p"],
      [
        '"a<br/>b" when a newline separates two lines',
        modularTextHTML().plain("a").newline().plain("b"),
        "a<br/>b",
      ],
      [
        '"a<br/><br/>b" when two newlines separate two lines',
        modularTextHTML().plain("a").newline().newline().plain("b"),
        "a<br/><br/>b",
      ],
      ['"<br/>" when the only line is empty', modularTextHTML().newline(), "<br/>"],
    ];

    test.each(htmlMarkup)("should render %s", (_label, builder, expected) => {
      expect(builder({})).toBe(expected);
    });

    test("should accept accessor functions and pass them the datum", () => {
      const received: unknown[] = [];
      const fmt = modularTextHTML().plain((d: Artist) => {
        received.push(d);
        return d.name;
      });
      const datum = { name: "Nina", age: 76 };
      expect(fmt(datum)).toBe("Nina");
      expect(received).toEqual([datum]);
    });

    test("should be reusable across data", () => {
      const fmt = modularTextHTML()
        .plain("Artist:")
        .plain((d: Artist) => d.name);
      expect(fmt({ name: "Patti", age: 67 })).toBe("Artist: Patti");
      expect(fmt({ name: "Nina", age: 76 })).toBe("Artist: Nina");
    });

    test("should keep separate builders independent", () => {
      const a = modularTextHTML().plain("A");
      const b = modularTextHTML().plain("B");
      expect(a({})).toBe("A");
      expect(b({})).toBe("B");
    });

    test("should return an empty string for a builder without words", () => {
      // NOTE: the HTML and SVG variants disagree on the empty case — SVG still emits a
      // wrapper tspan (see the modularTextSVG suite). Documented in the modularText.ts
      // JSDoc; pinned here so the asymmetry cannot change by accident.
      expect(modularTextHTML()({})).toBe("");
    });

    test("should coerce non-string values to strings", () => {
      expect(modularTextHTML().plain(42)({})).toBe("42");
      expect(modularTextHTML().bold(0)({})).toBe("<strong>0</strong>");
    });
  });

  describe("modularTextSVG", () => {
    test("should render the example from the module documentation", () => {
      const fmtSvg = modularTextSVG()
        .bold((d: { items: number }) => d.items)
        .plain("items");
      expect(fmtSvg({ items: 30 })).toBe(
        '<tspan x="0" dy="0"><tspan style="font-weight:bold">30</tspan> <tspan>items</tspan></tspan>',
      );
    });

    const svgMarkup: MarkupCase[] = [
      [
        "a plain word wrapped in a bare tspan when the word has no style",
        modularTextSVG().plain("p"),
        '<tspan x="0" dy="0"><tspan>p</tspan></tspan>',
      ],
      [
        "a bold style on the word tspan when the word is bold",
        modularTextSVG().bold("b"),
        '<tspan x="0" dy="0"><tspan style="font-weight:bold">b</tspan></tspan>',
      ],
      [
        "an italic style on the word tspan when the word is italic",
        modularTextSVG().italic("i"),
        '<tspan x="0" dy="0"><tspan style="font-style:italic">i</tspan></tspan>',
      ],
      [
        "a single space between the word tspans when plain words share a line",
        modularTextSVG().plain("a").plain("b"),
        '<tspan x="0" dy="0"><tspan>a</tspan> <tspan>b</tspan></tspan>',
      ],
      [
        "dy 0 on the first line and dy 1.2em on the second when a newline separates them",
        modularTextSVG().plain("a").newline().plain("b"),
        '<tspan x="0" dy="0"><tspan>a</tspan></tspan><tspan x="0" dy="1.2em"><tspan>b</tspan></tspan>',
      ],
      [
        "x reset to 0 on every line when the text spans three lines",
        modularTextSVG().plain("a").newline().plain("b").newline().plain("c"),
        '<tspan x="0" dy="0"><tspan>a</tspan></tspan>' +
          '<tspan x="0" dy="1.2em"><tspan>b</tspan></tspan>' +
          '<tspan x="0" dy="1.2em"><tspan>c</tspan></tspan>',
      ],
    ];

    test.each(svgMarkup)("should render %s", (_label, builder, expected) => {
      expect(builder({})).toBe(expected);
    });

    test("should accept accessor functions and pass them the datum", () => {
      const fmt = modularTextSVG().plain((d: { value: number }) => d.value * 2);
      expect(fmt({ value: 21 })).toBe('<tspan x="0" dy="0"><tspan>42</tspan></tspan>');
    });

    test("should be reusable across data", () => {
      const fmt = modularTextSVG().bold((d: { items: number }) => d.items);
      expect(fmt({ items: 1 })).toContain(">1<");
      expect(fmt({ items: 2 })).toContain(">2<");
    });

    test("should render an empty outer tspan for a builder without words", () => {
      // NOTE: the SVG counterpart of the empty case noted in the modularTextHTML suite.
      // An empty builder still produces one wrapper tspan rather than an empty string.
      expect(modularTextSVG()({})).toBe('<tspan x="0" dy="0"></tspan>');
    });

    test("should produce markup that parses into the expected tspan structure", () => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.innerHTML = modularTextSVG()
        .bold((d: { items: number }) => d.items)
        .plain("items")
        .newline()
        .italic("in stock")({ items: 30 });
      const lines = text.querySelectorAll(":scope > tspan");
      expect(lines).toHaveLength(2);
      expect(lines[0].getAttribute("dy")).toBe("0");
      expect(lines[1].getAttribute("dy")).toBe("1.2em");
      expect(lines[0].textContent).toBe("30 items");
      expect(lines[1].textContent).toBe("in stock");
    });
  });
});
