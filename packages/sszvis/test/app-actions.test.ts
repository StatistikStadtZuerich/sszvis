import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app actions", () => {
  installResizeListenerIsolation();

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

  describe("an unknown action name", () => {
    test("is reported rather than thrown out of the effect that dispatched it", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({
        init: async () => (dispatch) => {
          dispatch("missing", []);
        },
        render,
      });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe(
        '[sszvis.app] Dispatch failed: Action "missing" is not defined, add it to "actions".',
      );
      // Reported as the dispatch it is, rather than wrapped as a failure of the effect that
      // happened to make it - the effect itself is fine, the action map is not.
      expect(reported.message).not.toContain("An effect failed");
    });

    test("is reported for a name inherited from Object.prototype", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app({
        init: async () => (dispatch) => {
          dispatch("toString", []);
        },
        render,
      });
      await nextFrame();

      const reported = error.mock.calls.at(0)?.[0] as Error;
      expect(reported.message).toBe(
        '[sszvis.app] Dispatch failed: Action "toString" is not defined, add it to "actions".',
      );
    });

    test("leaves the app rendering, with the state the last real action produced", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const render = vi.fn();
      app<{ count: number }>({
        init: async (state) => {
          state.count = 0;
        },
        actions: {
          bump: (state) => {
            state.count += 1;
          },
          typo: () => (dispatch) => {
            dispatch("bmup", []);
          },
        },
        render,
      });
      await nextFrame();
      expect(() => render.mock.calls[0][1].typo()).not.toThrow();
      await nextFrame();
      render.mock.lastCall?.[1].bump();
      await nextFrame();

      expect(error).toHaveBeenCalledTimes(1);
      expect(render.mock.lastCall?.[0]).toEqual({ count: 1 });
    });

    // NOTE: the typo the issue describes - `actions.selct(d)` in an interaction handler -
    // never reaches `dispatch` at all: the dispatchers are built from the keys of the actions
    // object, so an undeclared name is simply not a function and the caller's own code throws
    // a TypeError. That is why there is nothing for a configuration-time check to validate:
    // the only names dispatch sees as strings come from effects, which is the path above.
    test("has no dispatcher, so a handler typo fails in the caller\u2019s own code", async () => {
      const render = vi.fn();
      app({
        init: async () => {},
        render,
        actions: {
          select: () => {},
        },
      });
      await nextFrame();
      const actions = render.mock.calls[0][1];
      expect(actions.select).toBeTypeOf("function");
      expect(actions.selct).toBeUndefined();
    });
  });

  describe("dispatching from render", () => {
    test("renders the state the dispatch produced", async () => {
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
      expect(seen).toEqual([0, 1]);
    });

    test("terminates when render dispatches unconditionally", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const seen: number[] = [];
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
          actions.bump();
        },
      });
      for (let index = 0; index < 20; index++) await nextFrame();

      // The initial render plus the capped run of cascaded ones, and no more.
      expect(seen).toHaveLength(11);
      expect(warn.mock.calls.flat().join()).toContain(
        '[sszvis.app] Stopped after 10 renders scheduled from inside "render".',
      );
    });

    test("does not count a dispatch made outside render towards the cascade", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const render = vi.fn();
      app<{ count: number }>({
        init: async (state) => {
          state.count = 0;
        },
        actions: {
          bump: (state) => {
            state.count += 1;
          },
        },
        render,
      });
      await nextFrame();
      for (let index = 0; index < 15; index++) {
        render.mock.lastCall?.[1].bump();
        await nextFrame();
      }
      expect(render).toHaveBeenCalledTimes(16);
    });
  });
});
