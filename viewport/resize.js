import { select } from 'd3';
import throttle from '../_virtual/index.js';

/**
 * Viewport Resize watcher
 *
 * The resize watcher in the sszvis.viewport module alerts user code to changes in the browser
 * window size. This includes window resizing on desktop browsers, but also orientation changes
 * on mobile browsers. Functions registered for the 'resize' event are called when the window
 * fires a resize event:
 *
 * sszvis.viewport.on('resize', listenerFunction);
 *
 * The window handler is throttled on a 500ms window, leading edge first: the first resize event
 * calls the listeners synchronously, and if further events arrive within the window the listeners
 * are called once more on the trailing edge, 500ms later. A single isolated resize event produces
 * exactly one call. Resize listeners are called with no arguments.
 *
 * The module is a page-wide singleton: there is one registry, shared by every chart on the page.
 *
 * @module sszvis/viewport
 *
 * @function {string, function} on      registers a listener for an event name. 'resize' is the only
 *                                      name the module itself ever fires, but any name creates a
 *                                      bucket that the caller can `trigger` by hand. Registering the
 *                                      same function twice is de-duplicated: the earlier entry is
 *                                      dropped and the function is appended, so re-registering moves
 *                                      it to the end of the call order. Listeners run in registration
 *                                      order.
 *
 * @function {string, function} off     removes a listener by function identity. An unknown event name
 *                                      or an unregistered function is ignored. A single `off` undoes
 *                                      any number of `on` calls for the same function.
 *
 * @function {string, ...any} trigger   calls every listener registered for the event name, forwarding
 *                                      any further arguments. An event name with no listeners is
 *                                      ignored.
 *
 * Note: the registry is never cleared, so listeners outlive the chart that registered them. A chart
 * that is torn down keeps receiving resize events unless it calls `off` with the exact same function
 * reference; an inline arrow function can never be removed.
 *
 * Note: `trigger` calls the listeners in a bare loop with no error isolation. A throwing listener
 * blocks every listener registered after it and the error escapes `trigger`. Thrown from the window
 * handler it also escapes the throttle before the window is recorded, which leaves throttling
 * disabled for subsequent resize events. `on` accepts anything it is given, so a non-callable
 * listener fails the same way on the next trigger rather than at registration.
 *
 * Note: `on`, `off` and `trigger` return `this`, so they chain when called as methods on the viewport
 * object but return `undefined` once destructured. The registration itself still works.
 *
 * Note: when there is no `window`, nothing is registered and only manual `trigger` calls fire.
 *
 * See test/viewport/resize.test.ts.
 *
 * @return {Object}
 */
// This rather strange set of functions is designed to support the API:
// sszvis.viewport.on('resize', callback);
// While still enabling the user to register multiple callbacks for the 'resize'
// event. Multiple callbacks are a feature which simply returning a d3.dispatch('resize')
// object would not allow.
const callbacks = {
  resize: []
};
if (globalThis.window !== undefined) {
  select(globalThis.window).on("resize", throttle(() => {
    viewport.trigger("resize");
  }, 500));
}
function on(name, cb) {
  if (!callbacks[name]) {
    callbacks[name] = [];
  }
  callbacks[name] = [...callbacks[name].filter(fn => fn !== cb), cb];
  return this;
}
function off(name, cb) {
  if (!callbacks[name]) {
    return this;
  }
  callbacks[name] = callbacks[name].filter(fn => fn !== cb);
  return this;
}
function trigger(name) {
  if (callbacks[name]) {
    for (var _len = arguments.length, evtArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      evtArgs[_key - 1] = arguments[_key];
    }
    for (const fn of callbacks[name]) {
      Reflect.apply(fn, null, evtArgs);
    }
  }
  return this;
}
const viewport = {
  on,
  off,
  trigger
};

export { viewport };
//# sourceMappingURL=resize.js.map
