import { describe, expect, test, vi } from "vitest";
import { app, type Effect } from "../src/app.js";
import { viewport } from "../src/viewport/resize.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app lifecycle", () => {
  const resize = installResizeListenerIsolation();

  describe("init", () => {
    test("should render the state init produced when init resolves", async () => {
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

    test("should hold the first render back until init resolves", async () => {
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

    test("should render the state init produced when init is synchronous", async () => {
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

    test.for<{ kind: string; init: (state: { count: number }) => Effect | Promise<Effect> }>([
      {
        kind: "synchronous",
        init: (state) => {
          state.count = 0;
          return (dispatch) => {
            dispatch("increment", []);
          };
        },
      },
      {
        kind: "asynchronous",
        init: async (state) => {
          state.count = 0;
          return (dispatch) => {
            dispatch("increment", []);
          };
        },
      },
    ])("should apply the effect's dispatch when a $kind init returns one", async ({ init }) => {
      const render = vi.fn();
      app<{ count: number }>({
        init,
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

    test("should report an init failure when init throws synchronously", async () => {
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
  });

  describe("resize", () => {
    test("should re-render when the viewport reports a resize", async () => {
      const render = vi.fn();
      app({ init: async () => {}, render });
      await nextFrame();
      viewport.trigger("resize");
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(2);
    });
  });

  describe("teardown", () => {
    test("should stop re-rendering on resize when the app has been destroyed", async () => {
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

    test("should never render when destroyed before its queued frame runs", async () => {
      const render = vi.fn();
      const handle = app({ init: async () => {}, render });
      handle.destroy();
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
    });

    test("should register no resize listener when destroyed before init resolves", async () => {
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

    test("should render no fallback but still report the failure when destroyed before a failing init settles", async () => {
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

    test("should not throw when destroy is called a second time", async () => {
      const handle = app({ init: async () => {}, render: () => {} });
      await nextFrame();
      handle.destroy();
      expect(() => handle.destroy()).not.toThrow();
    });
  });
});
