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
 *                                            The inner radius is hardcoded to 4px and cannot be configured. If the
 *                                            property is left unset the wedges receive an unparseable transform and
 *                                            the tooltip anchors are positioned at NaN, with no warning.
 * @property {string, function} fill          a fill color for wedges in the pie. Ideally a function which takes a
 *                                            data value. If unset, the attribute is omitted and the wedges fall back
 *                                            to the SVG default, black.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default "#FFFFFF", which
 *                                            separates touching wedges). A falsy value passed as the property, such
 *                                            as "" or null, is replaced by that default; a falsy value returned from
 *                                            an accessor is not.
 * @property {number, function} angle         Required. Specifies the angle of the wedges in radians. Theoretically
 *                                            this could be a constant, but that would make for a very strange pie.
 *                                            Ideally, this is a function which takes a data value and returns the
 *                                            angle in radians. Angles are summed as given and never clamped, and if
 *                                            the property is left unset the render throws a TypeError.
 *
 * Note: the wedge geometry is written only by the arc tween, so no `d` attribute exists until
 * the first animation frame, and there is no transition property to opt out of - a chart
 * serialised on the render tick comes out empty. Nothing else animates: transform, fill and
 * stroke are applied to the transition from the values already on the DOM. The tooltip anchors
 * are positioned from the pre-transition angles and are never repositioned when the transition
 * ends, so after an update they describe the previous layout.
 *
 * Note: the component keeps no state of its own. It writes a0/a1 (the angles currently on
 * screen) and _a0/_a1 (the destination angles of the running transition) onto every datum it
 * renders, which is what lets a transition continue from the current geometry. Consequently
 * the data must be mutable - frozen data throws - two entries sharing one object collapse into
 * a single wedge, and a single NaN angle poisons the running total and every wedge after it.
 * See test/component/pie.test.ts.
 *
 * @return {sszvis.component}
 */
import { type Component } from "../d3-component.js";
/**
 * The angle bookkeeping the component keeps on each datum: a0/a1 are the angles currently
 * on screen, _a0/_a1 the destination angles of the running transition. All four are
 * optional because the caller's data does not carry them until the first render, and
 * a0/a1 can be replaced by a foreign value again by the index-based angle handover below.
 */
export interface PieAngles {
    a0?: number | null;
    a1?: number | null;
    _a0?: number;
    _a1?: number;
}
/** A datum of the caller's own shape, once the component has annotated it. */
export type PieDatum<T = PieAngles> = T & PieAngles;
/** The angle property is wrapped by fn.functor on set, so it is always a function here. */
export type AngleAccessor<T = PieAngles> = (d: PieDatum<T>) => number;
/**
 * fill and stroke accept a constant or an accessor and are not normalised on set. An
 * accessor may resolve to null or undefined to leave the attribute off, which is how d3
 * reads both, so one nullish-aware alias describes what the setters accept and what the
 * getters return.
 */
export type ColorAccessor<T = PieAngles> = (d: PieDatum<T>, i: number) => string | null | undefined;
export type ColorValue<T = PieAngles> = string | ColorAccessor<T>;
/**
 * The getters return whatever was last set, which is undefined for radius and angle until
 * the caller sets them - both are required, and rendering without them fails, so both
 * getters report the undefined the props actually hold.
 */
export interface PieComponent<T = PieAngles> extends Component {
    radius(): number | undefined;
    radius(radius: number): PieComponent<T>;
    fill(): ColorValue<T> | undefined;
    fill<U = T>(fill: ColorValue<U>): PieComponent<T>;
    stroke(): ColorValue<T> | undefined;
    stroke<U = T>(stroke: ColorValue<U>): PieComponent<T>;
    angle(): AngleAccessor<T> | undefined;
    angle<U = T>(angle: number | AngleAccessor<U>): PieComponent<T>;
}
export default function <T = PieAngles>(): PieComponent<T>;
//# sourceMappingURL=pie.d.ts.map