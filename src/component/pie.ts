/**
 * Pie component
 *
 * The pie component is used to draw pie charts. It uses the d3.arc() generator
 * to create pie wedges.
 *
 * THe input data should be an array of data values, where each data value represents one wedge in the pie.
 *
 * @module sszvis/component/pie
 *
 * @property {number} radius                  The radius of the pie chart (no default)
 * @property {string, function} fill          a fill color for wedges in the pie (default black). Ideally a function
 *                                            which takes a data value.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default none)
 * @property {string, function} angle         specifys the angle of the wedges in radians. Theoretically this could be
 *                                            a constant, but that would make for a very strange pie. Ideally, this
 *                                            is a function which takes a data value and returns the angle in radians.
 *
 * @return {sszvis.component}
 */

import { arc, interpolate, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

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

type PieProps<T> = {
  radius: number;
  fill?: ColorValue<T>;
  stroke?: ColorValue<T>;
  angle: AngleAccessor<T>;
};

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

/**
 * Turns a colour property into an accessor. A constant and an accessor returning that
 * constant are equivalent to d3, and so are an unset property and one returning null:
 * either way d3 removes the attribute.
 */
function toColorAccessor<T>(
  value: ColorValue<T> | undefined
): (d: PieDatum<T>, i: number) => string | null {
  // An accessor is handed to d3 untouched. Its result is narrowed from
  // `string | null | undefined` to `string | null` only because d3's own attr typings omit
  // undefined; d3 removes the attribute for either one, so the two are interchangeable here.
  return typeof value === "function"
    ? (value as (d: PieDatum<T>, i: number) => string | null)
    : () => value ?? null;
}

export default function <T = PieAngles>(): PieComponent<T> {
  // The chain is built on the component rather than returned from it: .prop() and .render()
  // are declared to return the generic Component type, since the accessors they install
  // only exist at runtime, so the typed instance has to come from the factory itself.
  const pieComponent = component<PieComponent<T>>();

  pieComponent
    .prop("radius")
    .prop("fill")
    .prop("stroke")
    .prop("angle", fn.functor)
    .render(function (this: Element, data: PieDatum<T>[]) {
      const selection = select(this);
      const props = selection.props<PieProps<T>>();

      const stroke = props.stroke || "#FFFFFF";

      let angle = 0;
      for (const value of data) {
        // In order for an angle transition to work correctly in d3, the transition must be done in data space.
        // The computed arc path itself cannot be interpolated without error.
        // see http://bl.ocks.org/mbostock/5100636 for a straightforward example.
        // However, due to the structure of sszvis and the way d3 data joining works, this poses a bit of a challenge,
        // since old and new data values could be on different objects, and they need to be merged.
        // In the code that follows, value._a0 and value._a1 are the destination angles for the transition.
        // value.a0 and value.a1 are the current values in the transition (either the initial value, some intermediate value, or the final angle value).
        value._a0 = angle;
        // These a0 and a1 values may be overwritten later if there is already data bound at this data index. (see the .each function further down).
        // `== null` and Number.isNaN(Number(...)) reproduce the original `== undefined ||
        // isNaN(...)` checks exactly: both catch null, undefined and NaN.
        if (value.a0 == null || Number.isNaN(Number(value.a0))) value.a0 = angle;
        angle += props.angle(value);
        value._a1 = angle;
        // data values which don't already have angles set start out at the complete value.
        if (value.a1 == null || Number.isNaN(Number(value.a1))) value.a1 = angle;
      }

      // Every angle read below goes through Number(), which is the coercion d3 used to
      // apply on its own when these values were passed to it untyped: undefined becomes
      // NaN and null becomes 0. Both are reachable, since the handover further down can
      // put a foreign value back on a0/a1 after the loop has normalised it.
      const arcGen = arc<PieDatum<T>>()
        .innerRadius(4)
        .outerRadius(props.radius)
        .startAngle((d) => Number(d.a0))
        .endAngle((d) => Number(d.a1));

      const segments = selection
        .selectAll<SVGPathElement, PieDatum<T>>(".sszvis-path")
        .each((d, i) => {
          // This matches the data values iteratively in the same way d3 will when it does the data join.
          // This is kind of a hack, but it's the only way to get any existing angle values from the already-bound data
          if (data[i]) {
            data[i].a0 = d.a0;
            data[i].a1 = d.a1;
          }
        })
        .data(data)
        .join("path")
        .classed("sszvis-path", true)
        .attr("transform", `translate(${props.radius},${props.radius})`)
        .attr("fill", toColorAccessor(props.fill))
        .attr("stroke", toColorAccessor(stroke));

      segments
        .transition(defaultTransition())
        .attr("transform", `translate(${props.radius},${props.radius})`)
        .attrTween("d", (d) => {
          const angle0Interp = interpolate(Number(d.a0), Number(d._a0));
          const angle1Interp = interpolate(Number(d.a1), Number(d._a1));
          return (t) => {
            d.a0 = angle0Interp(t);
            d.a1 = angle1Interp(t);
            // arc only returns null when it renders into a canvas context, which this one
            // never does.
            return arcGen(d) ?? "";
          };
        })
        .attr("fill", toColorAccessor(props.fill))
        .attr("stroke", toColorAccessor(stroke));

      const ta = tooltipAnchor<PieDatum<T>>().position((d): [number, number] => {
        const a0 = Number(d.a0);
        const a1 = Number(d.a1);
        // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
        // makes the same correction to svg.arc() angles :o
        const a = a0 + Math.abs(a1 - a0) / 2 - Math.PI / 2;
        const r = (props.radius * 2) / 3;
        return [props.radius + Math.cos(a) * r, props.radius + Math.sin(a) * r];
      });

      selection.datum(data).call(ta);
    });

  return pieComponent;
}
