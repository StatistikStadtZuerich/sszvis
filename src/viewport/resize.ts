/**
 * Viewport Resize watcher
 *
 * The resize watcher in the sszvis.viewport module can be used for alerting user code to
 * changes in the browser window size. This includes window resizing on desktop computers
 * and browsers, but also orientation changes on mobile browsers. Functions which listen
 * to the 'resize' event of the sszvis.viewport module will be fired on window resize.
 * You can add a resize listener to your application very easily:
 *
 * sszvis.viewport.on('resize', listenerFunction);
 *
 * The listener function will be called once per resize event, but at a slight delay. This is because,
 * while a user is resizing their browser window, many resize events can fire very quickly. This component
 * automatically throttles the rate at which the listener function is called, since you probably don't need
 * to respond to every single resize event. This throttling provides for a smoother user experience as they
 * resize the browser, and increases performance across the board. The listener function will always be
 * called after one or more window resize events, it just won't be called as often as the window fires the
 * events.
 *
 * @module sszvis/viewport
 *
 * @function {string, function} on      the .on() function is used to listen to the resize event itself.
 *                                      There is only one event supported by this component at the moment, so
 *                                      the first argument to .on must be 'resize' for it to have any effect.
 *                                      Although this is somewhat redundant, it is done to keep this component's
 *                                      API clear and in line with other components.
 *
 * @return {Object}
 */

import { select } from "d3";
import throttle from "nano-throttle";

/** A listener registered through `viewport.on`. Resize listeners are called with no
 * arguments; `trigger` forwards whatever the caller passes, so any function is accepted. */
export type ViewportListener = (...args: never[]) => void;

/** The event emitter returned by this module. There is exactly one, page-wide. */
export interface Viewport {
  on(this: Viewport, name: string, cb: ViewportListener): Viewport;
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
    for (const fn of callbacks[name]) {
      Reflect.apply(fn, null, evtArgs);
    }
  }
  return this;
}

export const viewport: Viewport = { on, off, trigger };
