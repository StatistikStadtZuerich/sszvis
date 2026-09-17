import { describe, expect, test, vi } from "vitest";
import { app } from "../src/app.js";
import { installResizeListenerIsolation, nextFrame } from "./support/appHarness.js";

describe("app render", () => {
  installResizeListenerIsolation();

  describe("state in render", () => {
    test("should throw a TypeError when render assigns to the state it was given", async () => {
      let thrown: unknown;
      const done = new Promise<void>((resolve) => {
        app<{ count: number }>({
          init: async (state) => {
            state.count = 0;
          },
          render: (state) => {
            try {
              state.count = 99;
            } catch (error) {
              thrown = error;
            }
            resolve();
          },
        });
      });
      await done;
      expect(thrown).toBeInstanceOf(TypeError);
    });

    test("should keep the next action's draft unchanged when render attempted a mutation", async () => {
      const seen: number[] = [];
      const render = vi.fn((state: { count: number }, _actions: { bump: () => void }) => {
        seen.push(state.count);
        try {
          state.count = 99;
        } catch {
          // The assignment is the point; swallowing keeps this render function usable.
        }
      });
      app<{ count: number }>({
        init: async (state) => {
          state.count = 0;
        },
        actions: {
          bump: (state) => {
            state.count += 1;
          },
        },
        render: render as never,
      });
      await nextFrame();
      render.mock.calls[0][1].bump();
      await nextFrame();
      expect(seen).toEqual([0, 1]);
    });

    test("should allow the write when render mutates data hanging off the state, as d3 requires", async () => {
      let mutated: unknown;
      const done = new Promise<void>((resolve) => {
        app<{ data: { value: number }[] }>({
          init: async (state) => {
            state.data = [{ value: 1 }];
          },
          render: (state) => {
            state.data[0].value = 2;
            mutated = state.data[0].value;
            resolve();
          },
        });
      });
      await done;
      expect(mutated).toBe(2);
    });
  });

  describe("known quirks", () => {
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
