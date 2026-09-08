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

import { type Selection, select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";

/** Extra width given to the select element on top of the configured control width. */
const SELECT_WIDTH_PADDING = 30;
/** Width reserved for the select's own chrome when measuring whether a label fits. */
const LABEL_WIDTH_ALLOWANCE = 40;

export type SelectChangeHandler<T> = (event: Event, value: T) => void;

type SelectProps<T> = {
  values: T[];
  current: T;
  width: number;
  change: SelectChangeHandler<T>;
  ariaLabel: string | undefined;
};

export interface SelectComponent<T extends string = string>
  extends ComponentBuilder<SelectComponent<T>> {
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

export default function selectMenu<T extends string = string>(): SelectComponent<T> {
  return (
    component<SelectComponent<T>>()
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
        const props = selection.props<SelectProps<T>>();

        const wrapperEl = selection
          .selectAll<HTMLDivElement, string>(".sszvis-control-optionSelectable")
          .data(["sszvis-control-select"], (d) => d)
          .join("div")
          .classed("sszvis-control-optionSelectable", true)
          .classed("sszvis-control-select", true);

        wrapperEl.style("width", `${props.width}px`);

        const metricsEl = wrapperEl
          .selectDiv("selectMetrics")
          .classed("sszvis-control-select__metrics", true);

        const selectEl = wrapperEl
          .selectAll<HTMLSelectElement, unknown>(".sszvis-control-select__element")
          .data([1])
          .join("select")
          .classed("sszvis-control-select__element", true)
          .on("change", function (this: HTMLSelectElement, e: Event) {
            // An option's value can only hold a string, so it holds `String(value)` and the
            // selection is resolved back by comparing that coercion. Storing the array
            // position instead let a selection recorded against an older `values` array
            // resolve to whatever had since moved into that position.
            const value = this.value;
            const selected = props.values.find((d) => String(d) === value);
            if (selected === undefined) {
              // Still reachable: a select with no options at all reports "", and an option
              // value written by something other than this component matches nothing. A
              // selection that maps to no value is not a selection.
              logger.warn(
                `[selectMenu] ignoring a selection whose option value "${value}" does not match any of the ${props.values.length} configured values.`
              );
              return;
            }
            props.change(e, selected);
            // Prevent highlights on the select element after users have selected
            // an option by moving away from it.
            setTimeout(() => {
              window.focus();
            }, 0);
          });

        selectEl.style("width", `${props.width + SELECT_WIDTH_PADDING}px`);
        // `??` rather than `||`, so an explicitly empty name stays an empty name.
        selectEl.attr("aria-label", props.ariaLabel ?? null);

        // Options are keyed by their own value, so an option element follows its value
        // across a re-render rather than being positionally re-labelled. Values repeated
        // verbatim are fine - they key the same and resolve to the same thing - but two
        // *distinct* values that coerce to the same string are indistinguishable, and the
        // first of them wins when a selection is resolved. Say so rather than guessing.
        const keyOf = (d: T) => String(d);
        const firstByKey = new Map<string, T>();
        const collisions: string[] = [];
        for (const d of props.values) {
          const key = keyOf(d);
          if (!firstByKey.has(key)) firstByKey.set(key, d);
          else if (firstByKey.get(key) !== d) collisions.push(key);
        }
        if (collisions.length > 0) {
          logger.warn(
            `[selectMenu] values contains distinct entries that are indistinguishable as strings (${collisions.join(", ")}); a selection resolves to the first of each.`
          );
        }

        selectEl
          .selectAll<HTMLOptionElement, T>("option")
          .data(props.values, keyOf)
          .join("option")
          .property("selected", (d) => d === props.current)
          .attr("value", keyOf)
          .text((d) => truncateToWidth(metricsEl, props.width - LABEL_WIDTH_ALLOWANCE, d));
      })
  );
}

/**
 * Shortens a label until it fits within maxWidth, measured by writing it into the
 * (invisible) metrics element and reading back its rendered width.
 *
 * The value is coerced with `String()` first, matching the coercion `.text()` would apply
 * anyway. Shortening stops as soon as the candidate no longer gets shorter, so a maxWidth
 * that not even "…" fits into costs a handful of measurements rather than MAX_RECURSION.
 *
 * Note: each step replaces the last two characters with a single ellipsis, so the first
 * step removes one character more than strictly necessary.
 * See test/control/select.test.ts.
 */
function truncateToWidth(
  metricsEl: Selection<HTMLDivElement, string, HTMLDivElement, string>,
  maxWidth: number,
  originalString: string
): string {
  const MAX_RECURSION = 1000;
  const fitText = (str: string, i: number): string => {
    metricsEl.text(str);
    const textWidth = Math.ceil((metricsEl.node() as Element).clientWidth);
    if (i >= MAX_RECURSION || textWidth <= maxWidth) return str;
    const shorter = `${str.slice(0, -2)}…`;
    // "…" is a fixed point of the shortening step; without this guard a negative
    // measuring budget burns the full MAX_RECURSION in forced synchronous layouts.
    // Compared by text rather than by length: a one-character label such as "A" is the
    // same length as the "…" it shortens to, and a length test returned the overflowing
    // original instead of taking the first step.
    return shorter === str ? str : fitText(shorter, i + 1);
  };
  return fitText(String(originalString), 0);
}
