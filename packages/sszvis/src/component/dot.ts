/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single circle. The x-position, y-position and radius are extracted from the
 * data objects using accessor functions, as are the fill and stroke colors. Every property may also
 * be specified as a constant. One tooltip anchor is rendered per datum, as an invisible 1x1 rect at
 * the center of the circle.
 *
 * @module sszvis/component/dot
 *
 * @template T The type of the data values bound to the dots
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots,
 *                                              in pixels. Becomes a functor. Required: leaving it unset throws
 *                                              before anything is rendered.
 * @property {number, function} y               An accessor function or number for the y-position of the dots,
 *                                              in pixels. Becomes a functor. Required, like x.
 * @property {number, function} radius          An accessor function or number for the radius of the dots, in
 *                                              pixels. Becomes a functor. Required, like x and y - an unwritten
 *                                              r attribute would default to 0 and render a full set of
 *                                              invisible dots. A radius of 0 is still explicitly allowed, and
 *                                              is how docs/scatterplot-over-time hides dots outside the
 *                                              selected period.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 *                                              Becomes a functor. When unset, no stroke attribute is written
 *                                              and the circles fall back to the SVG and CSS defaults.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *                                              Same as stroke.
 * @property {boolean} transition               Whether or not to transition the geometry of the dot component
 *                                              when it changes. Defaults to true, and eases over 300ms.
 *
 * Note: the geometry accessors are guarded, in the same spirit as bar's guard: cx, cy and r must be
 * finite numbers, so NaN - the usual result of feeding a scale a value outside its domain - along
 * with Infinity, undefined, null and anything that does not coerce to a finite number all become 0.
 * A negative radius is clamped to 0, since a negative r is an SVG error and would drop the circle
 * altogether. The guard means a bad value parks one dot at the origin rather than removing it
 * silently. fill and stroke are not guarded; an accessor may return null or undefined there to leave
 * the attribute off.
 *
 * Note: entering dots receive their geometry on the join, before the transition starts, so they
 * appear in place rather than animating in from nothing. Only updates animate. fill and stroke are
 * deliberately not transitioned - a colour change jumps - because the colour scales these charts
 * use are categorical and interpolating between two category colours reads as a third category.
 *
 * Note: x, y and radius are read twice per datum on every render - once for the circle and once for
 * the tooltip anchor - plus a third time when transitioning, so accessors should be cheap and free
 * of side effects. The anchor ignores the radius, and is created and positioned even for a dot
 * hidden with radius 0, which leaves a live tooltip target on an invisible dot. See
 * test/component/dot.test.ts.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { toFinite } from "../svgUtils/toFinite.js";
import { defaultTransition, OWN_TRANSITION } from "../transition.js";

/**
 * An accessor as d3 calls it, with the datum and its index. Declaring fewer parameters is
 * fine, so `(d) => d.x` and `(_d, i) => i * 10` are both assignable.
 */
type ValueAccessor<T, R> = (datum: T, index: number) => R;

/**
 * How an accessor reads back once it is stored. Both parameters are optional because a
 * constant handed to any of these properties becomes a functor that ignores its arguments.
 * One of these is still assignable to a setter, so a value read from a getter can be handed
 * straight back.
 */
type StoredAccessor<T, R> = (datum?: T, index?: number) => R;

/**
 * A constant or an accessor; either is accepted for every visual property, since every one
 * of them is wrapped by fn.functor on set.
 */
type DotValue<T, R> = R | ValueAccessor<T, R>;

/** A colour accessor may resolve to nothing, which leaves the attribute off. */
type ColorValue<T> = DotValue<T, string | null | undefined>;

type DotProps<T> = {
  x: StoredAccessor<T, number> | undefined;
  y: StoredAccessor<T, number> | undefined;
  radius: StoredAccessor<T, number> | undefined;
  stroke?: StoredAccessor<T, string | null | undefined>;
  fill?: StoredAccessor<T, string | null | undefined>;
  transition: boolean;
};

export interface DotComponent<T = unknown> extends ComponentBuilder<DotComponent<T>> {
  // x, y and radius have no default: required() runs at render time, so the getter is
  // undefined until the caller sets one. The type says so rather than letting an unset
  // property be called without narrowing.
  x(): StoredAccessor<T, number> | undefined;
  x<U = T>(value: DotValue<U, number>): DotComponent<T>;
  y(): StoredAccessor<T, number> | undefined;
  y<U = T>(value: DotValue<U, number>): DotComponent<T>;
  radius(): StoredAccessor<T, number> | undefined;
  radius<U = T>(value: DotValue<U, number>): DotComponent<T>;
  stroke(): StoredAccessor<T, string | null | undefined> | undefined;
  stroke<U = T>(value: ColorValue<U>): DotComponent<T>;
  fill(): StoredAccessor<T, string | null | undefined> | undefined;
  fill<U = T>(value: ColorValue<U>): DotComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): DotComponent<T>;
}

/**
 * Reports a required property the caller left unset, naming both the component and the
 * property. Called before the data join, so a failed configuration leaves no half-rendered
 * circles or anchors behind, and fails on the first render rather than on the first render
 * that happens to have data.
 */
function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`[dot] the ${name} property is required`);
  }
  return value;
}

export default function dot<T = unknown>(): DotComponent<T> {
  return component<DotComponent<T>>()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("radius", fn.functor)
    .prop("stroke", fn.functor)
    .prop("fill", fn.functor)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: T[]) {
      const selection = select(this);
      const props = selection.props<DotProps<T>>();

      const xProp = required(props.x, "x");
      const yProp = required(props.y, "y");
      const radiusProp = required(props.radius, "radius");

      const xAt = (datum: T, index: number) => toFinite(xProp(datum, index));
      const yAt = (datum: T, index: number) => toFinite(yProp(datum, index));
      // A negative r is invalid per the SVG spec and drops the circle, so it is clamped
      // rather than passed on.
      const rAt = (datum: T, index: number) => Math.max(0, toFinite(radiusProp(datum, index)));
      const strokeAt = (datum: T, index: number) => props.stroke?.(datum, index) ?? null;
      const fillAt = (datum: T, index: number) => props.fill?.(datum, index) ?? null;

      // Entering circles are given their geometry on the join, so they are in place before
      // any transition starts. The geometry is then applied exactly once more - to the
      // transition when there is one, and to the plain selection otherwise - so an update
      // tweens from its previous value instead of from the value it already holds.
      const dots = selection
        .selectAll<SVGCircleElement, T>(".sszvis-circle")
        .data(data)
        .join((enter) =>
          enter
            .append("circle")
            .classed("sszvis-circle", true)
            .attr("cx", xAt)
            .attr("cy", yAt)
            .attr("r", rAt),
        )
        .attr("stroke", strokeAt)
        .attr("fill", fillAt);

      if (props.transition) {
        dots
          .transition(defaultTransition(OWN_TRANSITION))
          .attr("cx", xAt)
          .attr("cy", yAt)
          .attr("r", rAt);
      } else {
        // A transition scheduled by an earlier render would keep ticking and overwrite the
        // geometry written here, so `transition(false)` is only deterministic once any
        // in-flight tween is interrupted. Interrupted by name, so a transition the consumer
        // scheduled on these circles keeps running.
        dots.interrupt(OWN_TRANSITION).attr("cx", xAt).attr("cy", yAt).attr("r", rAt);
      }

      // Tooltip anchors

      const anchorPosition = (datum: T, index: number): [number, number] => [
        xAt(datum, index),
        yAt(datum, index),
      ];

      const ta = tooltipAnchor<T>().position(anchorPosition);

      selection.call(ta);
    });
}
