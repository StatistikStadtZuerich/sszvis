import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { viewport } from "../src/viewport/resize.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app lifecycle", () => {
  const resize = installResizeListenerIsolation();

  describe("init", () => {
    test("renders the state produced by init", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.greeting = "hello";
        },
        render,
      });
      await nextFrame();
      expect(render.mock.calls[0][0]).toEqual({ greeting: "hello" });
    });

    test("does not render before init resolves", async () => {
      const render = vi.fn();
      let resolveInit: () => void = () => {};
      app({
        init: () =>
          new Promise<void>((resolve) => {
            resolveInit = resolve;
          }),
        render,
      });
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
      resolveInit();
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(1);
    });

    test("renders the state produced by a synchronous init", async () => {
      const render = vi.fn();
      app({
        init: (state) => {
          state.greeting = "hello";
        },
        render,
      });
      await nextFrame();
      expect(render.mock.calls[0][0]).toEqual({ greeting: "hello" });
    });

    test("runs an effect returned from a synchronous init", async () => {
      const render = vi.fn();
      app({
        init: (state) => {
          state.count = 0;
          return (dispatch) => {
            dispatch("increment", []);
          };
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      expect(render.mock.lastCall?.[0]).toEqual({ count: 1 });
    });

    test("reports an init that throws synchronously as an init failure", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      const cause = new Error("no data");
      app({
        init: () => {
          throw cause;
        },
        render,
      });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe("[sszvis.app] Initialisation failed: no data");
      expect(reported.cause).toBe(cause);
      expect(render).not.toHaveBeenCalled();
    });

    test("runs an effect returned from init", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
          return (dispatch) => {
            dispatch("increment", []);
          };
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      expect(render.mock.lastCall?.[0]).toEqual({ count: 1 });
    });
  });

  describe("resize", () => {
    test("re-renders when the viewport reports a resize", async () => {
      const render = vi.fn();
      app({ init: async () => {}, render });
      await nextFrame();
      viewport.trigger("resize");
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(2);
    });
  });

  describe("teardown", () => {
    test("stops rendering on resize once the app is destroyed", async () => {
      const renderA = vi.fn();
      const renderB = vi.fn();
      const a = app({ init: async () => {}, render: renderA });
      app({ init: async () => {}, render: renderB });
      await nextFrame();
      a.destroy();
      viewport.trigger("resize");
      await nextFrame();
      expect(renderA).toHaveBeenCalledTimes(1);
      expect(renderB).toHaveBeenCalledTimes(2);
    });

    test("stops a frame that was already queued", async () => {
      const render = vi.fn();
      const handle = app({ init: async () => {}, render });
      handle.destroy();
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
    });

    test("registers no resize listener when destroyed before init resolves", async () => {
      const render = vi.fn();
      let resolveInit: () => void = () => {};
      const handle = app({
        init: () =>
          new Promise<void>((resolve) => {
            resolveInit = resolve;
          }),
        render,
      });
      handle.destroy();
      resolveInit();
      await nextFrame();
      viewport.trigger("resize");
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
      expect(resize.registered()).toEqual([]);
    });

    test("renders no fallback when destroyed before a failing init settles", async () => {
      // A destroyed app renders nothing afterwards, the fallback included: by the time init
      // rejects the container may already belong to a replacement app. The failure is still
      // reported, since it happened regardless of who is holding the container now.
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const container = document.createElement("div");
      container.id = "destroyed-fallback-target";
      document.body.append(container);
      let rejectInit: (reason: Error) => void = () => {};
      const handle = app({
        init: () =>
          new Promise<void>((_resolve, reject) => {
            rejectInit = reject;
          }),
        render: () => {},
        fallback: { element: "#destroyed-fallback-target", src: "fallback.png" },
      });
      handle.destroy();
      rejectInit(new Error("boom"));
      await nextFrame();

      expect(container.querySelector("img")).toBeNull();
      expect(error).toHaveBeenCalled();
      error.mockRestore();
      container.remove();
    });

    test("releases the resize listener an init effect's destroy asked to release", async () => {
      // scheduleUpdate runs the init effect synchronously, so an effect that destroys the
      // app used to call viewport.off before the listener was installed - and the line
      // after it installed one nothing would ever remove. The listener is inert once the
      // app is destroyed, so what is asserted here is that off was handed the very
      // function on registered, rather than running against an empty registry.
      const off = vi.spyOn(viewport, "off");
      const handle: { current?: { destroy: () => void } } = {};
      handle.current = app({
        init: async () => () => handle.current?.destroy(),
        render: () => {},
      });
      await nextFrame();
      expect(resize.registered()).toHaveLength(1);
      expect(off).toHaveBeenCalledWith("resize", resize.registered()[0]);
      // The order is the fix: register, then run the effect, so the effect's destroy has a
      // listener to release. Registering afterwards leaves one attached for good.
      const on = viewport.on as unknown as { mock: { invocationCallOrder: number[] } };
      expect(on.mock.invocationCallOrder[0]).toBeLessThan(
        off.mock.invocationCallOrder[0] as number,
      );
    });

    test("can be destroyed more than once", async () => {
      const handle = app({ init: async () => {}, render: () => {} });
      await nextFrame();
      handle.destroy();
      expect(() => handle.destroy()).not.toThrow();
    });
  });
});
