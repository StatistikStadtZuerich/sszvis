/**
 * The headless browser the sweep loads charts in.
 *
 * Playwright is a promise API with its own lifecycle, so it is wrapped once
 * here: the browser is acquired by the layer and closed by its finalizer, each
 * page context by the scope of one load. Nothing else in the CLI touches
 * playwright directly.
 */
import { chromium } from "playwright";
import { Context, type Duration, Effect, Layer, Schema } from "effect";

export class BrowserError extends Schema.TaggedError<BrowserError>()("BrowserError", {
  cause: Schema.Defect(),
}) {
  /**
   * `Schema.TaggedError` stringifies to just its tag, which would record every
   * failed load as the word "BrowserError". `fatal` is the only diagnostic a
   * `load-failed` chart carries, so the underlying message has to survive.
   */
  override get message(): string {
    return this.cause instanceof Error ? this.cause.message : String(this.cause);
  }
}

/**
 * The slice of playwright the sweep actually uses.
 *
 * Structural rather than playwright's own types, so a test can substitute a
 * browser whose calls reject or hang - the recovery and timeout paths below are
 * this service's real behaviour and a Chromium will not exercise them on
 * demand. Playwright satisfies these by shape, so `layer` needs no cast.
 */
export interface PageLike {
  goto(url: string, options: { waitUntil: "load"; timeout: number }): Promise<unknown>;
  evaluate<A>(fn: () => A): Promise<A>;
  screenshot(options: { fullPage: boolean }): Promise<Uint8Array>;
}

export interface ContextLike {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
}

export interface BrowserLike {
  newContext(options: { viewport: { width: number; height: number } }): Promise<ContextLike>;
  close(): Promise<void>;
}

export interface PageLoad {
  /** What the injected reporter said, or `undefined` if it never ran. */
  readonly snapshot: unknown;
  /** A full-page screenshot, when one was asked for. */
  readonly shot: Uint8Array | undefined;
  /** Why the load never got far enough to report, if it did not. */
  readonly fatal: string | undefined;
}

export interface LoadOptions {
  readonly url: string;
  /**
   * A chart's fault often lives in one breakpoint only, and the viewport is
   * fixed when the context is created - so the width is chosen per load and the
   * chart runs its first render at it, rather than re-laying out from a
   * previous one.
   */
  readonly width: number;
  /** Charts fetch their data, then transition; rendering needs time to settle. */
  readonly settle: Duration.Input;
  readonly shot: boolean;
}

export interface BrowserShape {
  /** Load `url` at `width`, let rendering settle, and read the page reporter. */
  readonly load: (options: LoadOptions) => Effect.Effect<PageLoad>;
}

/**
 * Neither `evaluate` nor `screenshot` takes a timeout of its own, so a hung
 * page would hold one of the sweep's concurrency slots indefinitely. `goto`
 * carries the same bound as its own option.
 */
const CALL_TIMEOUT = "30 seconds";

export class Browser extends Context.Service<Browser, BrowserShape>()(
  "regression-cli/services/Browser",
) {
  /**
   * Over any browser launcher; `layer` is this with a real Chromium.
   *
   * The return type is spelled out because `layer` is built from this and the
   * inference would be circular. A failed launch stays a typed error rather
   * than a defect, so the CLI reports it.
   */
  static readonly layerWith = (
    launch: () => Promise<BrowserLike>,
  ): Layer.Layer<Browser, BrowserError> =>
    Layer.effect(Browser)(
      Effect.gen(function* () {
        /**
         * Every playwright call goes through this, never `Effect.promise`: a
         * rejection there becomes a *defect*, which `Effect.catch` cannot
         * recover, so one page closing its target mid-evaluate would abort the
         * whole `Effect.forEach` sweep instead of recording one `load-failed`.
         */
        const attempt = <A>(f: () => Promise<A>) =>
          Effect.tryPromise({ try: f, catch: (cause) => new BrowserError({ cause }) });

        const browser: BrowserLike = yield* Effect.acquireRelease(
          attempt(launch),
          // Through `attempt` too: `Effect.ignore` drops a typed failure but not
          // a defect, so a rejected close would fail a good sweep at teardown.
          (launched) => attempt(() => launched.close()).pipe(Effect.ignore),
        );

        const load = Effect.fn("Browser.load")(
          function* (options: LoadOptions) {
            yield* Effect.annotateCurrentSpan({ url: options.url, width: options.width });

            // A context per load, not per sweep: the two sides request the same
            // URL shape, so a shared cache or localStorage would leak the
            // baseline's library into the candidate's load.
            const context: ContextLike = yield* Effect.acquireRelease(
              attempt(() =>
                browser.newContext({ viewport: { width: options.width, height: 900 } }),
              ),
              (opened) => attempt(() => opened.close()).pipe(Effect.ignore),
            );
            const page: PageLike = yield* attempt(() => context.newPage());

            yield* attempt(() => page.goto(options.url, { waitUntil: "load", timeout: 30_000 }));
            yield* Effect.sleep(options.settle);

            const snapshot = yield* attempt(() =>
              page.evaluate(
                () =>
                  (globalThis as { __sszvisRegression?: () => unknown }).__sszvisRegression?.() ??
                  null,
              ),
            ).pipe(Effect.timeout(CALL_TIMEOUT));
            const shot = options.shot
              ? yield* attempt(() => page.screenshot({ fullPage: true })).pipe(
                  Effect.timeout(CALL_TIMEOUT),
                )
              : undefined;

            return { snapshot, shot, fatal: undefined } satisfies PageLoad;
          },
          // A page that crashes, times out or never loads is data, not a reason
          // to abandon the sweep: the pair it belongs to becomes `load-failed`.
          Effect.catch((error) =>
            Effect.succeed<PageLoad>({
              snapshot: undefined,
              shot: undefined,
              fatal: String(error).split("\n")[0],
            }),
          ),
          Effect.scoped,
        );

        return Browser.of({ load });
      }),
    );

  static readonly layer = Browser.layerWith(() => chromium.launch());
}
