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
 *
 * defaultTransition takes an optional name. A component that has to interrupt its own transition must pass one and
 * interrupt by it: `selection.interrupt()` with no name stops the unnamed transition, which is also the one a consumer
 * gets from a bare `selection.transition()`, so an unnamed interrupt cancels a consumer's animation on the same
 * elements as well. Naming scopes both halves to the component. Only the components that interrupt need it, so the
 * argument is optional and every other caller is unchanged.
 */
/**
 * The transition name a component uses for geometry it owns and may need to interrupt.
 *
 * Shared rather than per-component: these components never animate the same elements, and one name keeps the
 * interrupt and the transition it is meant to stop from drifting apart. Exported so a consumer can deliberately
 * interrupt or inspect the library's own transitions.
 */
export declare const OWN_TRANSITION = "sszvis-own";
/**
 * Creates a default transition with standard easing and duration
 * @param name Optional transition name. Pass OWN_TRANSITION when the component also interrupts this transition, so
 *             the interrupt cannot reach a transition the consumer scheduled. Omitted, the transition is unnamed,
 *             which is d3's default and what every non-interrupting component uses.
 * @returns A d3 transition with 300ms duration and polynomial ease-out
 */
export declare const defaultTransition: (name?: string) => import("d3-transition").Transition<import("d3-selection").BaseType, unknown, null, undefined>;
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