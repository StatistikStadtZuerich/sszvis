/**
 * Select control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.buttonGroup).
 *
 * @module sszvis/control/select
 *
 * @property {array} values         an array of string values which are the options available in
 *                                  the control. Required - there is no default.
 * @property {string} current       the currently selected value of the select control. Should be one
 *                                  of the options passed to .values(). Compared with ===.
 * @property {number} width         The total width of the select control. If text labels exceed this
 *                                  width they will be trimmed to fit using an ellipsis mark.
 *                                  (default: 300px)
 * @property {function} change      A callback/event handler function called as (event, value) when
 *                                  the user selects an option. Selecting a value does not change any
 *                                  state unless this callback does something. (default: fn.identity,
 *                                  which returns the event and silently discards the value)
 *
 * Note: both optionSelectable controls join their wrapper element on the
 * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
 * into a container that already holds the other replaces the other's DOM. This is what makes them
 * interchangeable.
 *
 * Note: `current` is written as each option's `selected` DOM property, so it stays authoritative
 * across re-renders even after the user has picked an option themselves. A value duplicated in
 * `values` selects the last matching option, because a single-select element holds one selection.
 *
 * Note: the wrapper is styled to `width`, but the select element itself is rendered 30px wider,
 * while labels are measured and trimmed against `width - 40`.
 *
 * Note: label truncation removes one character more than strictly necessary (the ellipsis replaces
 * the second-to-last character as well). Values are coerced with `String()` before measuring, so
 * non-string values are trimmed rather than throwing.
 *
 * Note: a selection whose stored index no longer resolves to a value - an empty select value, or an
 * index left behind by a shorter `values` array - is ignored with a warning instead of invoking
 * `change` with `undefined`.
 *
 * Note: `values` has no default, so rendering before the data is available throws mid-render from
 * d3's data join - after the wrapper and select have been created and styled, leaving an empty,
 * width-styled control behind rather than nothing at all.
 *
 * See test/control/select.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ComponentBuilder } from "../d3-component.js";
export type SelectChangeHandler<T> = (event: Event, value: T) => void;
export interface SelectComponent<T extends string = string> extends ComponentBuilder<SelectComponent<T>> {
    values(): T[];
    values(values: T[]): SelectComponent<T>;
    current(): T;
    current(current: T): SelectComponent<T>;
    width(): number;
    width(width: number): SelectComponent<T>;
    change(): SelectChangeHandler<T>;
    change(handler: SelectChangeHandler<T>): SelectComponent<T>;
}
export default function selectMenu<T extends string = string>(): SelectComponent<T>;
//# sourceMappingURL=select.d.ts.map