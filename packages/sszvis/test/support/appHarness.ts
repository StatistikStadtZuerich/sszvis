import { afterEach, beforeEach, vi } from "vitest";
import { type ResizeListener, viewport } from "../../src/viewport/resize.js";

/**
 * Shared setup for the app suites.
 *
 * These lived at the top of a single 777-line app.test.ts. Splitting that file by responsibility
 * would have copied them five times, so they live here instead - and only these: each suite keeps
 * its own fixtures and its own expectations local.
 */

/**
 * Waits for the next animation frame to have been painted, which is when the app's render loop
 * has run.
 */
export const nextFrame = (): Promise<void> =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

/** Swallows - and records - any unhandled rejection, so that a test can assert none escaped. */
export const captureUnhandledRejections = () => {
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
 * Keeps the app suites independent of their order, and must be called once per suite file.
 *
 * Every app whose `init` resolves registers a resize listener on the module-global viewport. Most
 * tests never call the app's own `destroy()`, so those listeners would outlive the test that
 * created them and a later resize would run the renders of every earlier test. This records what
 * each test registers and unregisters it afterwards. The teardown suite covers `destroy()` itself,
 * which is a different question from this bookkeeping.
 */
export function installResizeListenerIsolation() {
  const onResize = viewport.on;
  let registered: ResizeListener[] = [];

  beforeEach(() => {
    registered = [];
    // SAFETY: viewport.on is overloaded, so the function expression cannot be inferred to
    // match it; the body forwards every call to the real implementation unchanged.
    vi.spyOn(viewport, "on").mockImplementation(function (
      this: typeof viewport,
      name: string,
      cb: ResizeListener,
    ) {
      if (name === "resize") registered.push(cb);
      return onResize.call(this, "resize", cb);
    } as typeof viewport.on);
  });

  afterEach(() => {
    for (const cb of registered) viewport.off("resize", cb);
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // `registered` is returned because the teardown suite asserts on it directly - that a destroy
  // before init resolves registers no listener, and that an init effect's destroy releases the one
  // it was given. The bookkeeping is part of that contract, not only hygiene.
  return { registered: () => registered };
}
