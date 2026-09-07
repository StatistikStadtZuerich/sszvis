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
 * Note: `values` has no default, so rendering before the data is available throws while computing
 * the button width - before any DOM is created, so no partial control is left behind.
 *
 * See test/control/buttonGroup.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ComponentBuilder } from "../d3-component.js";
/**
 * Typed as `Event` rather than `MouseEvent` so that a handler is assignable to both
 * optionSelectable controls, which are documented as interchangeable.
 */
export type ButtonGroupChangeHandler<T> = (event: Event, value: T) => void;
export interface ButtonGroupComponent<T extends string | number = string | number> extends ComponentBuilder<ButtonGroupComponent<T>> {
    values(): T[];
    values(values: T[]): ButtonGroupComponent<T>;
    current(): T;
    current(current: T): ButtonGroupComponent<T>;
    width(): number;
    width(width: number): ButtonGroupComponent<T>;
    change(): ButtonGroupChangeHandler<T>;
    change(handler: ButtonGroupChangeHandler<T>): ButtonGroupComponent<T>;
}
export default function buttonGroup<T extends string | number = string | number>(): ButtonGroupComponent<T>;
//# sourceMappingURL=buttonGroup.d.ts.map