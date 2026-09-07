/**
 * Pie component
 *
 * The pie component is used to draw pie charts. It uses the d3.arc() generator
 * to create pie wedges.
 *
 * The input data should be an array of data values, where each data value represents one wedge in the pie.
 *
 * @module sszvis/component/pie
 *
 * @property {number} radius                  Required. The outer radius of the pie, in px (no default). It is also
 *                                            used to translate every wedge to (radius, radius); since the arc
 *                                            then extends another radius in every direction, the pie occupies a
 *                                            box of 2 * radius by 2 * radius.
 *                                            The inner radius is hardcoded to 4px and cannot be configured.
 *                                            Rendering without it throws.
 * @property {string, function} fill          a fill color for wedges in the pie. Ideally a function which takes a
 *                                            data value. If unset, the attribute is omitted and the wedges fall back
 *                                            to the SVG default, black.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default "#FFFFFF", which
 *                                            separates touching wedges). The default applies only when the property
 *                                            was never set: a falsy value, such as "" or null, is passed through, and
 *                                            behaves the same whether it is given as a constant or returned from an
 *                                            accessor.
 * @property {number, function} angle         Required. Specifies the angle of the wedges in radians. Theoretically
 *                                            this could be a constant, but that would make for a very strange pie.
 *                                            Ideally, this is a function which takes a data value and returns the
 *                                            angle in radians. Angles are summed as given and never clamped, so a
 *                                            total beyond a full turn overshoots and a negative angle draws its wedge
 *                                            backwards. A value that is not finite is reported through sszvis.logger and
 *                                            treated as zero, so one bad datum costs at most its own wedge.
 *                                            Rendering without the property throws.
 * @property {boolean} transition             Whether to animate between renders (default true). The wedge angles, the
 *                                            transform, the fill and the stroke all ease over the default 300ms. With
 *                                            transition(false) every attribute is written on the render tick instead,
 *                                            which is what a chart serialised synchronously - a snapshot, an SVG
 *                                            export - or one rendered in a hidden tab wants, since d3-timer runs on
 *                                            requestAnimationFrame.
 *
 * Note: the component keeps its transition state - the angles currently on screen - in a
 * WeakMap keyed by the wedge element, so it never writes to the caller's data. Frozen data,
 * two entries sharing one datum object, and data carrying fields of its own all render
 * correctly. The wedges carry their own `sszvis-pie-path` class alongside the generic
 * `sszvis-path` one, and the component matches only the former, so a foreign path left in the
 * same group by another component is left alone.
 *
 * @return {sszvis.component}
 */
import { type ComponentBuilder } from "../d3-component.js";
/** The angle property is wrapped by fn.functor on set, so it is always a function here. */
export type AngleAccessor<T = unknown> = (d: T) => number;
/**
 * fill and stroke accept a constant or an accessor and are not normalised on set. An
 * accessor may resolve to null or undefined to leave the attribute off, which is how d3
 * reads both, so one nullish-aware alias describes what the setters accept and what the
 * getters return.
 */
export type ColorAccessor<T = unknown> = (d: T, i: number) => string | null | undefined;
export type ColorValue<T = unknown> = string | null | undefined | ColorAccessor<T>;
/**
 * The getters return whatever was last set, which is undefined for radius and angle until
 * the caller sets them - both are required, and rendering without them throws, so both
 * getters report the undefined the props actually hold.
 */
export interface PieComponent<T = unknown> extends ComponentBuilder<PieComponent<T>> {
    radius(): number | undefined;
    radius(radius: number): PieComponent<T>;
    fill(): ColorValue<T> | undefined;
    fill<U = T>(fill: ColorValue<U>): PieComponent<T>;
    stroke(): ColorValue<T> | undefined;
    stroke<U = T>(stroke: ColorValue<U>): PieComponent<T>;
    angle(): AngleAccessor<T> | undefined;
    angle<U = T>(angle: number | AngleAccessor<U>): PieComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): PieComponent<T>;
}
export default function pie<T = unknown>(): PieComponent<T>;
//# sourceMappingURL=pie.d.ts.map