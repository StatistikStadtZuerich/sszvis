export function app({ init, render, actions, fallback }: {
    init: any;
    render: any;
    actions?: {} | undefined;
    fallback: any;
}): void;
/**
 * An effect can be returned from an action to schedule further actions using dispatch.
 */
export type Dispatch = (action: string, p?: Props) => void;
/**
 * An action receives an Immer.js Draft that can be mutated within the action. If further
 * actions should be called after this one, an action can return an Effect.
 */
export type Effect = (d: Dispatch, p?: Props) => void;
/**
 * Application loop
 *
 * Creates a stateful app that can be interacted with through actions. By providing
 * a structured approach, this allows us to optimize the render loop and clarifies
 * the relationship between state and actions.
 *
 * Within an app, state can only be modified through actions. During the render phase,
 * state is immutable and an error will be thrown if it is modified accidentally.
 *
 * Conceptually, an app works like this:
 *
 *     init
 *       ⇣
 *     state ⭢ render
 *      ⮤ action ⮠
 *
 * The basis of an app are the following three types:
 *
 * Dispatch can be used to schedule an action after rendering has been completed. In the
 * render function, dispatch is not directly accessible; instead, an actions object is
 * provided to dispatch actions by calling them as functions.
 */
export type Action = (s: Draft, p?: Props) => Effect | void;
//# sourceMappingURL=app.d.ts.map