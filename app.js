import { setAutoFreeze, createDraft, finishDraft } from './node_modules/immer/dist/immer.js';
import { fallbackRender } from './fallback.js';
import { viewport } from './viewport/resize.js';

// d3 mutates state in many places, which is why we have to turn this off.
setAutoFreeze(false);
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
 * @typedef {(action: string, p?: Props) => void} Dispatch
 *
 * An effect can be returned from an action to schedule further actions using dispatch.
 * @typedef {(d: Dispatch, p?: Props) => void} Effect
 *
 * An action receives an Immer.js Draft that can be mutated within the action. If further
 * actions should be called after this one, an action can return an Effect.
 * @typedef {(s: Draft, p?: Props) => Effect | void} Action
 * @see {@link https://immerjs.github.io/immer/docs/produce/}
 *
 * The app can be configured with the following props:
 *
 * @prop {Object} props
 * @prop {(s: Draft) => Promise<Effect | void>} props.init - Asynchronously create
 * the initial state and optionally schedule an action
 * @prop {(s: State, as: Record<keyof props.actions, (p?: Props) => void>)} props.render - Update
 * the DOM from the state and optionally dispatch actions
 * @prop {Record<string, Action>} [props.actions] - Functions to transition the
 * application state
 * @prop {{element: string, src: string}} [props.fallback] - Render a fallback image
 *
 * @module sszvis/app
 */
const app = _ref => {
  let {
    init,
    render,
    actions = {},
    fallback
  } = _ref;
  let doing;
  let state;
  invariant(isFunction(init), 'An "init" function returning a Promise must be provided.');
  invariant(isFunction(render), 'A "render" function must be provided.');
  const actionDispatchers = Object.keys(actions).reduce((acc, key) => {
    acc[key] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      dispatch(key, args);
    };
    return acc;
  }, {});
  function scheduleUpdate(effect) {
    if (!doing) {
      doing = true;
      requestAnimationFrame(() => {
        render(state, actionDispatchers);
        doing = false;
      });
    }
    if (isFunction(effect)) effect(dispatch);
  }
  function dispatch(action, props) {
    invariant(actions[action] != null, "Action \"".concat(action, "\" is not defined, add it to \"actions\"."));
    const draft = createDraft(state);
    const effect = actions[action](draft, ...props);
    state = finishDraft(draft);
    scheduleUpdate(effect);
  }
  const initialState = createDraft({});
  init(initialState).then(effect => {
    state = finishDraft(initialState);
    scheduleUpdate(effect);
    viewport.on("resize", scheduleUpdate);
  }).catch(error => {
    invariant(false, error);
    fallback && fallbackRender(fallback.element, {
      src: fallback.src
    });
  });
};
// -----------------------------------------------------------------------------
// Helper functions
function invariant(condition, message) {
  if (!condition) {
    throw new Error("[sszvis.app] ".concat(message));
  }
}
function isFunction(x) {
  return typeof x === "function";
}

export { app };
//# sourceMappingURL=app.js.map
