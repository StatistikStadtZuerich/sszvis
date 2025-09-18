import { select } from "d3";
import { describe, expect, test, vi } from "vitest";
import { component } from "../src/d3-component";

describe("d3-component", () => {
  describe("prop method", () => {
    test("should set and get property values", () => {
      const comp = component().prop("size");
      expect(comp.size(100)).toBe(comp); // Should return component for chaining
      expect(comp.size()).toBe(100);
    });

    test("should support custom setters", () => {
      const comp = component().prop("scale", (value) => Math.max(0, value));
      comp.scale(-10);
      expect(comp.scale()).toBe(0); // Should be clamped by setter
      comp.scale(5);
      expect(comp.scale()).toBe(5);
    });

    test("should bind setter context to component", () => {
      let contextCheck = null;
      const comp = component().prop("test", function (this: any, value) {
        contextCheck = this;
        return value;
      });
      comp.test("value");
      expect(contextCheck).toBe(comp);
    });
  });

  describe("render method", () => {
    test("should call render function when component is applied", () => {
      const renderFn = vi.fn();
      select(document.createElement("div")).call(component().render(renderFn));
      expect(renderFn).toHaveBeenCalled();
    });

    test("should pass correct context to render function", () => {
      let renderContext = null;
      const renderFn = function (this: any) {
        renderContext = this;
      };
      const selection = select(document.createElement("div")).call(component().render(renderFn));
      expect(renderContext).toBe(selection.node());
    });

    test("should receive data in render function", () => {
      const testData = [{ value: 42 }];
      let receivedData = null;
      const renderFn = (data: any) => {
        receivedData = data;
      };
      select(document.createElement("div")).data(testData).call(component().render(renderFn));
      expect(receivedData).toEqual(testData[0]);
    });
  });

  describe("delegate method", () => {
    test("should delegate property to another object", () => {
      const delegate = {
        scale: vi.fn().mockReturnValue("delegated-value"),
      };
      const comp = component().delegate("scale", delegate);
      expect(comp.scale("input")).toBe(comp); // Should return component for chaining
      expect(delegate.scale).toHaveBeenCalledWith("input");
    });

    test("should handle getter delegation", () => {
      const delegate = {
        scale: vi.fn().mockReturnValue("scale-value"),
      };
      const result = component().delegate("scale", delegate).scale();
      expect(delegate.scale).toHaveBeenCalledWith();
      expect(result).toBe("scale-value");
    });
  });

  describe("method chaining", () => {
    test("should support method chaining", () => {
      const comp = component()
        .prop("width")
        .prop("height")
        .render(() => {});
      expect(comp.width(100)).toBe(comp);
      expect(comp.height(50)).toBe(comp);
      expect(comp.width(200).height(100)).toBe(comp);
    });
  });

  describe("props persistence", () => {
    test("should store props on DOM elements", () => {
      const comp = component()
        .prop("size")
        .render(function () {
          expect(this.__props__).toBeDefined();
          expect(this.__props__.size).toBe(42);
        });

      comp.size(42);
      const selection = select(document.createElement("div"));
      selection.call(comp);
    });
  });

  describe("integration tests", () => {
    test("should work with real DOM manipulation", () => {
      const comp = component()
        .prop("text")
        .render(function (_data) {
          const props = this.__props__;
          select(this).text(props.text);
        });

      comp.text("Hello World");

      const selection = select(document.createElement("div"));
      selection.call(comp);

      expect(selection?.node()?.textContent).toBe("Hello World");
    });
  });
});
