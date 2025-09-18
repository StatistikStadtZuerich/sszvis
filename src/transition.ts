/**
 * Default transition attributes for sszvis
 *
 * @module sszvis/transition
 *
 * Generally speaking, this module is used internally by components which transition the state of the update selection.
 * The module sszvis.transition encapsulates the basic transition attributes used in the app. It is invoked by doing
 * d3.selection().transition().call(sszvis.transition), which applies the transition attributes to the passed transition.
 * transition.fastTransition provides an alternate transition duration for certain situations where the standard duration is
 * too slow.
 */

import { transition as d3Transition, easePolyOut } from "d3";

const defaultEase = easePolyOut;

/**
 * Creates a default transition with standard easing and duration
 * @returns A d3 transition with 300ms duration and polynomial ease-out
 */
export const defaultTransition = function () {
  return d3Transition().ease(defaultEase).duration(300);
};

/**
 * Creates a fast transition for quick animations
 * @returns A d3 transition with 50ms duration and polynomial ease-out
 */
export const fastTransition = function () {
  return d3Transition().ease(defaultEase).duration(50);
};

/**
 * Creates a slow transition for gradual animations
 * @returns A d3 transition with 500ms duration and polynomial ease-out
 */
export const slowTransition = function () {
  return d3Transition().ease(defaultEase).duration(500);
};
