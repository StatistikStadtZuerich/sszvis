/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * @module sszvis/component/dot
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

/**
 * x and y are wrapped by fn.functor on set, so they are always stored as functions by the
 * time the renderer reads them. The parameters are variadic because d3 calls them with
 * the datum, the index and the group.
 */
type ValueAccessor<T> = (...args: unknown[]) => T;

/**
 * radius, stroke and fill are declared without fn.functor, so they are stored exactly as
 * they were set: either a constant or an accessor. An accessor that resolves to nothing
 * is typed as returning null, which is how d3 reads both null and undefined - either way
 * it removes the attribute.
 */
type RawValue<T> = T | ValueAccessor<T | null>;

type DotProps = {
  x: ValueAccessor<number>;
  y: ValueAccessor<number>;
  radius?: RawValue<number>;
  stroke?: RawValue<string>;
  fill?: RawValue<string>;
  transition: boolean;
};

/**
 * A constant or an accessor; either is accepted for every visual property.
 * The parameters are `never[]` so that an accessor with any signature is assignable -
 * `unknown[]` would reject a typed accessor like (d: Datum) => number.
 */
type DotValue<R> = R | ((...args: never[]) => R);

export interface DotComponent extends Component {
  x(): ValueAccessor<number>;
  x(value: DotValue<number>): DotComponent;
  y(): ValueAccessor<number>;
  y(value: DotValue<number>): DotComponent;
  radius(): RawValue<number> | undefined;
  radius(value: DotValue<number>): DotComponent;
  stroke(): RawValue<string> | undefined;
  stroke(value: DotValue<string | undefined>): DotComponent;
  fill(): RawValue<string> | undefined;
  fill(value: DotValue<string | undefined>): DotComponent;
  transition(): boolean;
  transition(enabled: boolean): DotComponent;
}

/**
 * Normalises a property that was stored without fn.functor into an accessor, so that the
 * renderer has a single shape to hand to d3. An accessor is passed through untouched, so
 * it still receives d3's arguments and node context. The stored value itself is never
 * modified, which is what keeps the getters returning whatever was set.
 */
function toAccessor<T extends string | number>(
  value: RawValue<T> | undefined
): ValueAccessor<T | null> {
  return typeof value === "function" ? value : () => value ?? null;
}

export default function (): DotComponent {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("radius")
    .prop("stroke")
    .prop("fill")
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: unknown[]) {
      const selection = select(this);
      const props = selection.props<DotProps>();

      const radius = toAccessor(props.radius);
      const stroke = toAccessor(props.stroke);
      const fill = toAccessor(props.fill);

      const dots = selection
        .selectAll(".sszvis-circle")
        .data(data)
        .join("circle")
        .classed("sszvis-circle", true)
        .attr("cx", props.x)
        .attr("cy", props.y)
        .attr("r", radius)
        .attr("stroke", stroke)
        .attr("fill", fill);

      if (props.transition) {
        dots
          .transition(defaultTransition())
          .attr("cx", props.x)
          .attr("cy", props.y)
          .attr("r", radius);
      } else {
        dots.attr("cx", props.x).attr("cy", props.y).attr("r", radius);
      }

      // Tooltip anchors

      const ta = tooltipAnchor().position((d: unknown): [number, number] => [
        props.x(d),
        props.y(d),
      ]);

      selection.call(ta);
    });
}
