/**
 * The sweep's failure handling, which a real Chromium will not exercise on
 * demand.
 *
 * Two invariants. A rejecting playwright call must stay a typed failure: as a
 * defect it escapes `Effect.catch`, and inside `Effect.forEach({ concurrency })`
 * that interrupts the sibling fibers and abandons the sweep instead of
 * recording one `load-failed`. And `BrowserError` must carry the underlying
 * message, or the reason a load failed is lost.
 */
// This suite stands in for Playwright, whose API is Promise-based: the fakes
// must be `async` and the hang stubs must be Promises that never settle, or
// they would not exercise the code under test.
// @effect-diagnostics asyncFunction:off
// @effect-diagnostics newPromise:off
import { Effect, Exit, Fiber } from "effect";
import { TestClock } from "effect/testing";
import { describe, expect, it } from "vitest";
import {
  Browser,
  type BrowserLike,
  type ContextLike,
  type PageLike,
} from "../src/services/Browser.ts";

/** Records what the service did to the browser, so leaks are visible. */
interface Trace {
  readonly closedContexts: Array<string>;
  readonly closedBrowsers: Array<string>;
}

const fakeBrowser = (
  trace: Trace,
  page: Partial<PageLike>,
  faults: { newContext?: boolean; newPage?: boolean; closeContext?: boolean } = {},
): BrowserLike => ({
  newContext: async () => {
    if (faults.newContext === true) throw new Error("browser has been closed");
    const context: ContextLike = {
      newPage: async () => {
        if (faults.newPage === true) throw new Error("target page has been closed");
        return {
          goto: async () => null,
          evaluate: async () => null,
          screenshot: async () => new Uint8Array([1]),
          ...page,
        } as PageLike;
      },
      close: async () => {
        if (faults.closeContext === true) throw new Error("context close failed");
        trace.closedContexts.push("closed");
      },
    };
    return context;
  },
  close: async () => {
    trace.closedBrowsers.push("closed");
  },
});

const emptyTrace = (): Trace => ({ closedContexts: [], closedBrowsers: [] });

/** Run one load against a fake browser, with the layer's scope opened and closed. */
const load = (browser: BrowserLike, options?: { readonly shot?: boolean }) =>
  Effect.gen(function* () {
    const service = yield* Browser;
    return yield* service.load({
      url: "http://localhost/chart/x.html?side=candidate",
      width: 400,
      settle: 0,
      shot: options?.shot ?? false,
    });
  }).pipe(Effect.provide(Browser.layerWith(async () => browser)));

describe("Browser.load", () => {
  it("returns the page's reporter payload on a successful load", async () => {
    const trace = emptyTrace();
    const result = await Effect.runPromise(
      load(fakeBrowser(trace, { evaluate: async () => ({ svgCount: 1 }) as never })),
    );
    expect(result.snapshot).toEqual({ svgCount: 1 });
    expect(result.fatal).toBeUndefined();
  });

  it.each([
    ["goto", { goto: async () => Promise.reject(new Error("net::ERR_CONNECTION_REFUSED")) }],
    ["evaluate", { evaluate: async () => Promise.reject(new Error("Target page closed")) }],
  ] as const)("recovers a rejected %s into a diagnostic PageLoad", async (_name, page) => {
    const trace = emptyTrace();
    const exit = await Effect.runPromiseExit(load(fakeBrowser(trace, page as Partial<PageLike>)));
    // A rejection is a value, not a defect that escapes.
    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.snapshot).toBeUndefined();
      expect(exit.value.fatal).toBeDefined();
    }
  });

  it("recovers a rejected screenshot, which only runs under --shots", async () => {
    const trace = emptyTrace();
    const exit = await Effect.runPromiseExit(
      load(fakeBrowser(trace, { screenshot: async () => Promise.reject(new Error("timeout")) }), {
        shot: true,
      }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it.each([["newContext"], ["newPage"]] as const)(
    "recovers a rejected %s into a diagnostic PageLoad",
    async (fault) => {
      const trace = emptyTrace();
      const exit = await Effect.runPromiseExit(load(fakeBrowser(trace, {}, { [fault]: true })));
      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) expect(exit.value.fatal).toBeDefined();
    },
  );

  it("carries the underlying reason, not just the error's tag", async () => {
    const trace = emptyTrace();
    const result = await Effect.runPromise(
      load(
        fakeBrowser(trace, {
          goto: async () =>
            Promise.reject(new Error("net::ERR_UNSAFE_PORT at http://localhost:9/")),
        }),
      ),
    );
    // Without the `message` override this is the bare string "BrowserError".
    expect(result.fatal).toContain("net::ERR_UNSAFE_PORT");
  });

  it("closes the page context even when the load failed", async () => {
    const trace = emptyTrace();
    await Effect.runPromise(
      load(fakeBrowser(trace, { evaluate: async () => Promise.reject(new Error("boom")) })),
    );
    expect(trace.closedContexts).toHaveLength(1);
  });

  it("survives a context whose own close rejects", async () => {
    const trace = emptyTrace();
    const exit = await Effect.runPromiseExit(load(fakeBrowser(trace, {}, { closeContext: true })));
    // `Effect.ignore` drops a typed failure but not a defect, so a close outside
    // `attempt` would fail an otherwise fine load at teardown.
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it("does not let one failing load fail its siblings", async () => {
    const trace = emptyTrace();
    const browser = fakeBrowser(trace, {});
    const flaky: BrowserLike = {
      ...browser,
      newContext: async (options) => {
        if (options.viewport.width === 560) throw new Error("target crashed");
        return browser.newContext(options);
      },
    };
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* Browser;
        return yield* Effect.forEach(
          [400, 560, 900],
          (width) => service.load({ url: "http://localhost/x", width, settle: 0, shot: false }),
          { concurrency: 3 },
        );
      }).pipe(Effect.provide(Browser.layerWith(async () => flaky))),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.map((r) => r.fatal === undefined)).toEqual([true, false, true]);
    }
  });
});

describe("Browser.load timeouts", () => {
  /**
   * Neither `evaluate` nor `screenshot` takes a timeout of its own, so each
   * needs its own case: a hung call holds a concurrency slot until the bound
   * fires. `screenshot` only runs under `--shots`, so it is easy to miss.
   */
  const hangs = [
    { call: "evaluate", page: { evaluate: () => new Promise<never>(() => {}) }, shot: false },
    {
      call: "screenshot",
      page: { screenshot: () => new Promise<never>(() => {}) },
      shot: true,
    },
  ] as const;

  it.each(hangs)(
    "gives up on a page whose $call never settles, and releases its context",
    async ({ page, shot }) => {
      const trace = emptyTrace();
      await Effect.runPromise(
        Effect.gen(function* () {
          const fiber = yield* Effect.forkChild(load(fakeBrowser(trace, page), { shot }));
          // Virtual time, so the 30s bound is asserted without waiting for it.
          yield* TestClock.adjust("31 seconds");
          // Through the release, not by joining the fiber: with no timeout the
          // hung page never settles, so a join would hang this test rather than
          // fail it.
          expect(trace.closedContexts).toHaveLength(1);
          yield* Fiber.interrupt(fiber);
        }).pipe(Effect.provide(TestClock.layer())),
      );
    },
  );
});
