/**
 * @function sszvis.tooltipFit
 *
 * This is a useful default function for making a tooltip fit within a horizontal space.
 * You provide a default orientation for the tooltip, but also provide the bounds of the
 * space within which the tooltip should stay. When the tooltip is too close to the left
 * or right edge of the bounds, it is oriented away from the edge. Otherwise the default
 * is used.
 *
 * @template T The type of the data objects used in the tooltip
 * @param {String} defaultValue         The default value for the tooltip orientation
 * @param {Object} bounds               The bounds object within which the tooltip should stay.
 *
 * @returns {Function}                  A function for calculating the orientation of the tooltips.
 */
type TooltipOrientation = "top" | "bottom" | "left" | "right";
interface TooltipData<T = unknown> {
    datum: T;
    x: number;
    y: number;
}
interface Bounds {
    innerWidth: number;
}
export default function <T = unknown>(defaultVal: TooltipOrientation, bounds: Bounds): (d: TooltipData<T>) => TooltipOrientation;
export {};
//# sourceMappingURL=fitTooltip.d.ts.map