/**
 * Default transition attributes for sszvis
 *
 * @module sszvis/transition
 *
 * Generally speaking, this module is used internally by components which transition the state of the update selection.
 * Each helper builds a fresh transition carrying the app's standard easing and duration, and is applied by handing it to
 * a selection: `d3.selection().transition(sszvis.defaultTransition())`. The transition inherits its timing from the one
 * passed in.
 *
 * Do not use `d3.selection().transition().call(sszvis.defaultTransition)`. d3's `transition.call(f)` invokes `f` and
 * returns the original transition, while these helpers ignore their argument and build a detached transition that is then
 * discarded - the scheduled transition silently keeps d3's defaults of 250ms and easeCubicInOut.
 *
 * fastTransition provides an alternate transition duration for certain situations where the standard duration is
 * too slow, and slowTransition for where it is too fast.
 */
/**
 * Creates a default transition with standard easing and duration
 * @returns A d3 transition with 300ms duration and polynomial ease-out
 */
export declare const defaultTransition: () => import("d3-transition").Transition<import("d3-selection").BaseType, unknown, null, undefined>;
/**
 * Creates a fast transition for quick animations
 * @returns A d3 transition with 50ms duration and polynomial ease-out
 */
export declare const fastTransition: () => import("d3-transition").Transition<import("d3-selection").BaseType, unknown, null, undefined>;
/**
 * Creates a slow transition for gradual animations
 * @returns A d3 transition with 500ms duration and polynomial ease-out
 */
export declare const slowTransition: () => import("d3-transition").Transition<import("d3-selection").BaseType, unknown, null, undefined>;
//# sourceMappingURL=transition.d.ts.map