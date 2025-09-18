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
/**
 * Creates a default transition with standard easing and duration
 * @returns A d3 transition with 300ms duration and polynomial ease-out
 */
const defaultTransition = () => transition().ease(defaultEase).duration(300);
/**
 * Creates a fast transition for quick animations
 * @returns A d3 transition with 50ms duration and polynomial ease-out
 */
const fastTransition = () => transition().ease(defaultEase).duration(50);
/**
 * Creates a slow transition for gradual animations
 * @returns A d3 transition with 500ms duration and polynomial ease-out
 */
const slowTransition = () => transition().ease(defaultEase).duration(500);

export { defaultTransition, fastTransition, slowTransition };
//# sourceMappingURL=transition.js.map
