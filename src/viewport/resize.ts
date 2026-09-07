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
 * Note: `trigger` isolates the listeners from one another. A listener that throws is reported
 * through `sszvis.logger.error` and the remaining listeners still run, so one broken chart cannot
 * silence the rest of the page or escape the throttle. `on` accepts anything it is given, so a
 * non-callable listener still fails on the next trigger rather than at registration.
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

import { select } from "d3";
import throttle from "nano-throttle";
import * as logger from "../logger.js";

/** A listener on a caller-triggered event. `trigger` forwards whatever the caller passes,
 * and only the caller knows what that is, so any function is accepted here. Resize listeners
 * are constrained separately - see the `"resize"` overload on `Viewport.on`. */
export type ViewportListener = (...args: never[]) => void;

/** A listener on the `"resize"` event. The window handler triggers `"resize"` with no
 * arguments, so a listener that declares parameters would only ever see `undefined`. */
export type ResizeListener = () => void;

/** The event emitter returned by this module. There is exactly one, page-wide. */
export interface Viewport {
  on(this: Viewport, name: "resize", cb: ResizeListener): Viewport;
  // The conditional name is what keeps `"resize"` out of this overload. A plain
  // `name: string` signature would also accept the literal `"resize"`, so overload
  // resolution would fall through to here and re-approve the listeners the overload
  // above exists to reject.
  on<Name extends string>(
    this: Viewport,
    name: Name extends "resize" ? never : Name,
    cb: ViewportListener
  ): Viewport;
  off(this: Viewport, name: string, cb: ViewportListener): Viewport;
  trigger(this: Viewport, name: string, ...evtArgs: unknown[]): Viewport;
}

// This rather strange set of functions is designed to support the API:
// sszvis.viewport.on('resize', callback);
// While still enabling the user to register multiple callbacks for the 'resize'
// event. Multiple callbacks are a feature which simply returning a d3.dispatch('resize')
// object would not allow.
const callbacks: Record<string, ViewportListener[]> = {
  resize: [],
};

if (globalThis.window !== undefined) {
  select(globalThis.window).on(
    "resize",
    throttle(() => {
      viewport.trigger("resize");
    }, 500)
  );
}

function on(this: Viewport, name: string, cb: ViewportListener): Viewport {
  if (!callbacks[name]) {
    callbacks[name] = [];
  }
  callbacks[name] = [...callbacks[name].filter((fn) => fn !== cb), cb];
  return this;
}

function off(this: Viewport, name: string, cb: ViewportListener): Viewport {
  if (!callbacks[name]) {
    return this;
  }
  callbacks[name] = callbacks[name].filter((fn) => fn !== cb);
  return this;
}

function trigger(this: Viewport, name: string, ...evtArgs: unknown[]): Viewport {
  if (callbacks[name]) {
    // A copy, so that a listener which registers or releases listeners cannot change the
    // list being iterated. Each call is isolated: one failing chart must not silence the
    // charts after it, nor let the error escape into the throttled window handler.
    for (const fn of [...callbacks[name]]) {
      try {
        Reflect.apply(fn, null, evtArgs);
      } catch (error) {
        logger.error(`[sszvis.viewport] A "${name}" listener threw:`, error);
      }
    }
  }
  return this;
}

export const viewport: Viewport = { on, off, trigger };
