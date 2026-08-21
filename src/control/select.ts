/**
 * Select control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.buttonGroup). Both controls join their wrapper
 * element on the `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so
 * rendering one into a container that already holds the other replaces it.
 *
 * @module sszvis/control/select
 *
 * @property {array} values         an array of string values which are the options available in
 *                                  the control. Values must be strings: the label measuring code
 *                                  slices the raw value, so a non-string value that needs
 *                                  trimming throws. See test/control/select.test.ts.
 * @property {string} current       the currently selected value of the select control. Should be one of the options passed to .values(). Compared with ===.
 * @property {number} width         The total width of the select control. If text labels exceed this width they will be trimmed to fit using an ellipsis mark. (default: 300px)
 * @property {function} change      A callback/event handler function to call when the user clicks on a value.
 *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { AnySelection } from "../types.js";

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

export interface SelectComponent<T extends string = string> extends Component {
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
  return component()
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
          props.change(e, props.values[i]);
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
        .attr("selected", (d) => (d === props.current ? "selected" : null))
        .attr("value", (_d, i) => i)
        .text((d) => truncateToWidth(metricsEl, props.width - LABEL_WIDTH_ALLOWANCE, d));
    });
}

/**
 * Shortens a label until it fits within maxWidth, measured by writing it into the
 * (invisible) metrics element and reading back its rendered width.
 *
 * Note: each step replaces the last two characters with a single ellipsis, so the first
 * step removes one character more than strictly necessary. The recursion also has no
 * fixed point check - a maxWidth that not even "…" fits into runs the full MAX_RECURSION.
 * See test/control/select.test.ts.
 */
function truncateToWidth(
  metricsEl: AnySelection,
  maxWidth: number,
  originalString: string
): string {
  const MAX_RECURSION = 1000;
  const fitText = (str: string, i: number): string => {
    metricsEl.text(str);
    const textWidth = Math.ceil((metricsEl.node() as Element).clientWidth);
    return i < MAX_RECURSION && textWidth > maxWidth ? fitText(`${str.slice(0, -2)}…`, i + 1) : str;
  };
  return fitText(originalString, 0);
}
