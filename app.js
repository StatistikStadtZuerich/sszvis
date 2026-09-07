import { setAutoFreeze, createDraft, finishDraft } from './node_modules/immer/dist/immer.js';
import { fallbackRender } from './fallback.js';
import { error, warn } from './logger.js';
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
 * triggers a re-render. Nothing is rendered until the promise returned by `init` resolves;
 * `init` must return a promise. An effect returned by `init` or by an action is called with
 * `dispatch`, which takes an action name and an array of props.
 *
 * `app()` returns a handle whose `destroy()` releases the resize listener and stops any queued
 * frame, so a host that mounts and unmounts charts can tear an app down instead of leaking one
 * render loop per mount.
 *
 * Error handling: a rejecting `init` is reported through `sszvis.logger.error`, keeping the
 * original error as the reported error's `cause`, and the `fallback` image - if one is
 * configured - is rendered in its place. The failure does not escape as an unhandled promise
 * rejection. An effect - whether it came from `init` or from an action - runs on its own path:
 * an error it throws is reported as an effect failure and never travels through the `init`
 * rejection path, so it is not mistaken for a chart that could not be built and does not render
 * the fallback.
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
  // Whether `render` is on the stack right now, which is what tells a dispatch made from
  // inside render apart from one that should coalesce into the frame already queued.
  let rendering = false;
  let cascadedRenders = 0;
  let destroyed = false;
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
        warn("[sszvis.app] Stopped after ".concat(MAX_CASCADED_RENDERS, " renders scheduled from inside \"render\". Dispatch from render only on a condition that eventually becomes false."));
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
  function runEffect(effect) {
    try {
      effect(dispatch);
    } catch (error) {
      reportError("An effect failed", error);
    }
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
    // An app destroyed while init was still in flight must not register a listener that
    // nothing will ever release.
    if (destroyed) return;
    // Registered before the effect runs: scheduleUpdate calls the effect synchronously,
    // and an init effect that destroys the app would otherwise release a listener that
    // is only installed afterwards, leaving it attached for the life of the page.
    viewport.on("resize", scheduleUpdate);
    scheduleUpdate(effect);
  }).catch(error => {
    // A rejecting init is a runtime failure, not a misconfiguration: the fallback option
    // exists precisely for it, so it is reported and the fallback rendered rather than
    // re-thrown into an unhandled rejection nobody can catch.
    reportError("Initialisation failed", error);
    // A destroyed app renders nothing afterwards, fallback included - the container may
    // already belong to a replacement app. The failure is still reported, since it is
    // real regardless of who is holding the container now.
    if (!destroyed && fallback) fallbackRender(fallback.element, {
      src: fallback.src
    });
  });
  return {
    destroy() {
      destroyed = true;
      viewport.off("resize", scheduleUpdate);
    }
  };
};
// -----------------------------------------------------------------------------
// Helper functions
/** How many frames in a row may be scheduled by a dispatch made from inside `render` before
 * the cascade is treated as a runaway loop and cut off. */
const MAX_CASCADED_RENDERS = 10;
function invariant(condition, message) {
  if (!condition) {
    throw new Error("[sszvis.app] ".concat(message));
  }
}
/** Reports a runtime failure without escaping as an unhandled rejection. The original error
 * is kept as the `cause` so its message and stack are not lost. */
function reportError(context, cause) {
  const message = cause instanceof Error ? cause.message : String(cause);
  error(new Error("[sszvis.app] ".concat(context, ": ").concat(message), {
    cause
  }));
}
function isFunction(x) {
  return typeof x === "function";
}

export { app };
//# sourceMappingURL=app.js.map
