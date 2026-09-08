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
 * @property values         an array of string values which are the options available in
 *                                  the control. Unset or undefined is read as the empty array,
 *                                  which renders a select with no options.
 * @property current       the currently selected value of the select control. Should be one
 *                                  of the options passed to .values(). Compared with ===.
 * @property width         The total width of the select control. Labels wider than
 *                                  `width - 40` are trimmed to fit with an ellipsis mark, the 40px
 *                                  covering the select's own chrome. (default: 300px)
 * @property change      A callback/event handler function called as (event, value) when
 *                                  the user selects an option. Selecting a value does not change any
 *                                  state unless this callback does something. (default: fn.identity,
 *                                  which returns the event and silently discards the value)
 * @property ariaLabel     An accessible name for the control, naming what it filters rather
 *                                  than what the options are. Written as `aria-label` on the select
 *                                  element. (default: undefined, which writes no attribute, leaving
 *                                  the control unnamed)
 *
 * Note: both optionSelectable controls join their wrapper element on the
 * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
 * into a container that already holds the other replaces the other's DOM. This is what makes them
 * interchangeable.
 *
 * Note: the two controls do not show an overlong label the same way, because they cannot. A native
 * select element is laid out by the browser: its options can neither wrap onto a second line nor
 * grow the control, so this control measures each label and trims it with an ellipsis to fit
 * `width - 40` (`LABEL_WIDTH_ALLOWANCE`, which reserves room for the select's own chrome). The
 * button group draws ordinary elements it does control, so it wraps a long label over more lines
 * instead of shortening it. Swapping one control for the other across a breakpoint therefore keeps
 * the same values and the same callback, but not the same label *text*: expect ellipses here, and
 * the full string on two or three lines there. This says nothing about which control takes more
 * room - see the note below on the 30px this one adds to `width`.
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
 * Note: each option carries its own value, coerced with `String()`, and a selection is resolved
 * back by that coercion rather than by array position, so a selection recorded against an older
 * `values` array cannot resolve to a different value. The options are joined on the same key, so an
 * option element follows its value across a re-render. A value repeated verbatim still renders once
 * per occurrence, but two *distinct* values that coerce to the same string are indistinguishable:
 * both render, a selection resolves to the first of them, and the component warns. A selection that
 * matches no configured value is ignored with a warning instead of invoking `change` with
 * `undefined`.
 *
 * Note: `ariaLabel` is unset by default rather than defaulting to an empty string. A form control is
 * never decorative, so there is no meaningful "no name wanted" value: an unset `ariaLabel` means the
 * name has not been supplied yet, and no attribute is written. Nothing warns about it, because every
 * existing call site is unnamed and a per-render warning would be noise rather than a signal. The
 * attribute goes on the `select` element itself, not on the wrapper `div`, which carries no role and
 * so cannot be named; `buttonGroup` names its `radiogroup` wrapper instead.
 *
 * Note: `values` resolves to the empty array when it is unset or set to undefined, so a render that
 * lands before the data does draws an empty control rather than throwing. A chart fed from a fetch
 * passes a state key that is undefined until the data arrives, so the two spellings of "nothing to
 * offer yet" have to mean the same thing. `buttonGroup` coerces its `values` the same way.
 *
 * See test/control/select.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ComponentBuilder } from "../d3-component.js";
export type SelectChangeHandler<T> = (event: Event, value: T) => void;
export interface SelectComponent<T extends string = string> extends ComponentBuilder<SelectComponent<T>> {
    values(): T[];
    values(values: T[] | undefined): SelectComponent<T>;
    current(): T;
    current(current: T): SelectComponent<T>;
    width(): number;
    width(width: number): SelectComponent<T>;
    change(): SelectChangeHandler<T>;
    change(handler: SelectChangeHandler<T>): SelectComponent<T>;
    ariaLabel(): string | undefined;
    ariaLabel(label: string): SelectComponent<T>;
}
export default function selectMenu<T extends string = string>(): SelectComponent<T>;
//# sourceMappingURL=select.d.ts.map