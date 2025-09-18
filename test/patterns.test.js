import {
  heatTableMissingValuePattern,
  mapMissingValuePattern,
  mapLakePattern,
  mapLakeFadeGradient,
  mapLakeGradientMask,
  dataAreaPattern,
} from "../src/patterns.js";
import { expect, test, describe, beforeEach } from "vitest";
import { select } from "d3";

describe("patterns", () => {
  let svg, defs, pattern, gradient, mask;

  beforeEach(() => {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    svg.append(defs);
    defs.append(pattern);
    defs.append(gradient);
    defs.append(mask);
    document.body.append(svg);
  });

  describe("heatTableMissingValuePattern", () => {
    test("should set pattern attributes correctly", () => {
      heatTableMissingValuePattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("objectBoundingBox");
      expect(pattern.getAttribute("patternContentUnits")).toBe("objectBoundingBox");
      expect(pattern.getAttribute("x")).toBe("0");
      expect(pattern.getAttribute("y")).toBe("0");
      expect(pattern.getAttribute("width")).toBe("1");
      expect(pattern.getAttribute("height")).toBe("1");
    });

    test("should append rect element with correct attributes", () => {
      heatTableMissingValuePattern(select(pattern));
      const rect = pattern.querySelector("rect");
      expect(rect).toBeTruthy();
      expect(rect.getAttribute("x")).toBe("0");
      expect(rect.getAttribute("y")).toBe("0");
      expect(rect.getAttribute("width")).toBe("1");
      expect(rect.getAttribute("height")).toBe("1");
      expect(rect.getAttribute("fill")).toBeTruthy();
    });

    test("should append two line elements for cross pattern", () => {
      heatTableMissingValuePattern(select(pattern));
      const lines = pattern.querySelectorAll("line");
      expect(lines.length).toBe(2);
      expect(lines[0].getAttribute("x1")).toBe("0.35");
      expect(lines[0].getAttribute("y1")).toBe("0.35");
      expect(lines[0].getAttribute("x2")).toBe("0.65");
      expect(lines[0].getAttribute("y2")).toBe("0.65");
      expect(lines[1].getAttribute("x1")).toBe("0.65");
      expect(lines[1].getAttribute("y1")).toBe("0.35");
      expect(lines[1].getAttribute("x2")).toBe("0.35");
      expect(lines[1].getAttribute("y2")).toBe("0.65");
    });
  });

  describe("mapMissingValuePattern", () => {
    test("should set correct pattern dimensions", () => {
      mapMissingValuePattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("width")).toBe("14");
      expect(pattern.getAttribute("height")).toBe("14");
      expect(pattern.getAttribute("x")).toBe("0");
      expect(pattern.getAttribute("y")).toBe("0");
    });

    test("should append rect element with correct dimensions", () => {
      mapMissingValuePattern(select(pattern));
      const rect = pattern.querySelector("rect");
      expect(rect).toBeTruthy();
      expect(rect.getAttribute("x")).toBe("0");
      expect(rect.getAttribute("y")).toBe("0");
      expect(rect.getAttribute("width")).toBe("14");
      expect(rect.getAttribute("height")).toBe("14");
      expect(rect.getAttribute("fill")).toBe("#FAFAFA");
    });

    test("should create diagonal line pattern", () => {
      mapMissingValuePattern(select(pattern));
      const lines = pattern.querySelectorAll("line");
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.getAttribute("stroke")).toBe("#CCCCCC");
      }
    });
  });

  describe("mapLakePattern", () => {
    test("should set pattern attributes for lake texture", () => {
      mapLakePattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
    });

    test("should append rect and line elements", () => {
      mapLakePattern(select(pattern));
      const rect = pattern.querySelector("rect");
      const lines = pattern.querySelectorAll("line");
      expect(rect).toBeTruthy();
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe("mapLakeFadeGradient", () => {
    test("should set correct gradient attributes", () => {
      mapLakeFadeGradient(select(gradient));
      expect(gradient.getAttribute("x1")).toBe("0");
      expect(gradient.getAttribute("y1")).toBe("0");
      expect(gradient.getAttribute("x2")).toBe("0.55");
      expect(gradient.getAttribute("y2")).toBe("1");
      expect(gradient.getAttribute("id")).toBe("lake-fade-gradient");
    });

    test("should append gradient stops", () => {
      mapLakeFadeGradient(select(gradient));
      const stops = gradient.querySelectorAll("stop");
      expect(stops.length).toBe(2);
      for (const stop of stops) {
        expect(stop.getAttribute("offset")).toBeTruthy();
        expect(stop.getAttribute("stop-opacity")).toBeTruthy();
      }
    });
  });

  describe("mapLakeGradientMask", () => {
    test("should set mask attributes", () => {
      mapLakeGradientMask(select(mask));
      expect(mask.getAttribute("maskContentUnits")).toBe("objectBoundingBox");
    });

    test("should append rect with gradient fill", () => {
      mapLakeGradientMask(select(mask));
      const rect = mask.querySelector("rect");
      expect(rect).toBeTruthy();
      expect(rect.getAttribute("fill")).toBe("url(#lake-fade-gradient)");
    });
  });

  describe("dataAreaPattern", () => {
    test("should set pattern dimensions", () => {
      dataAreaPattern(select(pattern));
      expect(pattern.getAttribute("patternUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("patternContentUnits")).toBe("userSpaceOnUse");
      expect(pattern.getAttribute("width")).toBe("6");
      expect(pattern.getAttribute("height")).toBe("6");
    });

    test("should append line elements", () => {
      dataAreaPattern(select(pattern));
      const lines = pattern.querySelectorAll("line");
      expect(lines.length).toBe(2);
      for (const line of lines) {
        expect(line.getAttribute("stroke")).toBeTruthy();
        expect(line.getAttribute("stroke-width")).toBeTruthy();
      }
    });
  });
});
