import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { viewport } from "../../src/viewport/resize.js";

/** Every listener registered through `listen` is removed again after the test. */
type Listener = (...args: unknown[]) => void;

describe("viewport/resize", () => {
  // NOTE: the module keeps one callback registry and one throttle in module scope, so
  // there is no way to obtain a fresh instance - `vi.resetModules()` does not re-execute
  // an already-evaluated module in browser mode. Every test therefore shares the same
  // registry and has to clean up after itself, and the clock is moved past the throttle
  // window so that one test's window resize cannot swallow the next test's.
  const registered: [string, Listener][] = [];

  // The fake clock has to advance monotonically across tests: the throttle records the
  // end of its window as an absolute timestamp, so rewinding the clock to "now" in the
  // next test would leave that test inside the previous test's throttle window.
  let clock = Date.now();

  const listen = (name: string, cb: Listener) => {
    registered.push([name, cb]);
    return viewport.on(name, cb);
  };

  beforeEach(() => {
    clock += 10_000;
    vi.useFakeTimers();
    vi.setSystemTime(clock);
  });

  afterEach(() => {
    for (const [name, cb] of registered.splice(0)) viewport.off(name, cb);
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("should expose the on, off and trigger functions", () => {
    expect(typeof viewport.on).toBe("function");
    expect(typeof viewport.off).toBe("function");
    expect(typeof viewport.trigger).toBe("function");
  });

  test("should call a registered listener when the event is triggered", () => {
    const cb = vi.fn();
    listen("resize", cb);
    viewport.trigger("resize");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("should call listeners in registration order", () => {
    const calls: string[] = [];
    listen("resize", () => calls.push("first"));
    listen("resize", () => calls.push("second"));
    viewport.trigger("resize");
    expect(calls).toEqual(["first", "second"]);
  });

  test("should return the viewport object from on, off and trigger so calls chain", () => {
    const cb = vi.fn();
    expect(viewport.on("resize", cb)).toBe(viewport);
    expect(viewport.trigger("resize")).toBe(viewport);
    expect(viewport.off("resize", cb)).toBe(viewport);
  });

  test("should stop calling a listener once it has been removed", () => {
    const cb = vi.fn();
    listen("resize", cb);
    viewport.off("resize", cb);
    viewport.trigger("resize");
    expect(cb).not.toHaveBeenCalled();
  });

  test("should leave other listeners in place when one is removed", () => {
    const removed = vi.fn();
    const kept = vi.fn();
    listen("resize", removed);
    listen("resize", kept);
    viewport.off("resize", removed);
    viewport.trigger("resize");
    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
  });

  test("should ignore an off for an event that was never registered", () => {
    expect(() => viewport.off("never-registered", vi.fn())).not.toThrow();
  });

  test("should ignore a trigger for an event that has no listeners", () => {
    expect(() => viewport.trigger("never-registered")).not.toThrow();
  });

  describe("window resize", () => {
    test("should call resize listeners when the window fires a resize event", () => {
      const cb = vi.fn();
      listen("resize", cb);
      globalThis.dispatchEvent(new Event("resize"));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    test("should call resize listeners with no arguments", () => {
      const cb = vi.fn();
      listen("resize", cb);
      globalThis.dispatchEvent(new Event("resize"));
      expect(cb).toHaveBeenCalledWith();
    });

    test("should throttle a burst of resize events into a single leading call", () => {
      const cb = vi.fn();
      listen("resize", cb);
      for (let index = 0; index < 5; index++) globalThis.dispatchEvent(new Event("resize"));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    test("should call listeners again on the trailing edge of the throttle window", () => {
      const cb = vi.fn();
      listen("resize", cb);
      globalThis.dispatchEvent(new Event("resize"));
      globalThis.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    test("should not fire a trailing call when only one resize event arrived", () => {
      const cb = vi.fn();
      listen("resize", cb);
      globalThis.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("listener isolation", () => {
    test("should keep calling the remaining listeners when one throws", () => {
      const later = vi.fn();
      listen("resize", () => {
        throw new Error("boom");
      });
      listen("resize", later);
      expect(() => viewport.trigger("resize")).not.toThrow();
      expect(later).toHaveBeenCalledTimes(1);
    });

    test("should report a failing listener rather than swallow it", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const boom = new Error("boom");
      listen("resize", () => {
        throw boom;
      });
      viewport.trigger("resize");
      expect(error).toHaveBeenCalledWith(boom);
      expect(error.mock.calls.flat().join()).toContain(
        '[sszvis.viewport] A "resize" listener threw'
      );
    });

    test("should keep throttling window resizes when a listener throws", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      let calls = 0;
      listen("resize", () => {
        calls++;
        throw new Error("boom");
      });
      for (let index = 0; index < 3; index++) globalThis.dispatchEvent(new Event("resize"));
      expect(calls).toBe(1);
      expect(error).toHaveBeenCalled();
    });
  });

  describe("known quirks", () => {
    test("registering the same listener twice only calls it once", () => {
      // NOTE: `on` filters the existing list for the incoming callback before appending
      // it, so a callback can never be registered twice. The filter reads as intentional
      // protection against double registration, but it also means a single `off` undoes
      // any number of `on` calls.
      const cb = vi.fn();
      listen("resize", cb);
      listen("resize", cb);
      viewport.trigger("resize");
      expect(cb).toHaveBeenCalledTimes(1);
    });

    test("re-registering a listener moves it to the end of the call order", () => {
      // NOTE: the de-duplication in `on` drops the earlier entry and appends the new one,
      // so re-registering an existing callback silently reorders the listeners. Call
      // order is not part of the documented contract, so this is surprising rather than
      // wrong, but a repeated `on` is a no-op for every other observable purpose.
      const calls: string[] = [];
      const first = () => calls.push("first");
      const second = () => calls.push("second");
      listen("resize", first);
      listen("resize", second);
      listen("resize", first);
      viewport.trigger("resize");
      expect(calls).toEqual(["second", "first"]);
    });

    test("accepts any event name even though only resize is ever fired", () => {
      // NOTE: `on` creates a bucket for whatever name it is given, so the component is a
      // general-purpose emitter in practice even though the documented API describes
      // "resize" as the only supported event. No other name is ever fired by the module
      // itself, so it is a private channel the caller has to trigger by hand.
      const cb = vi.fn();
      listen("orientationchange", cb);
      viewport.trigger("orientationchange");
      expect(cb).toHaveBeenCalledTimes(1);
    });

    test("trigger forwards its extra arguments to the listeners", () => {
      // NOTE: `trigger` passes everything after the event name on to the listeners. The
      // documented API mentions no arguments and the window resize handler sends none, so
      // this only matters for callers who trigger their own events.
      const cb = vi.fn();
      listen("resize", cb);
      viewport.trigger("resize", 1, "two");
      expect(cb).toHaveBeenCalledWith(1, "two");
    });

    test("listeners outlive the chart that registered them", () => {
      // NOTE: there is one registry for the whole page, it is never cleared, and removal
      // is by function identity. A chart that is torn down keeps receiving resize events
      // unless it calls `off` with the exact same reference, and an inline arrow function
      // can never be removed at all.
      const cb = vi.fn();
      listen("resize", () => cb());
      viewport.off(
        "resize",
        () => cb() // a different function object with the same body
      );
      viewport.trigger("resize");
      viewport.trigger("resize");
      expect(cb).toHaveBeenCalledTimes(2);
    });

    test("registering a non-function listener fails on the next trigger", () => {
      // BUG: `on` appends whatever it is given without checking that it is callable, so a
      // typo such as `viewport.on("resize", myChart.render())` corrupts the registry and
      // the failure only surfaces on the next resize, far away from its cause. Error
      // isolation now keeps it from taking the other listeners down with it, but the
      // registration itself is still accepted.
      // current: a reported TypeError on the next trigger. expected: reject it in `on`.
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const later = vi.fn();
      // @ts-expect-error - the test helper's own `Listener` signature rejects this; the
      // module accepts it at runtime, which is the half of the fix that types cannot do.
      listen("resize", undefined);
      listen("resize", later);
      expect(() => viewport.trigger("resize")).not.toThrow();
      expect(error.mock.calls.flat().join()).toContain("TypeError");
      expect(later).toHaveBeenCalledTimes(1);
    });

    test("the chainable functions only work when called as methods", () => {
      // NOTE: `on`, `off` and `trigger` return `this` rather than the viewport object, so
      // they chain when called as methods but return `undefined` once destructured off
      // the module. The registration itself still works; only the return value is lost.
      const { on } = viewport;
      const cb = vi.fn();
      registered.push(["resize", cb]);
      // @ts-expect-error - the ported types spell the requirement out: `on` declares a
      // `this` of the viewport object, so a destructured call is rejected at compile time.
      expect(on("resize", cb)).toBeUndefined();
      viewport.trigger("resize");
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
