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
};

export interface SelectComponent<T extends string = string>
  extends ComponentBuilder<SelectComponent<T>> {
  values(): T[];
  values(values: T[]): SelectComponent<T>;
  current(): T;
  current(current: T): SelectComponent<T>;
  width(): number;
  width(width: number): SelectComponent<T>;
  change(): SelectChangeHandler<T>;
  change(handler: SelectChangeHandler<T>): SelectComponent<T>;
}

export default function selectMenu<T extends string = string>(): SelectComponent<T> {
  return component<SelectComponent<T>>()
    .prop("values")
    .prop("current")
    .prop("width")
    .width(300)
    .prop("change")
    .change(fn.identity)
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
          // We store the index in the select's value instead of the datum
          // because an option's value can only hold strings. An empty value means
          // nothing is selected, which must not be read as index 0.
          const value = this.value;
          const i = value === "" ? -1 : Number(value);
          const selected = props.values[i];
          if (selected === undefined) {
            // The recorded index can go stale between renders - a shorter `values` array
            // removes options but leaves the browser's selection pointing at an index
            // that is gone. A selection that maps to no value is not a selection.
            logger.warn(
              `[selectMenu] ignoring a selection whose option value "${value}" does not resolve to one of the ${props.values.length} configured values.`
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

      selectEl
        .selectAll<HTMLOptionElement, unknown>("option")
        .data(props.values)
        .join("option")
        .property("selected", (d) => d === props.current)
        .attr("value", (_d, i) => i)
        .text((d) => truncateToWidth(metricsEl, props.width - LABEL_WIDTH_ALLOWANCE, d));
    });
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
