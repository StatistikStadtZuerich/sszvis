import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import textWrap from "../../src/svgUtils/textWrap.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// NOTE: width in pixels that the mocked text measurement assigns to a single character.
const CHAR_WIDTH = 10;

describe("svgUtils/textWrap", () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "300");
    document.body.append(svg);
  });

  afterEach(() => {
    svg.remove();
  });

  /** Appends a <text> element, optionally inside a <g class="tick"> like an axis label. */
  const appendText = (content: string, { inTick = false }: { inTick?: boolean } = {}) => {
    let parent: SVGElement = svg;
    if (inTick) {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "tick");
      svg.append(g);
      parent = g;
    }
    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = content;
    parent.append(text);
    return text;
  };

  const tspansOf = (text: SVGTextElement) => [...text.querySelectorAll("tspan")];

  describe("with mocked text measurement", () => {
    const originalGetComputedTextLength = SVGTextContentElement.prototype.getComputedTextLength;

    beforeEach(() => {
      SVGTextContentElement.prototype.getComputedTextLength = function (
        this: SVGTextContentElement
      ) {
        return (this.textContent ?? "").length * CHAR_WIDTH;
      };
    });

    afterEach(() => {
      SVGTextContentElement.prototype.getComputedTextLength = originalGetComputedTextLength;
    });

    describe("line breaking", () => {
      test("should keep text that fits on a single line", () => {
        // NOTE: available width is 100 - 2 * 5 = 90px, the text measures 50px.
        const text = appendText("aa bb");
        expect(textWrap(select(text), 100)).toEqual([1]);
        const tspans = tspansOf(text);
        expect(tspans).toHaveLength(1);
        expect(tspans[0].textContent).toBe("aa bb");
      });

      test("should break text that exceeds the available width", () => {
        // NOTE: available width is 90px; each word measures 50px, so only one fits per line.
        const text = appendText("aaaaa bbbbb ccccc");
        expect(textWrap(select(text), 100)).toEqual([3]);
        const tspans = tspansOf(text);
        expect(tspans).toHaveLength(3);
        expect(tspans.map((t) => t.textContent)).toEqual(["aaaaa", "bbbbb", "ccccc"]);
      });

      test("should keep a line that measures exactly the available width", () => {
        // NOTE: 9 characters measure 90px, exactly the available width of 100 - 2 * 5.
        const text = appendText("aaaa bbbb");
        expect(textWrap(select(text), 100)).toEqual([1]);
        expect(tspansOf(text)[0].textContent).toBe("aaaa bbbb");
      });

      test("should break a line that measures just over the available width", () => {
        // NOTE: 10 characters measure 100px, 10px over the available width of 100 - 2 * 5.
        const text = appendText("aaaa bbbbb");
        expect(textWrap(select(text), 100)).toEqual([2]);
        expect(tspansOf(text).map((t) => t.textContent)).toEqual(["aaaa", "bbbbb"]);
      });

      test("should not break a single word that exceeds the available width", () => {
        const text = appendText("aaaaaaaaaaaaaaaaaaaa");
        expect(textWrap(select(text), 100)).toEqual([1]);
        const tspans = tspansOf(text);
        expect(tspans).toHaveLength(1);
        expect(tspans[0].textContent).toBe("aaaaaaaaaaaaaaaaaaaa");
      });

      test("should move the text out of the text element and into tspans", () => {
        const text = appendText("aaaaa bbbbb");
        textWrap(select(text), 100);
        expect(text.childNodes).toHaveLength(2);
        expect([...text.childNodes].every((node) => node.nodeName === "tspan")).toBe(true);
        expect(text.textContent).toBe("aaaaabbbbb");
      });

      test("should split on all whitespace characters", () => {
        const text = appendText("aaaaa\tbbbbb\nccccc");
        expect(textWrap(select(text), 100)).toEqual([3]);
        expect(tspansOf(text).map((t) => t.textContent)).toEqual(["aaaaa", "bbbbb", "ccccc"]);
      });

      test("should return one line count per element in the selection", () => {
        const short = appendText("aa");
        const long = appendText("aaaaa bbbbb ccccc");
        expect(textWrap(select(svg).selectAll("text"), 100)).toEqual([1, 3]);
        expect(tspansOf(short)).toHaveLength(1);
        expect(tspansOf(long)).toHaveLength(3);
      });

      test("should return an empty array for an empty selection", () => {
        expect(textWrap(select(svg).selectAll("text"), 100)).toEqual([]);
      });

      test("should take the horizontal padding into account when breaking", () => {
        // NOTE: available width becomes 100 - 2 * 30 = 40px, so each 30px word gets its own line.
        const text = appendText("aaa bbb");
        expect(textWrap(select(text), 100, 30)).toEqual([2]);
      });
    });

    describe("horizontal placement", () => {
      test("should place untranslated text at the left padding for text-anchor start", () => {
        const text = appendText("aa");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("5");
      });

      test("should center untranslated text on the full width for text-anchor middle", () => {
        const text = appendText("aa");
        text.style.textAnchor = "middle";
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("50");
      });

      test("should place untranslated text at the right inset for text-anchor end", () => {
        const text = appendText("aa");
        text.style.textAnchor = "end";
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("95");
      });

      test("should offset tick labels relative to their own origin for text-anchor start", () => {
        // NOTE: tick labels are already translated, so x is measured from the tick's centre.
        const text = appendText("aa", { inTick: true });
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("-45");
      });

      test("should keep tick labels centered for text-anchor middle", () => {
        const text = appendText("aa", { inTick: true });
        text.style.textAnchor = "middle";
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("0");
      });

      test("should offset tick labels to the right for text-anchor end", () => {
        const text = appendText("aa", { inTick: true });
        text.style.textAnchor = "end";
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("45");
      });

      test("should apply the same x to every wrapped line", () => {
        const text = appendText("aaaaa bbbbb ccccc");
        textWrap(select(text), 100);
        expect(tspansOf(text).map((t) => t.getAttribute("x"))).toEqual(["5", "5", "5"]);
      });

      test("should honor a custom horizontal padding", () => {
        const text = appendText("aa");
        textWrap(select(text), 100, 20);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("20");
      });
    });

    describe("vertical placement", () => {
      test("should fall back to the vertical padding when the text has no y attribute", () => {
        // NOTE: the default vertical padding of 5 is reduced by 2 to account for borders.
        const text = appendText("aa");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("3");
      });

      test("should honor a custom vertical padding", () => {
        const text = appendText("aa");
        textWrap(select(text), 100, 5, 10);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("8");
      });

      test("should preserve the y attribute of the text element", () => {
        const text = appendText("aa");
        text.setAttribute("y", "20");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("20");
      });

      test("should apply the same y to every wrapped line", () => {
        const text = appendText("aaaaa bbbbb ccccc");
        text.setAttribute("y", "20");
        textWrap(select(text), 100);
        expect(tspansOf(text).map((t) => t.getAttribute("y"))).toEqual(["20", "20", "20"]);
      });

      test("should start at dy 0em when the text has no dy attribute", () => {
        const text = appendText("aa");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("dy")).toBe("0em");
      });

      test("should advance each wrapped line by one line height", () => {
        const text = appendText("aaaaa bbbbb ccccc");
        textWrap(select(text), 100);
        expect(tspansOf(text).map((t) => t.getAttribute("dy"))).toEqual(["0em", "1.1em", "2.2em"]);
      });

      test("should offset all lines by the dy of the text element", () => {
        const text = appendText("aaaaa bbbbb");
        text.setAttribute("dy", "0.5");
        textWrap(select(text), 100);
        expect(tspansOf(text).map((t) => t.getAttribute("dy"))).toEqual(["0.5em", "1.6em"]);
      });

      test("should treat an unparseable dy as zero", () => {
        const text = appendText("aa");
        text.setAttribute("dy", "inherit");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("dy")).toBe("0em");
      });
    });

    // Characterization test: pins down a defect so a behaviour-preserving port stays
    // verifiable. Carries a defect marker naming the cause and the correct behaviour.
    describe("known quirks", () => {
      test("keeps padding whitespace from the original text", () => {
        // BUG: the text is split on /[\t\n\v\f\r ]+/ without trimming first, so leading and
        // trailing whitespace yield empty words. Those survive the join(" ") and pad the
        // rendered line, and they also count toward the measured width.
        // current: " ab ". expected: "ab".
        const text = appendText("  ab  ");
        expect(textWrap(select(text), 100)).toEqual([1]);
        expect(tspansOf(text)[0].textContent).toBe(" ab ");
      });
    });
  });

  describe("with real text measurement", () => {
    test("should wrap a long sentence into multiple lines", () => {
      const text = appendText(
        "Die Bevölkerung der Stadt Zürich wächst seit vielen Jahren kontinuierlich an"
      );
      text.style.fontSize = "14px";
      const lineCounts = textWrap(select(text), 120);
      expect(lineCounts).toHaveLength(1);
      expect(lineCounts[0]).toBeGreaterThan(1);
      expect(tspansOf(text)).toHaveLength(lineCounts[0]);
      // NOTE: no line may exceed the available width unless it is a single unbreakable word.
      for (const tspan of tspansOf(text)) {
        const isSingleWord = !(tspan.textContent ?? "").trim().includes(" ");
        if (!isSingleWord) expect(tspan.getComputedTextLength()).toBeLessThanOrEqual(120 - 2 * 5);
      }
    });

    test("should keep a short label on one line", () => {
      const text = appendText("Zürich");
      text.style.fontSize = "14px";
      expect(textWrap(select(text), 200)).toEqual([1]);
    });

    test("should preserve all words of the original text", () => {
      const content = "Anteil der Bevölkerung mit Migrationshintergrund";
      const text = appendText(content);
      text.style.fontSize = "14px";
      textWrap(select(text), 120);
      const wrappedWords = tspansOf(text)
        .flatMap((t) => (t.textContent ?? "").split(" "))
        .filter(Boolean);
      expect(wrappedWords).toEqual(content.split(" "));
    });
  });
});
