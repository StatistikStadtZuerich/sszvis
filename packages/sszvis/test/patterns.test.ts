import { select } from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { resolvedColor } from "./support/domValues.js";
import {
  dataAreaPattern,
  heatTableMissingValuePattern,
  mapLakeFadeGradient,
  mapLakeGradientMask,
  mapLakePattern,
  mapMissingValuePattern,
} from "../src/patterns.js";

describe("patterns", () => {
  let svg: SVGSVGElement,
    defs: SVGDefsElement,
    pattern: SVGPatternElement,
    gradient: SVGLinearGradientElement,
    mask: SVGMaskElement;

  beforeEach(() => {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient",
    ) as SVGLinearGradientElement;
    mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    svg.append(defs);
    defs.append(gradient);
    defs.append(pattern);
    defs.append(mask);
    document.body.append(svg);
  });

  /** The four endpoint coordinates of a line, as numbers. */
  const segment = (line: SVGLineElement) =>
    (["x1", "y1", "x2", "y2"] as const).map((name) => Number(line.getAttribute(name)));

  describe("heatTableMissingValuePattern", () => {
    // One tile is one shape: the pattern box, the background rect filling it and the two lines
    // drawn inside it are a single contract, so they are asserted together rather than as three
    // tests that each re-type a few of the source's constants.
    test("should draw a cross on a filled tile spanning the unit bounding box", () => {
      heatTableMissingValuePattern(select(pattern));

      // objectBoundingBox units, so the tile is the unit square and scales with the shape.
      expect(pattern.getAttribute("patternUnits")).toBe("objectBoundingBox");
      expect(pattern.getAttribute("patternContentUnits")).toBe("objectBoundingBox");
      expect(pattern.getAttribute("x")).toBe("0");
      expect(pattern.getAttribute("y")).toBe("0");
      expect(pattern.getAttribute("width")).toBe("1");
      expect(pattern.getAttribute("height")).toBe("1");

      const rect = pattern.querySelector("rect");
      expect(rect?.getAttribute("x")).toBe("0");
      expect(rect?.getAttribute("y")).toBe("0");
      expect(rect?.getAttribute("width")).toBe("1");
      expect(rect?.getAttribute("height")).toBe("1");
      expect(resolvedColor(rect?.getAttribute("fill"))).toMatch(/^rgb/);

      // Two diagonals that meet in the middle of the tile and run opposite ways: that is what
      // makes the mark read as a cross rather than as two parallel strokes.
      const lines = [...pattern.querySelectorAll("line")];
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        const [x1, y1, x2, y2] = segment(line);
        expect([x1, y1, x2, y2].every((value) => value >= 0 && value <= 1)).toBe(true);
        expect([(x1 + x2) / 2, (y1 + y2) / 2]).toEqual([0.5, 0.5]);
      }
      const slope = (line: SVGLineElement) => {
        const [x1, y1, x2, y2] = segment(line);
        return Math.sign((x2 - x1) * (y2 - y1));
      };
      expect(slope(lines[0])).toBe(-slope(lines[1]));
    });
  });

  describe("mapMissingValuePattern", () => {
    test("should hatch a filled 14 by 14 tile with evenly coloured diagonals", () => {
      mapMissingValuePattern(select(pattern));

      // userSpaceOnUse, so the texture keeps one size whatever shape it fills.
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("x")).toBe("0");
      expect(pattern.getAttribute("y")).toBe("0");
      expect(pattern.getAttribute("width")).toBe("14");
      expect(pattern.getAttribute("height")).toBe("14");

      const rect = pattern.querySelector("rect");
      expect(rect?.getAttribute("x")).toBe("0");
      expect(rect?.getAttribute("y")).toBe("0");
      expect(rect?.getAttribute("width")).toBe("14");
      expect(rect?.getAttribute("height")).toBe("14");
      expect(resolvedColor(rect?.getAttribute("fill"))).toMatch(/^rgb/);

      // The hatching reads as one texture only while every line shares a colour; which grey it
      // is belongs to the stylesheet review, not here.
      const lines = [...pattern.querySelectorAll("line")];
      expect(lines.length).toBeGreaterThan(0);
      const strokes = new Set(lines.map((line) => resolvedColor(line.getAttribute("stroke"))));
      expect(strokes.size).toBe(1);
      expect([...strokes][0]).toMatch(/^rgb/);
    });
  });

  describe("mapLakePattern", () => {
    test("should build a fixed-size tile carrying the lake texture's marks", () => {
      mapLakePattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
      expect(pattern.querySelector("rect")).toBeTruthy();
      expect(pattern.querySelectorAll("line").length).toBeGreaterThan(0);
    });
  });

  describe("mapLakeFadeGradient", () => {
    test("should define a two-stop vertical fade under the id the mask looks for", () => {
      mapLakeFadeGradient(select(gradient));

      // The default id is load-bearing: mapLakeGradientMask references exactly this name when
      // it is not given a scoped one.
      expect(gradient.getAttribute("id")).toBe("lake-fade-gradient");
      // Mostly vertical, so the lake fades towards its lower edge.
      expect(Number(gradient.getAttribute("y1"))).toBeLessThan(Number(gradient.getAttribute("y2")));

      const stops = [...gradient.querySelectorAll("stop")];
      expect(stops).toHaveLength(2);
      for (const stop of stops) {
        expect(stop.getAttribute("offset")).toBeTruthy();
        expect(stop.getAttribute("stop-opacity")).toBeTruthy();
      }
    });
  });

  describe("mapLakeGradientMask", () => {
    test("should fill the mask with a rect pointing at the fade gradient", () => {
      mapLakeGradientMask(select(mask));
      expect(mask.getAttribute("maskContentUnits")).toBe("objectBoundingBox");
      expect(mask.querySelector("rect")?.getAttribute("fill")).toBe("url(#lake-fade-gradient)");
    });
  });

  describe("dataAreaPattern", () => {
    test("should build a 6 by 6 tile of stroked lines", () => {
      dataAreaPattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("width")).toBe("6");
      expect(pattern.getAttribute("height")).toBe("6");

      const lines = [...pattern.querySelectorAll("line")];
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        expect(line.getAttribute("stroke")).toBeTruthy();
        expect(line.getAttribute("stroke-width")).toBeTruthy();
      }
    });
  });

  describe("scoped ids", () => {
    test("mapLakeFadeGradient writes a supplied id", () => {
      mapLakeFadeGradient(select(gradient), "lake-fade-gradient-7");
      expect(gradient.getAttribute("id")).toBe("lake-fade-gradient-7");
    });

    test("mapLakeFadeGradient accepts the id through selection.call", () => {
      select(gradient).call(mapLakeFadeGradient, "lake-fade-gradient-8");
      expect(gradient.getAttribute("id")).toBe("lake-fade-gradient-8");
    });

    test("mapLakeGradientMask references a supplied gradient id", () => {
      mapLakeGradientMask(select(mask), "lake-fade-gradient-7");
      expect(mask.querySelector("rect")?.getAttribute("fill")).toBe("url(#lake-fade-gradient-7)");
    });

    test("a later call repoints an existing mask rect at the new id", () => {
      mapLakeGradientMask(select(mask));
      mapLakeGradientMask(select(mask), "lake-fade-gradient-9");
      expect(mask.querySelectorAll("rect")).toHaveLength(1);
      expect(mask.querySelector("rect")?.getAttribute("fill")).toBe("url(#lake-fade-gradient-9)");
    });
  });

  describe("idempotency", () => {
    /**
     * The map renderers call these helpers unconditionally on every render, so applying one
     * twice has to update in place rather than append a second copy. One row per helper, since
     * the only thing that differs is which element it is applied to and what it should contain.
     */
    test.each([
      {
        helper: "heatTableMissingValuePattern",
        apply: () => heatTableMissingValuePattern(select(pattern)),
        target: () => pattern,
        counts: { rect: 1, line: 2 },
      },
      {
        helper: "mapMissingValuePattern",
        apply: () => mapMissingValuePattern(select(pattern)),
        target: () => pattern,
        counts: { rect: 1, line: 4 },
      },
      {
        helper: "mapLakePattern",
        apply: () => mapLakePattern(select(pattern)),
        target: () => pattern,
        counts: { rect: 1, line: 2 },
      },
      {
        helper: "mapLakeFadeGradient",
        apply: () => mapLakeFadeGradient(select(gradient)),
        target: () => gradient,
        counts: { stop: 2 },
      },
      {
        helper: "mapLakeGradientMask",
        apply: () => mapLakeGradientMask(select(mask)),
        target: () => mask,
        counts: { rect: 1 },
      },
      {
        helper: "dataAreaPattern",
        apply: () => dataAreaPattern(select(pattern)),
        target: () => pattern,
        counts: { line: 2 },
      },
    ])(
      "should leave one copy of its contents when $helper is applied twice",
      ({ apply, target, counts }) => {
        apply();
        apply();
        for (const [tag, expected] of Object.entries(counts)) {
          expect(target().querySelectorAll(tag)).toHaveLength(expected);
        }
      },
    );
  });
});
