import { type Draft } from "immer";
import type { SelectableElement } from "./types.js";
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
export declare const app: <State extends object, Actions extends Record<string, Action<State>> = Record<string, Action<State>>>({ init, render, actions, fallback, }: AppProps<State, Actions>) => void;
export {};
//# sourceMappingURL=app.d.ts.map