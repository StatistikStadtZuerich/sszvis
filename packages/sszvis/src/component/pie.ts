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

import { arc, interpolate, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { defaultTransition, OWN_TRANSITION } from "../transition.js";

/** The angles of one wedge, in radians, as d3's arc generator wants them. */
interface WedgeAngles {
  a0: number;
  a1: number;
}

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

type PieProps<T> = {
  radius: number;
  fill?: ColorValue<T>;
  stroke?: ColorValue<T>;
  angle: AngleAccessor<T>;
  transition: boolean;
};

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

/** Reports a required property the caller left unset, naming it. */
function required<V>(value: V | undefined, name: string): V {
  if (value === undefined) {
    throw new Error(`[pie] the ${name} property is required`);
  }
  return value;
}

/**
 * Turns a colour property into an accessor. A constant and an accessor returning that
 * constant are equivalent to d3, and so are an unset property and one returning null:
 * either way d3 removes the attribute.
 */
function toColorAccessor<T>(value: ColorValue<T> | undefined): (d: T, i: number) => string | null {
  // An accessor is handed to d3 untouched. Its result is narrowed from
  // `string | null | undefined` to `string | null` only because d3's own attr typings omit
  // undefined; d3 removes the attribute for either one, so the two are interchangeable here.
  return typeof value === "function"
    ? (value as (d: T, i: number) => string | null)
    : () => value ?? null;
}

// The angles currently on screen, per wedge element. d3 cannot interpolate an arc path
// directly, so a transition needs the previous angles as well as the destination ones -
// keying them to the element keeps them out of the caller's data. The map lives at module
// scope, keyed on the element rather than on the factory: the shipped examples build a
// fresh pie() inside every render (docs/pie-charts/basic.js), so a per-instance map would
// find no state for the paths already on screen and tween destination to destination.
// Keying on the element still scopes the state to the group being rendered into, and the
// entry is collected with the element.
const onScreen = new WeakMap<Element, WedgeAngles>();

export default function pie<T = unknown>(): PieComponent<T> {
  // The chain is built on the component rather than returned from it: .prop() and .render()
  // are declared to return the generic Component type, since the accessors they install
  // only exist at runtime, so the typed instance has to come from the factory itself.
  const pieComponent = component<PieComponent<T>>();

  pieComponent
    .prop("radius")
    .prop("fill")
    .prop("stroke")
    .prop("angle", fn.functor)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: T[]) {
      const selection = select<Element, T[]>(this);
      const props = selection.props<PieProps<T>>();

      // Both required properties are checked before a single element is created, so a
      // misconfigured pie leaves no half-rendered wedges or stray tooltip anchors behind.
      const radius = required(props.radius, "radius");
      const angleOf = required(props.angle, "angle");
      // The default applies only when the property was never set, so that a falsy stroke
      // reaches the DOM whether it was passed as a constant or returned from an accessor.
      const stroke = props.stroke === undefined ? "#FFFFFF" : props.stroke;
      const fillAccessor = toColorAccessor(props.fill);
      const strokeAccessor = toColorAccessor(stroke);
      const transform = `translate(${radius},${radius})`;

      // The destination layout, held alongside the data rather than written onto it.
      const layout: WedgeAngles[] = [];
      let angle = 0;
      for (const value of data) {
        const a0 = angle;
        const step = Number(angleOf(value));
        if (Number.isFinite(step)) {
          angle += step;
        } else {
          // A scale over a domain containing undefined, an empty group, or a division by a
          // zero total all land here. Skipping the step keeps the running total usable, so
          // the wedges after this one are unaffected.
          logger.warn(`[pie] the angle accessor returned ${step}; drawing a zero-width wedge`);
        }
        layout.push({ a0, a1: angle });
      }

      const arcGen = arc<WedgeAngles>()
        .innerRadius(4)
        .outerRadius(radius)
        .startAngle((d) => d.a0)
        .endAngle((d) => d.a1);

      // arc only returns null when it renders into a canvas context, which this one never does.
      const arcPath = (angles: WedgeAngles) => arcGen(angles) ?? "";

      // Matching on the component's own class rather than the generic .sszvis-path one keeps a
      // foreign path in the same group out of the join. The generic class stays on the node, so
      // no CSS selector changes meaning.
      const segments = selection
        .selectAll<SVGPathElement, T>("path.sszvis-pie-path")
        .data(data)
        .join((enter) =>
          // transform, fill and stroke are written here and then only on the transition, so
          // that they have an old value to animate away from on every later render.
          enter
            .append("path")
            .attr("class", "sszvis-path sszvis-pie-path")
            .attr("transform", transform)
            .attr("fill", fillAccessor)
            .attr("stroke", strokeAccessor)
        );

      // Geometry is applied on the render tick, from the angles already on screen - the
      // destination ones for a wedge that has just entered - so the DOM is never in a
      // geometry-less state and nothing jumps before the transition takes over.
      segments.attr("d", function (_d, i) {
        const start = onScreen.get(this) ?? layout[i];
        onScreen.set(this, start);
        return arcPath(start);
      });

      if (props.transition) {
        segments
          .transition(defaultTransition(OWN_TRANSITION))
          .attr("transform", transform)
          .attr("fill", fillAccessor)
          .attr("stroke", strokeAccessor)
          .attrTween("d", function (_d, i) {
            const from = onScreen.get(this) ?? layout[i];
            const to = layout[i];
            const a0 = interpolate(from.a0, to.a0);
            const a1 = interpolate(from.a1, to.a1);
            return (t) => {
              const current = { a0: a0(t), a1: a1(t) };
              // Recording every frame lets a render that interrupts this transition pick the
              // angles up mid-flight.
              onScreen.set(this, current);
              return arcPath(current);
            };
          });
      } else {
        // A render that turns transitions off has to stop whatever the last one started:
        // the attrTween below writes both the path and onScreen on every frame, so an
        // uninterrupted transition would overwrite these attributes after they are set.
        // Interrupted by name, so a transition the consumer scheduled on these paths keeps
        // running; only the geometry this component owns is stopped.
        segments.interrupt(OWN_TRANSITION);
        segments
          .attr("transform", transform)
          .attr("fill", fillAccessor)
          .attr("stroke", strokeAccessor)
          .attr("d", function (_d, i) {
            onScreen.set(this, layout[i]);
            return arcPath(layout[i]);
          });
      }

      const ta = tooltipAnchor<T>().position(
        // The anchors are placed from the destination angles, so they describe the layout the
        // wedges are heading for rather than the one they are leaving.
        (_d: T, i: number): [number, number] => {
          const { a0, a1 } = layout[i] ?? { a0: 0, a1: 0 };
          // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
          // makes the same correction to svg.arc() angles :o
          const a = a0 + Math.abs(a1 - a0) / 2 - Math.PI / 2;
          const r = (radius * 2) / 3;
          return [radius + Math.cos(a) * r, radius + Math.sin(a) * r];
        }
      );

      selection.datum(data).call(ta);
    });

  return pieComponent;
}
