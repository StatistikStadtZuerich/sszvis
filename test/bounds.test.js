import { expect, test, describe } from "vitest";
import { bounds } from "../src/bounds.js";

describe("bounds", () => {
  describe("default", () => {
    test("should create bounds with default values", () => {
      const result = bounds();
      expect(result).toHaveProperty("width");
      expect(result).toHaveProperty("height");
      expect(result).toHaveProperty("innerWidth");
      expect(result).toHaveProperty("innerHeight");
      expect(result).toHaveProperty("padding");
      expect(result.width).toBe(516); // DEFAULT_WIDTH
      expect(result.padding.top).toBe(0);
      expect(result.padding.bottom).toBe(0);
      expect(result.padding.left).toBe(1);
      expect(result.padding.right).toBe(1);
    });

    test("should calculate inner dimensions correctly", () => {
      const result = bounds();
      expect(result.innerWidth).toBe(result.width - result.padding.left - result.padding.right);
      expect(result.innerHeight).toBeGreaterThan(0);
    });
  });

  describe("custom", () => {
    test("should accept custom width and height", () => {
      const result = bounds({
        width: 800,
        height: 600,
      });
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.innerWidth).toBe(798); // 800 - 1 - 1
    });

    test("should accept custom padding", () => {
      const result = bounds({
        width: 400,
        height: 300,
        top: 20,
        right: 30,
        bottom: 40,
        left: 50,
      });
      expect(result.padding.top).toBe(20);
      expect(result.padding.right).toBe(30);
      expect(result.padding.bottom).toBe(40);
      expect(result.padding.left).toBe(50);
      expect(result.innerWidth).toBe(320); // 400 - 50 - 30
      expect(result.innerHeight).toBe(240); // 300 - 20 - 40
    });

    test("should handle partial padding specification", () => {
      const result = bounds({
        top: 10,
        left: 20,
      });
      expect(result.padding.top).toBe(10);
      expect(result.padding.left).toBe(20);
      expect(result.padding.bottom).toBe(0); // default
      expect(result.padding.right).toBe(1); // default
    });
  });

  describe("DOM element measurement", () => {
    test("should measure DOM element for width", () => {
      const div = document.createElement("div");
      div.getBoundingClientRect = () => ({ width: 500 });
      document.body.append(div);
      const result = bounds({}, div);
      expect(result.width).toBe(500);
    });

    test("should use CSS selector to find element", () => {
      const div = document.createElement("div");
      div.id = "test-element";
      div.getBoundingClientRect = () => ({ width: 300 });
      document.body.append(div);
      const result = bounds({}, "#test-element");
      expect(result.width).toBe(300);
    });

    test("should prefer custom width over measured width", () => {
      const div = document.createElement("div");
      div.getBoundingClientRect = () => ({ width: 500 });
      document.body.append(div);
      const result = bounds({ width: 800 }, div);
      expect(result.width).toBe(800); // Custom width takes priority
    });
  });

  describe("selector handling", () => {
    test("should handle ID selector", () => {
      const div = document.createElement("div");
      div.getBoundingClientRect = () => ({ width: 400 });
      div.id = "test-div";
      document.body.append(div);
      const result = bounds("#test-div");
      expect(result.width).toBe(400);
    });

    test("should handle CSS selector", () => {
      const div = document.createElement("div");
      div.className = "test-class";
      div.getBoundingClientRect = () => ({ width: 350 });
      document.body.append(div);
      const result = bounds(".test-class");
      expect(result.width).toBe(350);
    });
  });
});
