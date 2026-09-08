import { type Draft } from "immer";
import type { SelectableElement } from "./types.js";
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
 * the fallback. A dispatch naming an action the `actions` object does not declare is reported the
 * same way and otherwise ignored, so a mistyped name in an effect leaves the app running.
 *
 * @module sszvis/app
 */
export declare const app: <State extends object, Actions extends Record<string, Action<State>> = Record<string, Action<State>>>({ init, render, actions, fallback, }: AppProps<State, Actions>) => AppHandle;
export {};
//# sourceMappingURL=app.d.ts.map