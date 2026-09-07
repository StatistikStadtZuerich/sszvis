import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { type ResizeListener, viewport } from "../src/viewport/resize.js";

const onResize = viewport.on;

/**
 * Waits for the next animation frame to have been painted, which is when the
 * app's render loop has run.
 */
const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

/**
 * Swallows - and records - the unhandled rejections that a failing `init` or a failing
 * effect produces (see the known quirks below).
 */
const captureUnhandledRejections = () => {
  const reasons: string[] = [];
  const handler = (event: PromiseRejectionEvent) => {
    reasons.push(String(event.reason));
    event.preventDefault();
  };
  globalThis.addEventListener("unhandledrejection", handler);
  return {
    reasons,
    restore: () => globalThis.removeEventListener("unhandledrejection", handler),
  };
};

/**
 * Every app whose `init` resolves registers a resize listener on the module-global
 * viewport, and `app` has no teardown of its own (see the known quirks below), so the
 * listeners would outlive the test that created them: a later resize would then also run
 * the renders of every earlier test. Recording what each test registers and unregistering
 * it here keeps the tests independent of their order.
 */
let registeredResizeListeners: ResizeListener[] = [];

beforeEach(() => {
  registeredResizeListeners = [];
  vi.spyOn(viewport, "on").mockImplementation(function (
    this: typeof viewport,
    name: string,
    cb: ResizeListener
  ) {
    if (name === "resize") registeredResizeListeners.push(cb);
    return onResize.call(this, "resize", cb);
  } as typeof viewport.on);
});

afterEach(() => {
  for (const cb of registeredResizeListeners) viewport.off("resize", cb);
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("app", () => {
  describe("configuration", () => {
    test("throws when no init function is provided", () => {
      expect(() => app({ render: () => {} } as never)).toThrow(
        '[sszvis.app] An "init" function returning a Promise must be provided.'
      );
    });

    test("throws when no render function is provided", () => {
      expect(() => app({ init: async () => {} } as never)).toThrow(
        '[sszvis.app] A "render" function must be provided.'
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

  describe("actions", () => {
    test("exposes an action dispatcher for every action", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
          reset: (state) => {
            state.count = 0;
          },
        },
      });
      await nextFrame();
      expect(Object.keys(render.mock.calls[0][1])).toEqual(["increment", "reset"]);
    });

    test("updates the state and re-renders when an action is dispatched", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      render.mock.calls[0][1].increment();
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(2);
      expect(render.mock.lastCall?.[0]).toEqual({ count: 1 });
    });

    test("passes the dispatcher arguments on to the action", async () => {
      const action = vi.fn();
      const render = vi.fn();
      app({ init: async () => {}, render, actions: { act: action } });
      await nextFrame();
      render.mock.calls[0][1].act("a", "b");
      expect(action.mock.lastCall?.slice(1)).toEqual(["a", "b"]);
    });

    test("calls the action with the actions object as `this`", async () => {
      const render = vi.fn();
      const receivers: unknown[] = [];
      const actions = {
        act(this: unknown) {
          receivers.push(this);
        },
      };
      app({ init: async () => {}, render, actions });
      await nextFrame();
      render.mock.calls[0][1].act();
      expect(receivers).toEqual([actions]);
    });

    test("runs an effect returned from an action, passing dispatch", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
        },
        render,
        actions: {
          start: () => (dispatch) => {
            dispatch("increment", []);
          },
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      render.mock.calls[0][1].start();
      await nextFrame();
      expect(render.mock.lastCall?.[0]).toEqual({ count: 1 });
    });

    test("batches several dispatches within one frame into a single render", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      const { increment } = render.mock.calls[0][1];
      increment();
      increment();
      increment();
      await nextFrame();
      expect(render).toHaveBeenCalledTimes(2);
      expect(render.mock.lastCall?.[0]).toEqual({ count: 3 });
    });

    test("state objects handed to render are not shared between renders", async () => {
      const render = vi.fn();
      app({
        init: async (state) => {
          state.count = 0;
        },
        render,
        actions: {
          increment: (state) => {
            state.count += 1;
          },
        },
      });
      await nextFrame();
      const first = render.mock.calls[0][0];
      render.mock.calls[0][1].increment();
      await nextFrame();
      expect(render.mock.lastCall?.[0]).not.toBe(first);
      expect(first).toEqual({ count: 0 });
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

  describe("a failing init", () => {
    test("renders the fallback image", async () => {
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

    test("does not escape as an unhandled rejection", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { reasons, restore } = captureUnhandledRejections();
      app({ init: () => Promise.reject(new Error("boom")), render: () => {} });
      await nextFrame();
      restore();
      expect(reasons).toEqual([]);
    });

    test("reports an error that keeps the original message and cause", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const cause = new Error("no data");
      app({ init: () => Promise.reject(cause), render: () => {} });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe("[sszvis.app] Initialisation failed: no data");
      expect(reported.cause).toBe(cause);
    });

    test("reports the failure even when no fallback is configured", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({ init: () => Promise.reject(new Error("boom")), render });
      await nextFrame();
      expect(render).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
    });
  });

  describe("a failing effect", () => {
    test("is reported as an effect failure, not an init failure", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      app({
        init: async () => (dispatch) => {
          dispatch("missing", []);
        },
        render: () => {},
      });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe(
        '[sszvis.app] An effect failed: [sszvis.app] Action "missing" is not defined, add it to "actions".'
      );
    });

    test("does not render the fallback, since the chart itself was built", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const container = document.createElement("div");
      container.id = "effect-fallback-target";
      document.body.append(container);

      const render = vi.fn();
      app({
        init: async () => (dispatch) => {
          dispatch("missing", []);
        },
        render,
        fallback: { element: "#effect-fallback-target", src: "fallback.png" },
      });
      await nextFrame();

      expect(container.querySelector("img")).toBeNull();
      expect(render).toHaveBeenCalledTimes(1);
    });

    test("takes the same path when the effect came from an action", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({
        init: async () => {},
        render,
        actions: {
          start: () => (dispatch) => {
            dispatch("missing", []);
          },
        },
      });
      await nextFrame();
      expect(() => render.mock.calls[0][1].start()).not.toThrow();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toContain("[sszvis.app] An effect failed:");
    });
  });

  describe("known quirks", () => {
    // BUG: the module calls immer's setAutoFreeze(false) at import time (src/app.ts:7),
    // so the finished state is never frozen and the immutability the module originally
    // promised does not hold. The mutation also persists: the next action drafts from the
    // same object (src/app.ts:153), so render can corrupt application state.
    // got:  a mutation inside render silently succeeds and survives into the next action
    // want: mutating the state passed to render throws
    test("state passed to render is mutable, despite the documented guarantee", async () => {
      let mutated: unknown;
      const done = new Promise<void>((resolve) => {
        app<{ count: number }>({
          init: async (state) => {
            state.count = 0;
          },
          render: (state) => {
            state.count = 99;
            mutated = state.count;
            resolve();
          },
        });
      });
      await done;
      expect(mutated).toBe(99);
    });

    // NOTE: app() returns undefined and never unregisters its resize listener, so
    // every app created on a page keeps re-rendering for the lifetime of the
    // document (src/app.ts:170). Each app installs its own scheduleUpdate closure, so
    // viewport's de-duplication by identity (src/viewport/resize.ts:106) does not help.
    test("keeps rendering after the app is no longer needed", async () => {
      const renderA = vi.fn();
      const renderB = vi.fn();
      app({ init: async () => {}, render: renderA });
      app({ init: async () => {}, render: renderB });
      await nextFrame();
      viewport.trigger("resize");
      await nextFrame();
      expect(renderA).toHaveBeenCalledTimes(2);
      expect(renderB).toHaveBeenCalledTimes(2);
    });

    // BUG: scheduleUpdate only clears renderScheduled after render returns (src/app.ts:144),
    // so the guard at src/app.ts:140 is still closed for a dispatch made from inside render.
    // The action runs and the state changes, but no frame is queued for it, and the stale
    // state stays on screen until an unrelated trigger - here a resize - flushes it.
    // got:  a dispatch from render updates the state invisibly
    // want: the state a render dispatches is rendered
    test("swallows the render for an action dispatched from inside render", async () => {
      const seen: number[] = [];
      let dispatched = false;
      app<{ count: number }>({
        init: async (state) => {
          state.count = 0;
        },
        actions: {
          bump: (state) => {
            state.count += 1;
          },
        },
        render: (state, actions) => {
          seen.push(state.count);
          if (!dispatched) {
            dispatched = true;
            actions.bump();
          }
        },
      });
      await nextFrame();
      await nextFrame();
      // The count is 1 by now, but only the render of 0 ever happened.
      expect(seen).toEqual([0]);

      viewport.trigger("resize");
      await nextFrame();
      expect(seen).toEqual([0, 1]);
    });

    // NOTE: the original JSDoc typed actions as `(s: Draft, p?: Props) => Effect | void`,
    // a single props argument, but the dispatcher collects all of its arguments into an
    // array and spreads them (src/app.ts:130-137, 159). Dispatching with no arguments is
    // what makes the documented `p` undefined; there is no props object.
    test("an action called without arguments receives only the draft", async () => {
      const action = vi.fn();
      const render = vi.fn();
      app({ init: async () => {}, render, actions: { act: action } });
      await nextFrame();
      render.mock.calls[0][1].act();
      expect(action.mock.lastCall).toHaveLength(1);
    });
  });
});
