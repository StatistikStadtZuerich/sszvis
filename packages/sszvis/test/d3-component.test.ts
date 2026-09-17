import { select } from "d3";
import { describe, expect, test, vi } from "vitest";
import { component } from "../src/d3-component.js";

describe("d3-component", () => {
  describe("prop", () => {
    test("should return the component from a setter and the value from a getter, so calls chain", () => {
      const comp = component().prop("size");
      expect(comp.size(100)).toBe(comp);
      expect(comp.size()).toBe(100);
    });

    test("should store what the custom setter returns when a prop declares one", () => {
      const comp = component().prop("scale", (value) => Math.max(0, value));
      comp.scale(-10);
      expect(comp.scale()).toBe(0);
      comp.scale(5);
      expect(comp.scale()).toBe(5);
    });

    test("should call a custom setter with the component as its this, so it can read siblings", () => {
      let contextCheck: unknown = null;
      const comp = component().prop("test", function (this: unknown, value) {
        contextCheck = this;
        return value;
      });
      comp.test("value");
      expect(contextCheck).toBe(comp);
    });

    test("should return the component from every configurator, so a whole setup chains", () => {
      const comp = component()
        .prop("width")
        .prop("height")
        .render(() => {});
      expect(comp.width(100)).toBe(comp);
      expect(comp.height(50)).toBe(comp);
      expect(comp.width(200).height(100)).toBe(comp);
    });
  });

  describe("render", () => {
    test("should call the render function when the component is applied to a selection", () => {
      const renderFn = vi.fn();
      select(document.createElement("div")).call(component().render(renderFn));
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    test("should call render with the node as its this, so d3 idioms like select(this) work", () => {
      let renderContext: unknown = null;
      const selection = select(document.createElement("div")).call(
        component().render(function (this: unknown) {
          renderContext = this;
        }),
      );
      expect(renderContext).toBe(selection.node());
    });

    test("should pass the bound datum to render when the selection carries data", () => {
      const testData = [{ value: 42 }];
      let receivedData: unknown = null;
      select(document.createElement("div"))
        .data(testData)
        .call(
          component().render((data: unknown) => {
            receivedData = data;
          }),
        );
      expect(receivedData).toEqual(testData[0]);
    });
  });

  describe("delegate", () => {
    test.each([
      ["a value, forwarding the argument and returning the component", ["input"], true],
      ["no value, forwarding nothing and returning the delegate's answer", [], false],
    ])(
      "should call through to the delegate when the prop is called with %s",
      (_label, args, isSetter) => {
        const delegate = { scale: vi.fn().mockReturnValue("delegated-value") };
        const comp = component().delegate("scale", delegate);

        const result = (comp.scale as (...a: unknown[]) => unknown)(...args);

        expect(delegate.scale).toHaveBeenCalledWith(...args);
        // A setter hands back the component so configuration chains; a getter hands back
        // whatever the delegate answered.
        expect(result).toBe(isSetter ? comp : "delegated-value");
      },
    );
  });

  describe("props on the node", () => {
    test("should stash the component's props on the node it rendered into", () => {
      // Recorded and asserted afterwards rather than inside the callback: assertions made
      // inside render pass silently if render is never invoked, which a mutation that
      // removed the selection.each call confirmed.
      let stashed: Record<string, unknown> | undefined;
      let ran = false;
      const comp = component()
        .prop("size")
        .render(function () {
          ran = true;
          stashed = this.__props__;
        })
        .size(42);

      select(document.createElement("div")).call(comp);

      expect(ran).toBe(true);
      expect(stashed).toBeDefined();
      expect(stashed?.size).toBe(42);
    });

    test("should let render read a prop off the node and write it into the DOM", () => {
      const comp = component()
        .prop("text")
        .render(function () {
          select(this).text(this.__props__.text as string);
        })
        .text("Hello World");

      const selection = select(document.createElement("div"));
      selection.call(comp);

      expect(selection.node()?.textContent).toBe("Hello World");
    });
  });
});
