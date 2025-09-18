import { measureDimensions, measureText } from "../src/measure.js";
import { expect, test, describe, vi } from "vitest";
import { select } from "d3";

describe("measure", () => {
  describe("measureDimensions", () => {
    test("should measure dimensions from DOM element", () => {
      const div = document.createElement("div");
      div.getBoundingClientRect = vi.fn().mockReturnValue({ width: 500 });
      document.body.append(div);
      expect(measureDimensions(div)).toEqual({
        width: 500,
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
      });
    });

    test("should measure dimensions from CSS selector", () => {
      const div = document.createElement("div");
      div.id = "test-element";
      div.getBoundingClientRect = vi.fn().mockReturnValue({ width: 300 });
      document.body.append(div);
      expect(measureDimensions("#test-element")).toEqual({
        width: 300,
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
      });
    });

    test("should measure dimensions from d3 selection", () => {
      const div = document.createElement("div");
      div.getBoundingClientRect = vi.fn().mockReturnValue({ width: 400 });
      document.body.append(div);
      expect(measureDimensions(select(div))).toEqual({
        width: 400,
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
      });
    });

    test("should return undefined width when element does not exist", () => {
      expect(measureDimensions("#non-existent")).toEqual({
        width: undefined,
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
      });
    });

    test("should return undefined width when node is null", () => {
      expect(measureDimensions(null)).toEqual({
        width: undefined,
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
      });
    });

    test("should measure actual DOM element dimensions in browser mode", () => {
      const div = document.createElement("div");
      div.style.width = "200px";
      div.style.height = "100px";
      div.style.position = "absolute";
      div.style.top = "-9999px"; // Hide offscreen
      document.body.append(div);
      const result = measureDimensions(div);
      expect(result.width).toBeCloseTo(200, 0); // Allow for subpixel differences
      expect(result.screenWidth).toBe(window.innerWidth || 1024);
      expect(result.screenHeight).toBe(window.innerHeight || 768);
    });
  });

  describe("measureText", () => {
    test.each([
      [[9, "Arial, sans-serif", "Test"], 16.5],
      [[16, "Arial, sans-serif", "Test"], 29],
      [[36, "Arial, sans-serif", "Test"], 66],
      [[9, "Arial, sans-serif", "The rabbit goes down the hole"], 121],
      [[16, "Arial, sans-serif", "The rabbit goes down the hole"], 215],
      [[36, "Arial, sans-serif", "The rabbit goes down the hole"], 484],

      [[9, "Times, serif", "Test"], 15],
      [[16, "Times, serif", "Test"], 26],
      [[36, "Times, serif", "Test"], 59],
      [[9, "Times, serif", "The rabbit goes down the hole"], 109],
      [[16, "Times, serif", "The rabbit goes down the hole"], 194],
      [[36, "Times, serif", "The rabbit goes down the hole"], 437],

      [[9, "Courier, monospace", "Test"], 22],
      [[16, "Courier, monospace", "Test"], 38],
      [[36, "Courier, monospace", "Test"], 86],
      [[9, "Courier, monospace", "The rabbit goes down the hole"], 157],
      [[16, "Courier, monospace", "The rabbit goes down the hole"], 278],
      [[36, "Courier, monospace", "The rabbit goes down the hole"], 627],
    ])('%s -> "%s"', (input, output) => {
      expect(measureText(...input)).toBeCloseTo(output, 0);
    });
  });
});
