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

export const defaultTransition = function () {
  return d3Transition().ease(defaultEase).duration(300);
};

export const fastTransition = function () {
  return d3Transition().ease(defaultEase).duration(50);
};

export const slowTransition = function () {
  return d3Transition().ease(defaultEase).duration(500);
};
