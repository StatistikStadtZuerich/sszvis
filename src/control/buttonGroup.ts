/**
 * Button Group control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.select).
 *
 * @module sszvis/control/buttonGroup
 *
 * @property {array} values         an array of values which are the options available in the control.
 *                                  Each one will become a button. Required - there is no default.
 * @property {string|number} current the current value of the button group. Should be one of the
 *                                  options passed to .values(). Compared with ===.
 * @property {number} width         The total width of the button group, divided evenly between the
 *                                  options. (default: 300px)
 * @property {function} change      A callback/event handler function called as (event, value) when
 *                                  the user clicks on a value. Note that clicking on a value does not
 *                                  necessarily change any state unless this callback function does
 *                                  something. (default: fn.identity, which returns the event and
 *                                  silently discards the value)
 *
 * Note: both optionSelectable controls join their wrapper element on the
 * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
 * into a container that already holds the other replaces the other's DOM. This is what makes them
 * interchangeable. They do not accept quite the same values, though: this control labels its buttons
 * through d3's text coercion and so takes numbers as well as strings, while the select control
 * trims its labels and therefore requires strings.
 *
 * Note: each button gets exactly `width / values.length` pixels, written out unrounded. Labels are
 * never measured or trimmed, so a label wider than its button simply overflows - keep labels short.
 *
 * Note: the buttons are plain divs with a click handler. They carry no role, tabindex or pressed
 * state, so the control cannot be operated by keyboard.
 *
 * Note: `values` has no default, so rendering before the data is available throws while computing
 * the button width - before any DOM is created, so no partial control is left behind.
 *
 * See test/control/buttonGroup.test.ts.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";

/**
 * Typed as `Event` rather than `MouseEvent` so that a handler is assignable to both
 * optionSelectable controls, which are documented as interchangeable.
 */
export type ButtonGroupChangeHandler<T> = (event: Event, value: T) => void;

type ButtonGroupProps<T> = {
  values: T[];
  current: T;
  width: number;
  change: ButtonGroupChangeHandler<T>;
};

export interface ButtonGroupComponent<T extends string | number = string | number>
  extends Component {
  values(): T[];
  values(values: T[]): ButtonGroupComponent<T>;
  current(): T;
  current(current: T): ButtonGroupComponent<T>;
  width(): number;
  width(width: number): ButtonGroupComponent<T>;
  change(): ButtonGroupChangeHandler<T>;
  change(handler: ButtonGroupChangeHandler<T>): ButtonGroupComponent<T>;
}

export default function buttonGroup<
  T extends string | number = string | number,
>(): ButtonGroupComponent<T> {
  return component()
    .prop("values")
    .prop("current")
    .prop("width")
    .width(300)
    .prop("change")
    .change(fn.identity)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<ButtonGroupProps<T>>();

      const buttonWidth = props.width / props.values.length;

      const container = selection
        .selectAll<HTMLDivElement, string>(".sszvis-control-optionSelectable")
        .data(["sszvis-control-buttonGroup"], (d) => d)
        .join("div")
        .classed("sszvis-control-optionSelectable", true)
        .classed("sszvis-control-buttonGroup", true);

      container.style("width", `${props.width}px`);

      const buttons = container
        .selectAll<HTMLDivElement, T>(".sszvis-control-buttonGroup__item")
        .data(props.values)
        .join("div")
        .classed("sszvis-control-buttonGroup__item", true);

      buttons
        .style("width", `${buttonWidth}px`)
        .classed("selected", (d) => d === props.current)
        .text((d) => d)
        .on("click", props.change);
    });
}
