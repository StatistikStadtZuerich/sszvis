import { createDraft, type Draft, finishDraft, setAutoFreeze } from "immer";
import { fallbackRender } from "./fallback.js";
import * as logger from "./logger.js";
import type { SelectableElement } from "./types.js";
import { viewport } from "./viewport/resize.js";

// d3 mutates state in many places, which is why we have to turn this off.
setAutoFreeze(false);

/**
 * Dispatch runs an action immediately and queues a render for the next animation frame;
 * it does not wait for a render to complete first. In the render function, dispatch is not
 * directly accessible; instead, an actions object is provided to dispatch actions by
 * calling them as functions.
 *
 * An action dispatched synchronously from within `render` queues a *further* frame rather
 * than coalescing into the one being painted, so the state it produces is rendered. A render
 * function that dispatches unconditionally would recur forever, so such cascades are cut off
 * after `MAX_CASCADED_RENDERS` consecutive frames, with a warning.
 *
 * The props are passed as an array, which is spread into the action's arguments.
 */
export type Dispatch = (action: string, props: readonly unknown[]) => void;

/** An effect can be returned from an action to schedule further actions using dispatch. */
export type Effect = (dispatch: Dispatch) => void;

/**
 * An action receives an Immer.js Draft that can be mutated within the action, followed by
 * whatever arguments its dispatcher was called with. If further actions should be called
 * after this one, an action can return an Effect.
 *
 * Actions written inline in the `actions` object are contextually typed from this type,
 * so annotate their props explicitly: `select: (state, d: Datum) => { ... }`.
 *
 * @see {@link https://immerjs.github.io/immer/docs/produce/}
 */
export type Action<State> = (state: Draft<State>, ...props: never[]) => Effect | void;

type ActionProps<A> = A extends (state: never, ...props: infer P) => unknown ? P : never;

/** The actions object handed to render: one function per action, without the draft. */
export type ActionDispatchers<Actions> = {
  [Key in keyof Actions]: (...props: ActionProps<Actions[Key]>) => void;
};

export interface AppFallback {
  element: SelectableElement;
  src: string;
}

/** The handle `app()` returns, so that an app can be torn down. */
export interface AppHandle {
  /** Releases the app's resize listener and stops any frame that is still queued. Calling it
   * more than once is harmless; the app renders nothing afterwards. */
  destroy: () => void;
}

export interface AppProps<State, Actions extends Record<string, Action<State>>> {
  /** Create the initial state and optionally schedule an action. Usually asynchronous, since
   * the state is normally loaded; a chart whose data is already in memory may return nothing. */
  init: (state: Draft<State>) => Promise<Effect | void> | Effect | void;
  /** Update the DOM from the state and optionally dispatch actions. */
  render: (state: State, actions: ActionDispatchers<Actions>) => void;
  /** Functions to transition the application state. */
  actions?: Actions;
  /** Render a fallback image. */
  fallback?: AppFallback;
}

/**
 * Application loop
 *
 * Creates a stateful app that can be interacted with through actions. By providing
 * a structured approach, this allows us to optimize the render loop and clarifies
 * the relationship between state and actions.
 *
 * Within an app, state is modified only through actions. The state object handed to `render`
 * is frozen, so assigning to it throws instead of silently corrupting the state the next
 * action drafts from. The freeze is shallow, and immer's own auto-freezing stays off, because
 * d3 mutates the data objects it is handed in many places; only the top level of the state is
 * protected.
 *
 * Conceptually, an app works like this:
 *
 *     init
 *       ⇣
 *     state ⭢ render
 *      ⮤ action ⮠
 *
 * Rendering is batched into a single requestAnimationFrame, so several dispatches within
 * one frame result in exactly one render. A resize reported by the viewport module also
 * triggers a re-render. Nothing is rendered until `init` has completed: an asynchronous `init`
 * is awaited and rendered once it resolves, a synchronous one is rendered on the next frame.
 * An effect returned by `init` or by an action is called with `dispatch`, which takes an
 * action name and an array of props.
 *
 * `app()` returns a handle whose `destroy()` releases the resize listener and stops any queued
 * frame, so a host that mounts and unmounts charts can tear an app down instead of leaking one
 * render loop per mount.
 *
 * Error handling: an `init` that rejects, or throws synchronously, is reported through `sszvis.logger.error`, keeping the
 * original error as the reported error's `cause`, and the `fallback` image - if one is
 * configured - is rendered in its place. The failure does not escape as an unhandled promise
 * rejection. An effect - whether it came from `init` or from an action - runs on its own path:
 * an error it throws is reported as an effect failure and never travels through the `init`
 * rejection path, so it is not mistaken for a chart that could not be built and does not render
 * the fallback.
 *
 * @module sszvis/app
 */
export const app = <
  State extends object,
  // Defaulted rather than left to inference because `State` cannot be inferred from
  // `init`, so callers write `app<State>({ ... })` - a partial type-argument list, which
  // switches inference off for this parameter. The cost is that when `State` is given
  // explicitly the dispatchers are keyed by arbitrary strings, so `actions.missing()`
  // type-checks and fails at runtime; the alternative is a worse trade, since narrowing
  // the default makes every inline action's `state` implicitly `any`.
  Actions extends Record<string, Action<State>> = Record<string, Action<State>>,
>({
  init,
  render,
  actions,
  fallback,
}: AppProps<State, Actions>): AppHandle => {
  let renderScheduled = false;
  // Whether `render` is on the stack right now, which is what tells a dispatch made from
  // inside render apart from one that should coalesce into the frame already queued.
  let rendering = false;
  let cascadedRenders = 0;
  let destroyed = false;
  let state: State;

  invariant(isFunction(init), 'An "init" function must be provided.');
  invariant(isFunction(render), 'A "render" function must be provided.');

  // A default parameter, like the original, only fills in for undefined.
  const actionMap: Record<string, Action<State>> = actions === undefined ? {} : actions;

  // finishDraft is typed as a conditional over the draft it is given, which TypeScript
  // cannot resolve back to State while State is still a type parameter.
  const finish = (draft: Draft<State>): State => finishDraft(draft) as State;

  // The dispatchers mirror the keys of the actions object, which is what
  // ActionDispatchers<Actions> describes but Object.keys cannot express.
  const actionDispatchers = Object.keys(actionMap).reduce<
    Record<string, (...args: never[]) => void>
  >((acc, key) => {
    acc[key] = (...args) => {
      dispatch(key, args);
    };
    return acc;
  }, {}) as ActionDispatchers<Actions>;

  function scheduleUpdate(effect?: Effect | void) {
    scheduleRender();
    if (isFunction(effect)) runEffect(effect);
  }

  function scheduleRender() {
    if (destroyed || renderScheduled) return;
    if (rendering) {
      // A dispatch made from inside render. Its state cannot be shown by the frame that is
      // painting, so it needs one of its own - and a render that dispatches unconditionally
      // would then never stop, which is what this cap is for.
      if (cascadedRenders >= MAX_CASCADED_RENDERS) {
        logger.warn(
          `[sszvis.app] Stopped after ${MAX_CASCADED_RENDERS} renders scheduled from inside "render". Dispatch from render only on a condition that eventually becomes false.`
        );
        return;
      }
      cascadedRenders += 1;
    } else {
      cascadedRenders = 0;
    }
    renderScheduled = true;
    requestAnimationFrame(() => {
      // Cleared before render runs, so that a dispatch made from inside render can queue the
      // frame its state needs instead of being swallowed by a guard that is still closed.
      renderScheduled = false;
      if (destroyed) return;
      rendering = true;
      try {
        // Shallow, so that d3 can still mutate the data hanging off the state, but enough to
        // turn an accidental `state.x = …` in render into a TypeError rather than a change
        // that survives into the next action's draft.
        render(Object.freeze(state), actionDispatchers);
      } finally {
        rendering = false;
      }
    });
  }

  /** Effects are the caller's code, run one turn removed from whatever scheduled them, so
   * their failures are reported on their own rather than attributed to `init` or thrown at
   * an unrelated dispatcher's call site. */
  function runEffect(effect: Effect) {
    try {
      effect(dispatch);
    } catch (error) {
      reportError("An effect failed", error);
    }
  }

  const dispatch: Dispatch = (action, props) => {
    const handler = actionMap[action];
    invariant(handler != null, `Action "${action}" is not defined, add it to "actions".`);
    const draft = createDraft(state);
    // Each action declares the props it accepts, but which action is being dispatched is
    // only known from a string at this point, so the props cannot be checked here.
    const call = handler as (state: Draft<State>, ...props: readonly unknown[]) => Effect | void;
    // Called on actionMap so that `this` is the actions object, as `actions[action](...)`
    // in the original implementation made it.
    const effect = Reflect.apply(call, actionMap, [draft, ...props]);
    state = finish(draft);
    scheduleUpdate(effect);
  };

  // The app starts out with an empty state that init is expected to populate.
  const initialState = createDraft({} as State);
  // `init` is normally async, because the state is normally loaded - but a chart whose data is
  // already in memory can reasonably write the state and return nothing, and that works just as
  // well: there is simply no effect and nothing to wait for. The executor of a `new Promise`
  // runs synchronously, so `init` is still called during `app()` as it always was, while
  // `resolve` tolerates a plain return value and a synchronous throw becomes a rejection -
  // reported through the same path as one from a promise, rather than escaping the call site.
  new Promise<Effect | void>((resolve) => {
    resolve(init(initialState));
  })
    .then((effect) => {
      state = finish(initialState);
      // An app destroyed while init was still in flight must not register a listener that
      // nothing will ever release.
      if (destroyed) return;
      // Registered before the effect runs: scheduleUpdate calls the effect synchronously,
      // and an init effect that destroys the app would otherwise release a listener that
      // is only installed afterwards, leaving it attached for the life of the page.
      viewport.on("resize", scheduleUpdate);
      scheduleUpdate(effect);
    })
    .catch((error: unknown) => {
      // A rejecting init is a runtime failure, not a misconfiguration: the fallback option
      // exists precisely for it, so it is reported and the fallback rendered rather than
      // re-thrown into an unhandled rejection nobody can catch.
      reportError("Initialisation failed", error);
      // A destroyed app renders nothing afterwards, fallback included - the container may
      // already belong to a replacement app. The failure is still reported, since it is
      // real regardless of who is holding the container now.
      if (!destroyed && fallback) fallbackRender(fallback.element, { src: fallback.src });
    });

  return {
    destroy() {
      destroyed = true;
      viewport.off("resize", scheduleUpdate);
    },
  };
};

// -----------------------------------------------------------------------------
// Helper functions

/** How many frames in a row may be scheduled by a dispatch made from inside `render` before
 * the cascade is treated as a runaway loop and cut off. */
const MAX_CASCADED_RENDERS = 10;

function invariant(condition: boolean, message: string | Error): void {
  if (!condition) {
    throw new Error(`[sszvis.app] ${message}`);
  }
}

/** Reports a runtime failure without escaping as an unhandled rejection. The original error
 * is kept as the `cause` so its message and stack are not lost. */
function reportError(context: string, cause: unknown): void {
  const message = cause instanceof Error ? cause.message : String(cause);
  logger.error(new Error(`[sszvis.app] ${context}: ${message}`, { cause }));
}

function isFunction(x: unknown): x is (...args: never[]) => unknown {
  return typeof x === "function";
}
