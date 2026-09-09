/**
 * Move behavior
 *
 * The move behavior is used to add a mouseover and touchmove-based interface to a chart.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The move behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
 * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
 * functions. This component extends a d3.dispatch instance.
 *
 * @module sszvis/behavior/move
 *
 * @property {boolean} debug                      Whether or not to render the component in debug mode, which reveals its position in the chart.
 * @property {function} xScale                    The x-scale for the component. The extent of this scale, plus component padding, is the width of the
 *                                                component's active area.
 * @property {function} yScale                    The y-scale for the component. The extent of this scale, plus component padding, is the height of the
 *                                                component's active area.
 * @property {boolean} draggable                  Whether or not this component is draggable. This changes certain display properties of the component.
 * @property {object} padding                     An object which specifies padding, in pixels, added around the scale's range to widen the component's
 *                                                hit area beyond the scale itself. Defaults are all 0. The options are { top, right, bottom, left }.
 *                                                Padding only grows the active area; it does not shift the coordinate space, so a pointer in the padded
 *                                                margin inverts to a value just outside the scale's domain.
 * @property {boolean|function} cancelScrolling   A predicate function, or a constant boolean, that determines whether the browser's default scrolling
 *                                                behavior in response to a touch event should be canceled. In area charts and line charts, for example,
 *                                                you generally don't want to cancel scrolling, as this creates a scroll trap. However, in bar charts
 *                                                which use this behavior, you want to pass a predicate function here which will determine whether the touch
 *                                                event falls within the "profile" of the bar chart, and should therefore cancel scrolling and trigger an event.
 * @property {boolean} fireOnPanOnly              In response to touch events, whether to fire events only while "panning", that is only while performing
 *                                                a touch move where the default scrolling behavior is canceled, and not otherwise. In area and line charts, this
 *                                                should be false, since you want to fire events all the time, even while scrolling. In bar charts, we want to
 *                                                limit the firing of events (and therefore, the showing of tooltips) to only cases where the touch event has its
 *                                                default scrolling prevented, and the user is therefore "panning" across bars. So this should be true for bar charts.
 * @property {string and function} on             The .on() method of this component should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'start' - when the move action starts - mouseover or touchstart
 *                                                'move' - called when a 'moving' action happens - mouseover on the element
 *                                                'drag' - called when a 'dragging' action happens - mouseover with the mouse click down, or touchmove
 *                                                'end' - called when the event ends - mouseout or touchend
 *                                                Event handler functions, excepting end, are passed an x-value and a y-value, which are the data values,
 *                                                computed by inverting the provided xScale and yScale, which correspond to the screen pixel location of the event.
 *
 * @return {sszvis.component}
 */

import {
  dispatch,
  pointer,
  type ScaleBand,
  type ScaleContinuousNumeric,
  type ScalePoint,
  type ScaleTime,
  select,
} from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { rangeExtent } from "../scale.js";

// Type definitions for move behavior component
type MoveScale<T = number | string> =
  | ScaleContinuousNumeric<number, number>
  | (T extends Date ? ScaleTime<number, number> : never)
  | ScaleBand<T extends string ? T : string>
  | ScalePoint<T extends string ? T : string>;

type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type MoveProps<XDomain, YDomain> = {
  debug?: boolean;
  xScale: MoveScale<XDomain>;
  yScale: MoveScale<YDomain>;
  draggable?: boolean;
  padding: Padding;
  cancelScrolling: (x: XDomain | null, y: YDomain | null) => boolean;
  fireOnPanOnly: () => boolean;
};
type Domain = number | string;
type EventHandler = (event: Event, x: number | string | null, y: number | string | null) => void;

export interface MoveComponent<XDomain = Domain, YDomain = Domain> extends ComponentBuilder<
  MoveComponent<XDomain, YDomain>
> {
  debug(): boolean;
  debug(value: boolean): MoveComponent<XDomain, YDomain>;

  xScale(): MoveScale<XDomain>;
  xScale(scale: MoveScale<XDomain>): MoveComponent<XDomain, YDomain>;

  yScale(): MoveScale<YDomain>;
  yScale(scale: MoveScale<YDomain>): MoveComponent<XDomain, YDomain>;

  draggable(): boolean;
  draggable(value: boolean): MoveComponent<XDomain, YDomain>;

  padding(): Padding;
  padding(value: Partial<Padding>): MoveComponent<XDomain, YDomain>;

  cancelScrolling(): (x?: XDomain | null, y?: YDomain | null) => boolean;
  cancelScrolling(
    predicate: boolean | ((x: XDomain | null, y: YDomain | null) => boolean),
  ): MoveComponent<XDomain, YDomain>;

  fireOnPanOnly(): () => boolean;
  fireOnPanOnly(predicate: boolean | (() => boolean)): MoveComponent<XDomain, YDomain>;

  on(eventName: "start", handler: EventHandler): MoveComponent<XDomain, YDomain>;
  on(eventName: "move", handler: EventHandler): MoveComponent<XDomain, YDomain>;
  on(eventName: "drag", handler: EventHandler): MoveComponent<XDomain, YDomain>;
  on(eventName: "end", handler: EventHandler): MoveComponent<XDomain, YDomain>;
  on(eventName: string): EventHandler | undefined;
}

export default function move<XDomain = number | string, YDomain = number | string>(): MoveComponent<
  XDomain,
  YDomain
> {
  const event = dispatch("start", "move", "drag", "end");

  const moveComponent = component<MoveComponent<XDomain, YDomain>>()
    .prop("debug")
    .prop("xScale")
    .prop("yScale")
    .prop("draggable")
    .prop("cancelScrolling", fn.functor)
    .cancelScrolling(false)
    .prop("fireOnPanOnly", fn.functor)
    .fireOnPanOnly(false)
    .prop("padding", (p: Partial<Padding>) => {
      const defaults: Padding = { top: 0, left: 0, bottom: 0, right: 0 };
      for (const prop in p) {
        const key = prop as keyof Padding;
        if (key in defaults && p[key] !== undefined) {
          defaults[key] = p[key] as number;
        }
      }
      return defaults;
    })
    .padding({})
    .render(function (this: SVGElement) {
      const selection = select(this);
      const props = selection.props<MoveProps<XDomain, YDomain>>();

      // Already sorted, smaller value first, so a descending y scale still yields a rect that
      // grows downwards from its top edge.
      const xExtent = rangeExtent(props.xScale);
      const yExtent = rangeExtent(props.yScale);

      xExtent[0] -= props.padding.left;
      xExtent[1] += props.padding.right;
      yExtent[0] -= props.padding.top;
      yExtent[1] += props.padding.bottom;

      // The rect below is positioned at the start of the padded range, so its `x`/`y`
      // attributes carry the offset between the rect's own box and the coordinate space the
      // scales are defined over. Both input paths resolve through `pointer()`, which inverts
      // the rect's screen CTM and therefore ignores a rect's `x`/`y` geometry: positions
      // arrive already in scale space, in the same user-space units the scales use, and
      // `scaleInvert` and the band/point inverters read `scale.range()` directly.

      const layer = selection
        .selectAll("[data-sszvis-behavior-move]")
        .data([0])
        .join("rect")
        .attr("data-sszvis-behavior-move", "")
        .attr("class", "sszvis-interactive");

      if (props.draggable) {
        layer.classed("sszvis-interactive--draggable", true);
      }

      layer
        .attr("x", xExtent[0])
        .attr("y", yExtent[0])
        .attr("width", xExtent[1] - xExtent[0])
        .attr("height", yExtent[1] - yExtent[0])
        .attr("fill", "transparent")
        .on("mouseover", function (...args) {
          if (this) event.apply("start", this, args);
        })
        .on("mousedown", function (...args) {
          const target = this as SVGRectElement & { __dragging__?: boolean };
          const doc = select(document);
          const win = select(window);

          const startDragging = () => {
            target.__dragging__ = true;
          };

          const stopDragging = () => {
            target.__dragging__ = false;
            win.on("mousemove.sszvis-behavior-move", null);
            doc.on("mouseout.sszvis-behavior-move", null);
            if (target) event.apply("end", target, args);
          };

          win.on("mouseup.sszvis-behavior-move", stopDragging);
          doc.on("mouseout.sszvis-behavior-move", () => {
            // toElement is a legacy, non-standard alias for relatedTarget and is not in
            // the DOM types; read it reflectively rather than restating the event's type.
            const legacyToElement = Reflect.get(args[0] as object, "toElement");
            const from =
              (args[0].relatedTarget as Element | null) ||
              (legacyToElement instanceof Element ? legacyToElement : null);
            if (!from || from.nodeName === "HTML") {
              stopDragging();
            }
          });

          startDragging();
        })
        .on("mousemove", function (e) {
          const target = this as SVGRectElement & { __dragging__?: boolean };
          if (!target) return;

          // Skip touch-originated mouse events on devices that support both
          // This check helps avoid duplicate event handling on touch devices
          const sourceCapabilities = (
            e as MouseEvent & {
              sourceCapabilities?: { firesTouchEvents?: boolean };
            }
          ).sourceCapabilities;
          if (sourceCapabilities?.firesTouchEvents) return;

          let xy: [number, number];
          try {
            xy = pointer(e) as [number, number];
          } catch {
            // Silently fail on invalid events (e.g., when pointer() throws due to invalid coordinates)
            return;
          }

          // Validate coordinates are finite numbers
          if (!Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return;

          const x = scaleInvert(props.xScale, xy[0]);
          const y = scaleInvert(props.yScale, xy[1]);

          if (target.__dragging__) {
            event.apply("drag", target, [e, x, y]);
          } else {
            event.apply("move", target, [e, x, y]);
          }
        })
        .on("mouseout", function (...args) {
          if (this) event.apply("end", this, args);
        })
        .on("touchstart", function (e) {
          const target = this as SVGRectElement;
          if (!target) return;

          // Extract touch coordinates manually for Safari mobile compatibility.
          // On Safari mobile, TouchEvent objects don't have clientX/clientY properties -
          // those are on the Touch object inside event.touches[0]. D3's pointer() function
          // expects clientX/clientY on the event itself, causing it to return NaN on Safari.
          const touch = fn.firstTouch(e);
          if (!touch) return;

          // Validate coordinates exist and are finite
          if (
            typeof touch.clientX !== "number" ||
            !Number.isFinite(touch.clientX) ||
            typeof touch.clientY !== "number" ||
            !Number.isFinite(touch.clientY)
          ) {
            return;
          }

          // Resolve through the extracted `Touch`, not the event: `pointer()` only needs
          // clientX/clientY on its source, and inverting the rect's screen CTM keeps touch in
          // the same user-space units as the mouse path under a scaled ancestor.
          const xy = pointer(touch, target) as [number, number];

          const x = scaleInvert(props.xScale, xy[0]);
          const y = scaleInvert(props.yScale, xy[1]);

          const cancelScrolling = props.cancelScrolling(x, y);

          if (cancelScrolling) {
            e.preventDefault();
          }

          // if fireOnPanOnly => cancelScrolling must be true
          // if !fireOnPanOnly => always fire events
          // This is in place because this behavior needs to only fire
          // events on a successful "pan" action in the bar charts, i.e.
          // only when scrolling is prevented, but then it also needs to fire
          // events all the time in the line and area charts, i.e. allow
          // scrolling to continue as normal but also fire events.
          // To configure the chart for use in the bar charts, you need
          // to configure a cancelScrolling function for determining when to
          // cancel scrolling, i.e. what constitutes a "pan" event, and also
          // pass fireOnPanOnly = true, which flips this switch and relies on
          // cancelScrolling to determine whether to fire the events.
          if (!props.fireOnPanOnly() || cancelScrolling) {
            event.apply("start", target, [e, x, y]);
            event.apply("drag", target, [e, x, y]);
            event.apply("move", target, [e, x, y]);

            const pan = (panEvent: TouchEvent) => {
              // Extract touch from the new touchmove event, not the original touchstart event
              const panTouch = fn.firstTouch(panEvent);
              if (!panTouch) return;

              // Validate coordinates
              if (
                typeof panTouch.clientX !== "number" ||
                !Number.isFinite(panTouch.clientX) ||
                typeof panTouch.clientY !== "number" ||
                !Number.isFinite(panTouch.clientY)
              ) {
                return;
              }

              const panXY = pointer(panTouch, target) as [number, number];

              const panX = scaleInvert(props.xScale, panXY[0]);
              const panY = scaleInvert(props.yScale, panXY[1]);

              const panCancelScrolling = props.cancelScrolling(panX, panY);

              if (panCancelScrolling) {
                panEvent.preventDefault();
              }

              // See comment above about the same if condition.
              if (!props.fireOnPanOnly() || panCancelScrolling) {
                event.apply("drag", target, [panEvent, panX, panY]);
                event.apply("move", target, [panEvent, panX, panY]);
              } else {
                event.apply("end", target, [panEvent]);
              }
            };

            const end = (endEvent: TouchEvent) => {
              event.apply("end", target, [endEvent]);
              select(target).on("touchmove", null).on("touchend", null);
            };

            select(target).on("touchmove", pan).on("touchend", end);
          }
        });

      if (props.debug) {
        layer.attr("fill", "rgba(255,0,0,0.2)");
      }
    });

  // d3-dispatch's `on` is variadic over typenames, so the args tuple types the handler
  // callback to never. Narrowing to the four event names would type the callback properly but
  // would also reject the namespaced typenames d3 accepts at runtime, such as "move.tooltip".
  moveComponent.on = ((...args: [string, never]) => {
    const value = event.on.apply(event, args);
    return value === event ? moveComponent : value;
  }) as MoveComponent<XDomain, YDomain>["on"];

  return moveComponent;
}

function scaleInvert<T>(scale: MoveScale<T>, px: number): T | null {
  if ("invert" in scale) {
    return scale.invert(px) as T;
  } else if ("paddingInner" in scale) {
    return invertBandScale(scale, px) as T | null;
  } else {
    return invertPointScale(scale, px) as T | null;
  }
}

function invertBandScale<T extends string>(scale: ScaleBand<T>, px: number): T | null {
  const step = scale.step();
  const paddingOuter = scale.paddingOuter() * step;
  const paddingInner = scale.paddingInner() * step;
  const bandWidth = scale.bandwidth();
  const scaleRange = scale.range();
  const domain = scale.domain();

  if (domain.length === 1) {
    if (scaleRange[0] <= px && scaleRange[1] >= px) {
      return domain[0];
    }
    return null;
  }

  const ranges = domain.map((_d, i) => {
    if (i === 0) {
      return [scaleRange[0], scaleRange[0] + paddingOuter + bandWidth + paddingInner / 2];
    } else if (i === domain.length - 1) {
      return [scaleRange[1] - (paddingOuter + bandWidth + paddingInner / 2), scaleRange[1]];
    } else {
      return [
        scaleRange[0] + paddingOuter + i * step - paddingInner / 2,
        scaleRange[0] + paddingOuter + (i + 1) * step - paddingInner / 2,
      ];
    }
  });
  for (let i = 0, l = ranges.length; i < l; i++) {
    if (ranges[i][0] < px && px <= ranges[i][1]) {
      return domain[i];
    }
  }
  return null;
}

function invertPointScale<T extends string>(scale: ScalePoint<T>, px: number): T | null {
  const step = scale.step();
  const paddingOuter = scale.padding() * step;
  const scaleRange = scale.range();
  const domain = scale.domain();

  if (domain.length === 1) {
    if (scaleRange[0] <= px && scaleRange[1] >= px) {
      return domain[0];
    }
    return null;
  }

  const ranges = domain.map((_d, i) => {
    if (i === 0) {
      return [scaleRange[0], scaleRange[0] + paddingOuter + step / 2];
    } else if (i === domain.length - 1) {
      return [scaleRange[1] - (paddingOuter + step / 2), scaleRange[1]];
    } else {
      return [
        scaleRange[0] + paddingOuter + i * step - step / 2,
        scaleRange[0] + paddingOuter + i * step + step / 2,
      ];
    }
  });
  for (let i = 0, l = ranges.length; i < l; i++) {
    if (ranges[i][0] < px && px <= ranges[i][1]) {
      return domain[i];
    }
  }
  return null;
}
