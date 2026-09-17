import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app actions", () => {
  installResizeListenerIsolation();

  describe("actions", () => {
    test("should expose a dispatcher for every action when the app first renders", async () => {
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

    test("should update the state and re-render when an action is dispatched", async () => {
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

    test("should pass the arguments on to the action when a dispatcher is called with them", async () => {
      const action = vi.fn();
      const render = vi.fn();
      app({ init: async () => {}, render, actions: { act: action } });
      await nextFrame();
      render.mock.calls[0][1].act("a", "b");
      expect(action.mock.lastCall?.slice(1)).toEqual(["a", "b"]);
    });

    test("should bind `this` to the actions object when an action runs", async () => {
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

    test("should apply the effect's dispatch when an action returns an effect", async () => {
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

    test("should render once when several dispatches land within one frame", async () => {
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

    test("should hand render a fresh state object when a render follows an action", async () => {
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
    test("should be reported as a dispatch failure, not thrown, when an effect dispatches it", async () => {
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

    test("should be reported as a dispatch failure when the name is inherited from Object.prototype", async () => {
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

    test("should leave the app rendering later actions when an effect dispatched it", async () => {
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
    test("should render the produced state when render dispatches an action once", async () => {
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

    test("should stop after ten cascaded renders and warn when render dispatches unconditionally", async () => {
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

    test("should keep re-rendering past the cascade cap when the dispatches are made outside render", async () => {
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
