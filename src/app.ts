import { createDraft, type Draft, finishDraft, setAutoFreeze } from "immer";
import { fallbackRender } from "./fallback.js";
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
 * One exception: the render-scheduled flag is only cleared *after* `render` returns, so an
 * action dispatched synchronously from within `render` updates the state but queues no
 * render for it. The new state is not shown until something else - another dispatch, or a
 * resize - triggers the next frame.
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

export interface AppProps<State, Actions extends Record<string, Action<State>>> {
  /** Asynchronously create the initial state and optionally schedule an action. */
  init: (state: Draft<State>) => Promise<Effect | void>;
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
 * Within an app, state is meant to be modified only through actions. Note that this is a
 * convention, not a guarantee: immer's auto-freezing is turned off in this module because
 * d3 mutates state in many places, so the state handed to render is *not* frozen. Mutating
 * it silently succeeds and the change survives into the next action's draft — treat the
 * state in render as read-only.
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
 * triggers a re-render. Nothing is rendered until the promise returned by `init` resolves;
 * `init` must return a promise. An effect returned by `init` or by an action is called with
 * `dispatch`, which takes an action name and an array of props.
 *
 * `app()` returns nothing and never removes its resize listener, so an app lives for the
 * lifetime of the page and cannot be torn down.
 *
 * Error handling: a rejecting `init`, and an error thrown by an effect returned *by init*,
 * both land in the same catch, where they are re-wrapped with the "[sszvis.app]" prefix and
 * re-thrown. That throw escapes as an unhandled promise rejection, and as a consequence the
 * `fallback` option is never rendered. An effect returned by an *action* runs outside that
 * chain, so its error throws synchronously at the dispatcher's call site instead - a second,
 * inconsistent path.
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
}: AppProps<State, Actions>): void => {
  let renderScheduled = false;
  let state: State;

  invariant(isFunction(init), 'An "init" function returning a Promise must be provided.');
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
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        render(state, actionDispatchers);
        renderScheduled = false;
      });
    }
    if (isFunction(effect)) effect(dispatch);
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
  init(initialState)
    .then((effect) => {
      state = finish(initialState);
      scheduleUpdate(effect);
      viewport.on("resize", scheduleUpdate);
    })
    .catch((error) => {
      // NOTE: invariant always throws here, so the fallback is never reached. This is
      // the behaviour of the original implementation, kept as-is.
      invariant(false, error);
      fallback && fallbackRender(fallback.element, { src: fallback.src });
    });
};

// -----------------------------------------------------------------------------
// Helper functions

function invariant(condition: boolean, message: string | Error): void {
  if (!condition) {
    throw new Error(`[sszvis.app] ${message}`);
  }
}

function isFunction(x: unknown): x is (...args: never[]) => unknown {
  return typeof x === "function";
}
