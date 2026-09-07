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
const app = _ref => {
  let {
    init,
    render,
    actions,
    fallback
  } = _ref;
  let renderScheduled = false;
  let state;
  invariant(isFunction(init), 'An "init" function returning a Promise must be provided.');
  invariant(isFunction(render), 'A "render" function must be provided.');
  // A default parameter, like the original, only fills in for undefined.
  const actionMap = actions === undefined ? {} : actions;
  // finishDraft is typed as a conditional over the draft it is given, which TypeScript
  // cannot resolve back to State while State is still a type parameter.
  const finish = draft => finishDraft(draft);
  // The dispatchers mirror the keys of the actions object, which is what
  // ActionDispatchers<Actions> describes but Object.keys cannot express.
  const actionDispatchers = Object.keys(actionMap).reduce((acc, key) => {
    acc[key] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      dispatch(key, args);
    };
    return acc;
  }, {});
  function scheduleUpdate(effect) {
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        render(state, actionDispatchers);
        renderScheduled = false;
      });
    }
    if (isFunction(effect)) effect(dispatch);
  }
  const dispatch = (action, props) => {
    const handler = actionMap[action];
    invariant(handler != null, "Action \"".concat(action, "\" is not defined, add it to \"actions\"."));
    const draft = createDraft(state);
    // Each action declares the props it accepts, but which action is being dispatched is
    // only known from a string at this point, so the props cannot be checked here.
    const call = handler;
    // Called on actionMap so that `this` is the actions object, as `actions[action](...)`
    // in the original implementation made it.
    const effect = Reflect.apply(call, actionMap, [draft, ...props]);
    state = finish(draft);
    scheduleUpdate(effect);
  };
  // The app starts out with an empty state that init is expected to populate.
  const initialState = createDraft({});
  init(initialState).then(effect => {
    state = finish(initialState);
    scheduleUpdate(effect);
    viewport.on("resize", scheduleUpdate);
  }).catch(error => {
    // NOTE: invariant always throws here, so the fallback is never reached. This is
    // the behaviour of the original implementation, kept as-is.
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
