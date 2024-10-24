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
 * @property {object} padding                     An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
 *                                                The options are { top, right, bottom, left }
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

import { select, pointer, dispatch, ascending } from "d3";

import * as fn from "../fn.js";
import { range } from "../scale.js";
import { component } from "../d3-component.js";

export default function () {
  const event = dispatch("start", "move", "drag", "end");

  const moveComponent = component()
    .prop("debug")
    .prop("xScale")
    .prop("yScale")
    .prop("draggable")
    .prop("cancelScrolling", fn.functor)
    .cancelScrolling(false)
    .prop("fireOnPanOnly", fn.functor)
    .fireOnPanOnly(false)
    .prop("padding", (p) => {
      const defaults = { top: 0, left: 0, bottom: 0, right: 0 };
      for (const prop in p) {
        defaults[prop] = p[prop];
      }
      return defaults;
    })
    .padding({})
    .render(function () {
      const selection = select(this);
      const props = selection.props();

      const xExtent = range(props.xScale).sort(ascending);
      const yExtent = range(props.yScale).sort(ascending);

      xExtent[0] -= props.padding.left;
      xExtent[1] += props.padding.right;
      yExtent[0] -= props.padding.top;
      yExtent[1] += props.padding.bottom;

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
        .on("mouseover", function () {
          event.apply("start", this, arguments);
        })
        .on("mousedown", function (e) {
          const target = this;
          const doc = select(document);
          const win = select(window);

          const startDragging = function () {
            target.__dragging__ = true;
          };

          const stopDragging = function () {
            target.__dragging__ = false;
            win.on("mousemove.sszvis-behavior-move", null);
            doc.on("mouseout.sszvis-behavior-move", null);
            event.apply("end", this, arguments);
          };

          win.on("mouseup.sszvis-behavior-move", stopDragging);
          doc.on("mouseout.sszvis-behavior-move", () => {
            const from = e.relatedTarget || e.toElement;
            if (!from || from.nodeName === "HTML") {
              stopDragging();
            }
          });

          startDragging();
        })
        .on("mousemove", function (e) {
          const target = this;
          const xy = pointer(e);
          const x = scaleInvert(props.xScale, xy[0]);
          const y = scaleInvert(props.yScale, xy[1]);

          if (target.__dragging__) {
            event.apply("drag", this, [e, x, y]);
          } else {
            event.apply("move", this, [e, x, y]);
          }
        })
        .on("mouseout", function (e) {
          event.apply("end", this, [e]);
        })
        .on("touchstart", function (e) {
          const xy = fn.first(pointer(e));
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
            event.apply("start", this, [e, x, y]);
            event.apply("drag", this, [e, x, y]);
            event.apply("move", this, [e, x, y]);

            const pan = function () {
              const panXY = fn.first(pointer(e));
              const panX = scaleInvert(props.xScale, panXY[0]);
              const panY = scaleInvert(props.yScale, panXY[1]);

              const panCancelScrolling = props.cancelScrolling(panX, panY);

              if (panCancelScrolling) {
                e.preventDefault();
              }

              // See comment above about the same if condition.
              if (!props.fireOnPanOnly() || panCancelScrolling) {
                event.apply("drag", this, [e, panX, panY]);
                event.apply("move", this, [e, panX, panY]);
              } else {
                event.apply("end", this, [e]);
              }
            };

            const end = function () {
              event.apply("end", this, [e]);
              select(this).on("touchmove", null).on("touchend", null);
            };

            select(this).on("touchmove", pan).on("touchend", end);
          }
        });

      if (props.debug) {
        layer.attr("fill", "rgba(255,0,0,0.2)");
      }
    });

  moveComponent.on = function () {
    const value = event.on.apply(event, arguments);
    return value === event ? moveComponent : value;
  };

  return moveComponent;
}

function scaleInvert(scale, px) {
  const scaleType = scale.invert ? "Linear" : scale.paddingInner ? "Band" : "Point";
  switch (scaleType) {
    case "Linear": {
      return scale.invert(px);
    }
    case "Band": {
      return invertBandScale(scale, px);
    }
    case "Point": {
      return invertPointScale(scale, px);
    }
    default: {
      throw new Error("Unknown scale type, could not invert");
    }
  }
}

function invertBandScale(scale, px) {
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

  const ranges = domain.map((d, i) => {
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

function invertPointScale(scale, px) {
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

  const ranges = domain.map((d, i) => {
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
