import { transition, easePolyOut } from 'd3';

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

const defaultEase = easePolyOut;
const defaultTransition = () => transition().ease(defaultEase).duration(300);
const fastTransition = () => transition().ease(defaultEase).duration(50);
const slowTransition = () => transition().ease(defaultEase).duration(500);

export { defaultTransition, fastTransition, slowTransition };
//# sourceMappingURL=transition.js.map
