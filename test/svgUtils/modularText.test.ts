import { describe, expect, test } from "vitest";
import { modularTextHTML, modularTextSVG } from "../../src/svgUtils/modularText.js";

type Artist = { name: string; age: number };

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
        "Artist: Patti<br/><strong>67</strong> <em>years old</em>"
      );
    });

    test("should join words on a line with a single space", () => {
      expect(modularTextHTML().plain("a").plain("b").plain("c")({})).toBe("a b c");
    });

    test("should wrap bold words in strong and italic words in em", () => {
      expect(modularTextHTML().bold("b")({})).toBe("<strong>b</strong>");
      expect(modularTextHTML().italic("i")({})).toBe("<em>i</em>");
      expect(modularTextHTML().plain("p")({})).toBe("p");
    });

    test("should separate lines with a br tag", () => {
      expect(modularTextHTML().plain("a").newline().plain("b")({})).toBe("a<br/>b");
      expect(modularTextHTML().plain("a").newline().newline().plain("b")({})).toBe("a<br/><br/>b");
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

    test("should render an empty line as a lone br tag", () => {
      expect(modularTextHTML().newline()({})).toBe("<br/>");
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
        '<tspan x="0" dy="0"><tspan style="font-weight:bold">30</tspan> <tspan>items</tspan></tspan>'
      );
    });

    test("should wrap each word in a styled tspan", () => {
      expect(modularTextSVG().plain("p")({})).toBe('<tspan x="0" dy="0"><tspan>p</tspan></tspan>');
      expect(modularTextSVG().bold("b")({})).toBe(
        '<tspan x="0" dy="0"><tspan style="font-weight:bold">b</tspan></tspan>'
      );
      expect(modularTextSVG().italic("i")({})).toBe(
        '<tspan x="0" dy="0"><tspan style="font-style:italic">i</tspan></tspan>'
      );
    });

    test("should give the first line dy 0 and subsequent lines dy 1.2em", () => {
      expect(modularTextSVG().plain("a").newline().plain("b")({})).toBe(
        '<tspan x="0" dy="0"><tspan>a</tspan></tspan><tspan x="0" dy="1.2em"><tspan>b</tspan></tspan>'
      );
    });

    test("should reset x to 0 on every line", () => {
      const result = modularTextSVG().plain("a").newline().plain("b").newline().plain("c")({});
      expect(result.match(/x="0"/g)).toHaveLength(3);
      expect(result.match(/dy="1.2em"/g)).toHaveLength(2);
    });

    test("should join words on a line with a single space", () => {
      expect(modularTextSVG().plain("a").plain("b")({})).toBe(
        '<tspan x="0" dy="0"><tspan>a</tspan> <tspan>b</tspan></tspan>'
      );
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
