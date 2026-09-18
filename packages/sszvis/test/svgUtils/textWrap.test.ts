import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
        this: SVGTextContentElement,
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

      test("should still break text when the horizontal padding is not a number", () => {
        // NOTE: a NaN padding must not poison the available width, which would compare every
        // measured line against NaN and silently disable wrapping altogether.
        const text = appendText("aaaaa bbbbb ccccc");
        expect(textWrap(select(text), 100, Number.NaN)).toEqual([3]);
      });
    });

    describe("horizontal placement", () => {
      // Each row is [expected x, text-anchor, whether the label sits in a tick group].
      const anchorPlacements: [string, string, boolean][] = [
        ["5", "start", false],
        ["50", "middle", false],
        ["95", "end", false],
        ["0", "middle", true],
        ["45", "end", true],
      ];

      test.each(anchorPlacements)(
        "should place the wrapped line at x=%s when the text-anchor is %s and the tick-group membership is %s",
        (expectedX, anchor, inTick) => {
          const text = appendText("aa", { inTick });
          text.style.textAnchor = anchor;
          textWrap(select(text), 100);
          expect(tspansOf(text)[0].getAttribute("x")).toBe(expectedX);
        },
      );

      test("should offset tick labels relative to their own origin for text-anchor start", () => {
        // NOTE: tick labels are already translated, so x is measured from the tick's centre.
        const text = appendText("aa", { inTick: true });
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("x")).toBe("-45");
      });

      test("should apply the same x to every wrapped line", () => {
        const text = appendText("aaaaa bbbbb ccccc");
        textWrap(select(text), 100);
        expect(tspansOf(text).map((t) => t.getAttribute("x"))).toEqual(["5", "5", "5"]);
      });

      // Each row is [expected x, the supplied horizontal padding]; 5 is the default padding.
      const horizontalPaddings: [string, number][] = [
        ["0", 0],
        ["20", 20],
        ["-10", -10],
        ["5", Number.NaN],
        ["5", Number.POSITIVE_INFINITY],
      ];

      test.each(horizontalPaddings)(
        "should place the wrapped line at x=%s when the horizontal padding is %s",
        (expectedX, padding) => {
          const text = appendText("aa");
          textWrap(select(text), 100, padding);
          expect(tspansOf(text)[0].getAttribute("x")).toBe(expectedX);
        },
      );

      test("should warn when a supplied horizontal padding is unusable", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        textWrap(select(appendText("aa")), 100, Number.NaN);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
      });

      test("should not warn when the horizontal padding is omitted", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        textWrap(select(appendText("aa")), 100);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
      });

      test("should warn once per render rather than latching across renders", () => {
        // NOTE: the warning is scoped to the call, not to the module, so a second chart on
        // the page still reports its own bad padding instead of being silenced by the first.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        textWrap(select(appendText("aa")), 100, Number.NaN);
        textWrap(select(appendText("aa")), 100, Number.NaN);
        textWrap(select(appendText("aa")), 100, Number.NaN);
        expect(warn).toHaveBeenCalledTimes(3);
        warn.mockRestore();
      });

      test("should warn separately for each of the two bad paddings", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        textWrap(select(appendText("aa")), 100, Number.NaN, Number.NaN);
        expect(warn).toHaveBeenCalledTimes(2);
        expect(warn.mock.calls.map(([message]) => message)).toEqual([
          "sszvis.svgUtils.textWrap: ignoring a non-finite paddingRightLeft, using 5",
          "sszvis.svgUtils.textWrap: ignoring a non-finite paddingTopBottom, using 5",
        ]);
        warn.mockRestore();
      });

      test("should treat a detached text node as not being a tick label", () => {
        const text = document.createElementNS(SVG_NS, "text");
        text.textContent = "aa";
        expect(() => textWrap(select(text), 100)).not.toThrow();
        expect(tspansOf(text)[0].getAttribute("x")).toBe("5");
      });
    });

    describe("vertical placement", () => {
      test("should fall back to the vertical padding when the text has no y attribute", () => {
        // NOTE: the default vertical padding of 5 is reduced by 2 to account for borders.
        const text = appendText("aa");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("3");
      });

      // Each row is [expected y, the supplied vertical padding]; 5 is the default padding.
      const verticalPaddings: [string, number][] = [
        ["8", 10],
        ["3", Number.NaN],
        ["3", Number.POSITIVE_INFINITY],
      ];

      test.each(verticalPaddings)(
        "should place the wrapped line at y=%s when the vertical padding is %s",
        (expectedY, padding) => {
          const text = appendText("aa");
          textWrap(select(text), 100, 5, padding);
          expect(tspansOf(text)[0].getAttribute("y")).toBe(expectedY);
        },
      );

      test("should honor a zero vertical padding", () => {
        // NOTE: the border adjustment of 2 still applies, so an explicit 0 yields -2.
        const text = appendText("aa");
        textWrap(select(text), 100, 5, 0);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("-2");
      });

      test("should honor a negative vertical padding", () => {
        // NOTE: the border adjustment of 2 still applies, so an explicit -10 yields -12.
        const text = appendText("aa");
        textWrap(select(text), 100, 5, -10);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("-12");
      });

      test.each([
        ["middle", "a non-tick text, where x is derived from the full width"],
        ["start", "a non-tick text, where x is the padding"],
      ])("should not wrap or write an x when the width is not finite (%s)", (anchorStyle) => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const text = appendText("aaaaa bbbbb ccccc");
        text.style.textAnchor = anchorStyle;
        expect(textWrap(select(text), Number.POSITIVE_INFINITY)).toEqual([]);
        // The text is left exactly as it was: no tspans, so nothing carries a poisoned x.
        expect(tspansOf(text).length).toBe(0);
        expect(text.textContent).toBe("aaaaa bbbbb ccccc");
        // SAFETY: without this, dropping the warning would leave the suite green.
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
      });

      test("should not wrap or write an x when a tick label is given a non-finite width", () => {
        // A tick label derives x from the narrowed width alone, so it is the other path into
        // the x attribute. axis().textWrap(Infinity) reaches exactly this: fn.defined, which
        // axis screens the prop with, excludes NaN but not Infinity.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const text = appendText("aaaaa bbbbb ccccc", { inTick: true });
        expect(textWrap(select(text), Number.POSITIVE_INFINITY)).toEqual([]);
        expect(tspansOf(text).length).toBe(0);
        warn.mockRestore();
      });

      test("should keep x and y numeric when both paddings are not finite", () => {
        const text = appendText("aaaaa bbbbb ccccc");
        textWrap(select(text), 100, Number.NaN, Number.NaN);
        for (const tspan of tspansOf(text)) {
          expect(tspan.getAttribute("x")).not.toBe("NaN");
          expect(tspan.getAttribute("y")).not.toBe("NaN");
        }
      });

      test("should treat a y the browser accepts but a number parser does not as absent", () => {
        // An SVG 'y' is a length, so "1em" is legal. +"1em" is NaN, which used to be written
        // straight back out as y="NaN" on every tspan. An unreadable y falls back to the
        // padding, as an absent one does.
        const text = appendText("aa");
        text.setAttribute("y", "1em");
        textWrap(select(text), 100);
        expect(tspansOf(text)[0].getAttribute("y")).toBe("3");
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

      // Each row is [expected dy per line, the dy attribute of the text element, the content].
      const dyProgressions: [string[], string | undefined, string][] = [
        [["0em"], undefined, "aa"],
        [["0em", "1.1em", "2.2em"], undefined, "aaaaa bbbbb ccccc"],
        [["0.5em", "1.6em"], "0.5", "aaaaa bbbbb"],
        [["0em"], "inherit", "aa"],
      ];

      test.each(dyProgressions)(
        "should stack the wrapped lines at dy %s when the dy attribute of the text is %s",
        (expectedDys, dyAttribute, content) => {
          const text = appendText(content);
          if (dyAttribute !== undefined) text.setAttribute("dy", dyAttribute);
          textWrap(select(text), 100);
          expect(tspansOf(text).map((t) => t.getAttribute("dy"))).toEqual(expectedDys);
        },
      );
    });

    // Characterization test: pins down a defect so a behaviour-preserving port stays
    // verifiable. Carries a defect marker naming the cause and the correct behaviour.
    describe("surrounding whitespace", () => {
      test("should drop whitespace padding from the rendered text", () => {
        const text = appendText("  ab  ");
        expect(textWrap(select(text), 100)).toEqual([1]);
        expect(tspansOf(text)[0].textContent).toBe("ab");
      });

      test("should not let whitespace padding push the text onto another line", () => {
        // NOTE: available width is 100 - 2 * 5 = 90px; "aa bb cc" measures exactly 80px,
        // so a single leading and trailing space used to tip it over the threshold.
        expect(textWrap(select(appendText("aa bb cc")), 100)).toEqual([1]);
        expect(textWrap(select(appendText(" aa bb cc ")), 100)).toEqual([1]);
      });

      test("should preserve non-breaking and line/paragraph separator characters", () => {
        // NOTE: the split class deliberately excludes \u00A0, \u2028 and \u2029 so they are
        // never treated as word boundaries. A trim() would break this.
        const text = appendText("a\u00A0b\u2028c\u2029d");
        expect(textWrap(select(text), 1000)).toEqual([1]);
        expect(tspansOf(text)[0].textContent).toBe("a\u00A0b\u2028c\u2029d");
      });
    });
  });

  describe("with real text measurement", () => {
    test("should wrap a long sentence into multiple lines", () => {
      const text = appendText(
        "Die Bevölkerung der Stadt Zürich wächst seit vielen Jahren kontinuierlich an",
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
