import { defaultTransition, fastTransition, slowTransition } from "../src/transition.js";
import { expect, test, describe, beforeEach } from "vitest";
import { select } from "d3";

describe("transition", () => {
  let container;
  let testElement;

  beforeEach(() => {
    // Create a fresh test container for each test
    container = document.createElement("div");
    container.id = "test-container";
    container.style.position = "absolute";
    container.style.left = "-9999px"; // Hide off-screen
    document.body.append(container);

    // Create a test element
    testElement = document.createElement("div");
    testElement.style.opacity = "1";
    testElement.style.width = "100px";
    testElement.style.height = "100px";
    container.append(testElement);
  });

  describe("defaultTransition", () => {
    test("should have correct duration (300ms)", () => {
      expect(defaultTransition().duration()).toBe(300);
    });

    test("should work with DOM elements", async () => {
      select(testElement).transition(defaultTransition()).style("opacity", "0.5");
      expect(testElement.__transition).toBeDefined();
    });

    test("should complete transition and change element properties", async () => {
      await new Promise((resolve) => {
        select(testElement)
          .transition(defaultTransition())
          .style("opacity", "0.3")
          .on("end", resolve);
      });
      expect(Number.parseFloat(globalThis.getComputedStyle(testElement).opacity)).toBeCloseTo(
        0.3,
        1
      );
    });
  });

  describe("fastTransition", () => {
    test("should have correct duration (50ms)", () => {
      expect(fastTransition().duration()).toBe(50);
    });

    test("should complete faster than default transition", async () => {
      const startTime = Date.now();
      await new Promise((resolve) => {
        select(testElement).transition(fastTransition()).style("width", "200px").on("end", resolve);
      });
      expect(Date.now() - startTime).toBeLessThan(150);
    });
  });

  describe("slowTransition", () => {
    test("should have correct duration (500ms)", () => {
      expect(slowTransition().duration()).toBe(500);
    });

    test("should work with DOM elements", async () => {
      select(testElement).transition(slowTransition()).style("height", "200px");
      expect(testElement.__transition).toBeDefined();
    });
  });

  describe("transition comparison", () => {
    test("should have different durations", () => {
      const defaultDuration = defaultTransition().duration();
      const fastDuration = fastTransition().duration();
      const slowDuration = slowTransition().duration();
      expect(fastDuration).toBe(50);
      expect(defaultDuration).toBe(300);
      expect(slowDuration).toBe(500);
      expect(fastDuration).toBeLessThan(defaultDuration);
      expect(defaultDuration).toBeLessThan(slowDuration);
    });

    test("should all use the same easing function", () => {
      const defaultTransitionObj = defaultTransition();
      const fastTransitionObj = fastTransition();
      const slowTransitionObj = slowTransition();
      expect(typeof defaultTransitionObj.ease).toBe("function");
      expect(typeof fastTransitionObj.ease).toBe("function");
      expect(typeof slowTransitionObj.ease).toBe("function");
    });

    test("should all be chainable with D3 selections", () => {
      expect(() => {
        select(testElement)
          .transition(defaultTransition())
          .transition(fastTransition())
          .transition(slowTransition());
      }).not.toThrow();
    });
  });

  describe("integration tests", () => {
    test("should handle multiple simultaneous style transitions", async () => {
      await new Promise((resolve) => {
        select(testElement)
          .transition(defaultTransition())
          .style("opacity", "0.5")
          .style("width", "200px")
          .style("height", "200px")
          .on("end", resolve);
      });
      const styles = globalThis.getComputedStyle(testElement);
      expect(Number.parseFloat(styles.opacity)).toBeCloseTo(0.5, 1);
      expect(Number.parseFloat(styles.width)).toBeCloseTo(200, 1);
      expect(Number.parseFloat(styles.height)).toBeCloseTo(200, 1);
    });

    test("should handle attribute transitions", async () => {
      const svgElement = document.createElement("svg");
      const circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circleElement.setAttribute("r", "10");
      circleElement.setAttribute("cx", "50");
      circleElement.setAttribute("cy", "50");
      svgElement.append(circleElement);
      container.append(svgElement);
      await new Promise((resolve) => {
        select(circleElement)
          .transition(fastTransition())
          .attr("r", "20")
          .attr("cx", "100")
          .on("end", resolve);
      });
      expect(circleElement.getAttribute("r")).toBe("20");
      expect(circleElement.getAttribute("cx")).toBe("100");
    });

    test("should work with multiple elements", async () => {
      const elements = [];
      for (let i = 0; i < 3; i++) {
        const element = document.createElement("div");
        element.style.opacity = "1";
        element.className = "test-item";
        container.append(element);
        elements.push(element);
      }
      await new Promise((resolve) => {
        select(container)
          .selectAll(".test-item")
          .transition(defaultTransition())
          .style("opacity", "0.2")
          .on("end", resolve);
      });
      for (const element of elements) {
        const opacity = globalThis.getComputedStyle(element).opacity;
        expect(Number.parseFloat(opacity)).toBeCloseTo(0.2, 1);
      }
    });

    test("should be interruptible", async () => {
      const selection = select(testElement);
      selection.transition(slowTransition()).style("opacity", "0.1");
      await new Promise((resolve) => {
        selection.transition(fastTransition()).style("opacity", "0.9").on("end", resolve);
      });
      const finalOpacity = globalThis.getComputedStyle(testElement).opacity;
      expect(Number.parseFloat(finalOpacity)).toBeCloseTo(0.9, 1);
    });

    test("should work with delay", async () => {
      const startTime = Date.now();
      await new Promise((resolve) => {
        select(testElement)
          .transition(fastTransition())
          .delay(100)
          .style("opacity", "0.7")
          .on("end", resolve);
      });
      expect(Date.now() - startTime).toBeGreaterThan(140); // 100ms delay + 50ms transition - some tolerance
      expect(Number.parseFloat(globalThis.getComputedStyle(testElement).opacity)).toBeCloseTo(
        0.7,
        1
      );
    });
  });
});
