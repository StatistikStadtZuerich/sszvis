/**
 * Panning behavior
 *
 * This behavior is used for adding "panning" functionality to a set of chart elements.
 * The "panning" functionality refers to a combination of mouseover and touch responsiveness,
 * where on a mouse interaction an event is fired on hover, but the touch interaction is more
 * complex. The idea is to sort of imitate the way a hover interaction works, but with only a
 * finger. When a user starts a touch on an element which has this behavior enabled, the
 * default scrolling behavior of the browser will be canceled. The user can then move
 * their finger across the surface of the screen, onto other elements, and the scroll
 * will be canceled. When the finger moves onto other elements with this behavior attached,
 * the event will be fired. Meanwhile, if the user starts the interaction somewhere outside
 * an element, the scroll will happen as usual, and if they move onto an activated element,
 * no event will be fired and the scrolling will continue.
 *
 * This behavior is applied to all the children of a selection which match the elementSelector
 * property. Event listeners are attached to each of the child elements. The elementSelector
 * property is necessary to know which elements to attach to (and therefore to also avoid
 * attaching event listeners to elements which shouldn't be interaction-active).
 *
 * @module sszvis/behavior/panning
 *
 * @property {String} elementSelector    This should be a string selector that matches child
 *                                       elements of the selection on which this component
 *                                       is rendered using the .call(component) pattern. All
 *                                       child elements will have the panning event listeners
 *                                       attached to them.
 * @property {String, Function} on       The .on() method should specify an event name and a handler
 *                                       function for that event. The supported events are:
 *                                       'start' - when the interaction starts on an element.
 *                                       'pan' - when the user pans on the same element or onto another
 *                                       element (note, no 'start' event will be fired when the user
 *                                       pans with a touch from one element onto another, since this
 *                                       behavior is too difficult to test for and emulate).
 *                                       'end' - when the interaction with an element ends.
 *
 * @return {d3.component}
 */

import { dispatch, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { datumFromPanEvent } from "./util";

// Type definitions for panning behavior component
type PanningProps = {
  elementSelector: string;
};

type PanEventHandler = (event: Event, ...args: unknown[]) => void;

interface PanningComponent extends Component {
  elementSelector(): string;
  elementSelector(selector: string): PanningComponent;

  on(eventName: "start", handler: PanEventHandler): PanningComponent;
  on(eventName: "pan", handler: PanEventHandler): PanningComponent;
  on(eventName: "end", handler: PanEventHandler): PanningComponent;
  on(eventName: string): PanEventHandler | undefined;
}

export default function (): PanningComponent {
  const event = dispatch("start", "pan", "end");

  const panningComponent = component()
    .prop("elementSelector")
    .render(function (this: SVGElement) {
      const selection = select(this);
      const props = selection.props<PanningProps>();

      const elements = selection.selectAll(props.elementSelector);

      elements
        .attr("data-sszvis-behavior-pannable", "")
        .classed("sszvis-interactive", true)
        .on("mouseenter", function (e: MouseEvent) {
          if (this) event.apply("start", this, [e]);
        })
        .on("mousemove", function (e: MouseEvent) {
          if (this) event.apply("pan", this, [e]);
        })
        .on("mouseleave", function (e: MouseEvent) {
          if (this) event.apply("end", this, [e]);
        })
        .on("touchstart", function (e: TouchEvent) {
          e.preventDefault();
          if (this) event.apply("start", this, [e]);
        })
        .on("touchmove", function (e: TouchEvent) {
          e.preventDefault();
          const datum = datumFromPanEvent(fn.firstTouch(e));
          if (datum === null) {
            if (this) event.apply("end", this, [e]);
          } else {
            if (this) event.apply("pan", this, [e]);
          }
        })
        .on("touchend", function (e: TouchEvent) {
          if (this) event.apply("end", this, [e]);
        });
    });

  panningComponent.on = function (this: PanningComponent, ...args: [string, never]) {
    const value = event.on.apply(event, args);
    return value === event ? panningComponent : value;
  };

  return panningComponent as PanningComponent;
}
