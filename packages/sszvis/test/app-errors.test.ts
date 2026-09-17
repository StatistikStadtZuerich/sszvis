import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import {
  captureUnhandledRejections,
  installResizeListenerIsolation,
  nextFrame,
} from "./support/appHarness.js";

describe("app errors", () => {
  installResizeListenerIsolation();

  describe("a failing init", () => {
    test("should render the fallback image instead of the chart when init rejects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const container = document.createElement("div");
      container.id = "fallback-target";
      document.body.append(container);
      const render = vi.fn();

      app({
        init: () => Promise.reject(new Error("boom")),
        render,
        fallback: { element: "#fallback-target", src: "fallback.png" },
      });
      await nextFrame();

      const image = container.querySelector("img");
      expect(image?.getAttribute("class")).toBe("sszvis-fallback-image");
      expect(image?.getAttribute("src")).toBe("fallback.png");
      expect(render).not.toHaveBeenCalled();
    });

    test("should not escape as an unhandled rejection when init rejects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { reasons, restore } = captureUnhandledRejections();
      app({ init: () => Promise.reject(new Error("boom")), render: () => {} });
      await nextFrame();
      restore();
      expect(reasons).toEqual([]);
    });

    test("should report an error keeping the original message and cause when init rejects", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const cause = new Error("no data");
      app({ init: () => Promise.reject(cause), render: () => {} });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe("[sszvis.app] Initialisation failed: no data");
      expect(reported.cause).toBe(cause);
    });

    test("should report the failure and skip render when no fallback is configured", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({ init: () => Promise.reject(new Error("boom")), render });
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
    });
  });

  describe("a failing effect", () => {
    test("should be reported as an effect failure, not an init failure, when an init effect throws", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      app({
        init: async () => () => {
          throw new Error("boom");
        },
        render: () => {},
      });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe("[sszvis.app] An effect failed: boom");
    });

    test("should keep the chart rendered and show no fallback when an init effect throws", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const container = document.createElement("div");
      container.id = "effect-fallback-target";
      document.body.append(container);

      const render = vi.fn();
      app({
        init: async () => () => {
          throw new Error("boom");
        },
        render,
        fallback: { element: "#effect-fallback-target", src: "fallback.png" },
      });
      await nextFrame();

      expect(container.querySelector("img")).toBeNull();
      expect(render).toHaveBeenCalledTimes(1);
    });

    test("should be reported as an effect failure without throwing when the effect came from an action", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({
        init: async () => {},
        render,
        actions: {
          start: () => () => {
            throw new Error("boom");
          },
        },
      });
      await nextFrame();
      expect(() => render.mock.calls[0][1].start()).not.toThrow();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe("[sszvis.app] An effect failed: boom");
    });
  });
});
