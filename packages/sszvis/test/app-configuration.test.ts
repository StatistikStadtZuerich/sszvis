import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app configuration", () => {
  installResizeListenerIsolation();

  describe("configuration", () => {
    test("throws when no init function is provided", () => {
      expect(() => app({ render: () => {} } as never)).toThrow(
        '[sszvis.app] An "init" function must be provided.',
      );
    });

    test("throws when no render function is provided", () => {
      expect(() => app({ init: async () => {} } as never)).toThrow(
        '[sszvis.app] A "render" function must be provided.',
      );
    });

    test("works without any actions", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.value = 1;
        },
        render,
      });
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(1);
    });
  });
});
