/**
 * Button Group control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (`sszvis.control.selectMenu`).
 *
 * @module sszvis/control/buttonGroup
 *
 * @property {array} values         an array of values which are the options available in the control.
 *                                  Each one will become a button. (default: [], which renders an
 *                                  empty group)
 * @property {string|number} current the current value of the button group. Should be one of the
 *                                  options passed to .values(). Compared with ===.
 * @property {number} width         The total width of the button group, divided evenly between the
 *                                  options. A label too long for its share wraps onto more lines
 *                                  rather than widening the group; only an unbreakable word wider
 *                                  than its share makes an option, and so the group, exceed it.
 *                                  (default: 300px)
 * @property {function} change      A callback/event handler function called as (event, value) when
 *                                  the user clicks on a value. Note that clicking on a value does not
 *                                  necessarily change any state unless this callback function does
 *                                  something. (default: fn.identity, which returns the event and
 *                                  silently discards the value)
 * @property {string} ariaLabel     An accessible name for the group of options, naming what the
 *                                  control filters rather than what the options are. Written as
 *                                  `aria-label` on the radiogroup. (default: undefined, which writes
 *                                  no attribute, leaving the group unnamed)
 *
 * Note: both optionSelectable controls join their wrapper element on the
 * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
 * into a container that already holds the other replaces the other's DOM. This is what makes them
 * interchangeable. They do not accept quite the same values, though: this control labels its buttons
 * through d3's text coercion and so takes numbers as well as strings, while the select control
 * trims its labels and therefore requires strings.
 *
 * Note: each button is written `width / values.length` pixels wide, unrounded, and the stylesheet
 * gives it `min-width: min-content`. A label too long for that share therefore wraps onto as many
 * lines as it needs *inside* its button, and the button only grows past its share when a single
 * unbreakable word cannot fit at all. `width` is honoured in the normal case, which is what the
 * call sites that centre the control by it rely on. Labels are never measured or trimmed here -
 * that is where the control diverges from `selectMenu`, which cannot wrap and shortens the label
 * instead: the two controls render the same values through the same callback, but not the same
 * label text. Swapping to `selectMenu` across a breakpoint can substitute an ellipsised label for
 * one this control would have wrapped.
 *
 * Note: #362 left open whether a group whose labels do not fit should shrink its padding, stay
 * within `width`, or wrap. It wraps. That is what the `display: table-cell` items this row is
 * descended from actually did - a cell holds its assigned width and wraps its content, growing only
 * for content that cannot break - and it keeps `props.width` an honest measure of the control's
 * footprint. Shrinking the padding would have made the option boxes inconsistent between charts
 * and still failed for a label of any length.
 *
 * Note: selectedness is computed per button with no notion of uniqueness, so a value repeated in
 * `values` renders twice and both copies are highlighted when they equal `current`.
 *
 * Note: the options are real `button` elements carrying `role="radio"` inside a `role="radiogroup"`
 * wrapper, and are operable from the keyboard. Enter and Space activate the focused option; Left/Up
 * and Right/Down move the selection and wrap at the ends. A roving `tabindex` keeps exactly one
 * option in the tab order - the current one, or the first option when `current` matches no value, so
 * the group stays reachable either way. Arrow keys call `change` immediately, the same as a click,
 * which is the standard radio-group behaviour; the component still holds no state of its own. The
 * `selected` class is kept as the visual hook alongside `aria-checked`.
 *
 * Note: `ariaLabel` is unset by default rather than defaulting to an empty string. A form control is
 * never decorative, so there is no meaningful "no name wanted" value: an unset `ariaLabel` means the
 * name has not been supplied yet, and no attribute is written. Nothing warns about it, because every
 * existing call site is unnamed and a per-render warning would be noise rather than a signal.
 *
 * Note: `values` is coerced to the empty array, so a render that lands before the data
 * draws an empty group rather than throwing - whether the prop was never set or was set to `undefined`
 * from a state key the fetch has not filled in yet. "Not configured yet" and "nothing to offer
 * yet" are the same state for a control fed from a fetch, and they render the same way.
 * `selectMenu` does this the same way.
 *
 * See test/control/buttonGroup.test.ts.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
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
  ariaLabel: string | undefined;
};

export interface ButtonGroupComponent<T extends string | number = string | number>
  extends ComponentBuilder<ButtonGroupComponent<T>> {
  values(): T[];
  values(values: T[] | undefined): ButtonGroupComponent<T>;
  current(): T;
  current(current: T): ButtonGroupComponent<T>;
  width(): number;
  width(width: number): ButtonGroupComponent<T>;
  change(): ButtonGroupChangeHandler<T>;
  change(handler: ButtonGroupChangeHandler<T>): ButtonGroupComponent<T>;
  ariaLabel(): string | undefined;
  ariaLabel(label: string): ButtonGroupComponent<T>;
}

export default function buttonGroup<
  T extends string | number = string | number,
>(): ButtonGroupComponent<T> {
  return (
    component<ButtonGroupComponent<T>>()
      // Coerced rather than merely defaulted: a chart hands this a state key that is only
      // populated when its data arrives, so the value actually passed is `undefined`, which a
      // plain default would not catch - `.prop()` stores whatever the setter is given.
      .prop("values", (values?: T[]) => values ?? [])
      .values([])
      .prop("current")
      .prop("width")
      .width(300)
      .prop("change")
      .change(fn.identity)
      .prop("ariaLabel")
      .render(function (this: Element) {
        const selection = select(this);
        const props = selection.props<ButtonGroupProps<T>>();

        // Divided by zero for an empty group, which is only ever written onto buttons - of which
        // there are then none - so the infinity never reaches the DOM.
        const buttonWidth = props.width / props.values.length;

        const container = selection
          .selectAll<HTMLDivElement, string>(".sszvis-control-optionSelectable")
          .data(["sszvis-control-buttonGroup"], (d) => d)
          .join("div")
          .classed("sszvis-control-optionSelectable", true)
          .classed("sszvis-control-buttonGroup", true)
          .attr("role", "radiogroup")
          // `??` rather than `||`, so an explicitly empty name stays an empty name.
          .attr("aria-label", props.ariaLabel ?? null);

        container.style("width", `${props.width}px`);

        const buttons = container
          .selectAll<HTMLButtonElement, T>(".sszvis-control-buttonGroup__item")
          .data(props.values)
          .join("button")
          .classed("sszvis-control-buttonGroup__item", true)
          .attr("type", "button")
          .attr("role", "radio");

        // Roving tabindex: exactly one option is in the tab order. That is the current one, or
        // the first option when `current` matches no value, so the group stays reachable.
        const currentIndex = props.values.indexOf(props.current);
        const rovingIndex = currentIndex === -1 ? 0 : currentIndex;

        const nodes = buttons.nodes();

        /** Moves the selection by `step` options, wrapping at both ends. */
        const move = (event: Event, from: number, step: number) => {
          const to = (from + step + nodes.length) % nodes.length;
          event.preventDefault();
          nodes[to]?.focus();
          props.change(event, props.values[to]);
        };

        buttons
          .style("width", `${buttonWidth}px`)
          .classed("selected", (d) => d === props.current)
          // Keyed on the index, not on the value: duplicate values are supported, and a
          // radiogroup with two checked radios is contradictory state for assistive
          // technology. The legacy `selected` class still highlights every occurrence.
          .attr("aria-checked", (_d, i) => (i === currentIndex ? "true" : "false"))
          .attr("tabindex", (_d, i) => (i === rovingIndex ? 0 : -1))
          .text((d) => d)
          .on("click", props.change)
          .on("keydown", function (this: HTMLButtonElement, event: KeyboardEvent, d: T) {
            const index = nodes.indexOf(this);
            switch (event.key) {
              case "Enter":
              case " ":
                // The native button would activate on its own, but calling `change` here and
                // suppressing that activation keeps a keypress and a click on one code path.
                event.preventDefault();
                props.change(event, d);
                break;
              case "ArrowRight":
              case "ArrowDown":
                move(event, index, 1);
                break;
              case "ArrowLeft":
              case "ArrowUp":
                move(event, index, -1);
                break;
              default:
                break;
            }
          });
      })
  );
}
