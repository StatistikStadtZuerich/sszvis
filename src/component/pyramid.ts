/**
 * Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is typically one object holding both sides of the
 * pyramid - all the component requires is that the side accessors return arrays. Each
 * series is then rendered by its own bar component, the left one mirrored across the spine,
 * so every bar dimension is read from the same accessors on both sides.
 *
 * The component always creates four sub-groups, in this order: left, right, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint
 * over the bars, and the reference groups are created even when no reference accessor is
 * configured.
 *
 * @module sszvis/component/pyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the datum bound to the chart layer
 * @template D The type of one bar's datum, i.e. the elements of each side's series
 *
 * @property {string, function} [barFill]          The color of a bar. Defaults to #000 and applies to both
 *                                                 sides; a per-datum accessor is the usual way to colour the
 *                                                 two sides differently.
 * @property {number, function} barHeight          The height of a bar, in pixels. Required: an unset
 *                                                 property throws "[pyramid] the barHeight property is
 *                                                 required" before anything is rendered.
 * @property {number, function} barWidth           The width of a bar, in pixels. Required, same error
 *                                                 shape as barHeight. The component computes the left
 *                                                 bar's x itself, as -SPINE_PADDING - barWidth(d, i),
 *                                                 forwarding d3's index so an index-aware accessor
 *                                                 positions the mirrored bars as it sizes them.
 * @property {number, function} barPosition        The vertical position of a bar, i.e. its top edge, in
 *                                                 pixels. Required, same error shape as barHeight.
 * @property {Array<Number>} [tooltipAnchor]       The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars.
 *                                                 The value is handed to both bars unchanged rather than being
 *                                                 mirrored, and bar measures from its own upper left corner, so
 *                                                 any x other than 0.5 lands on visually opposite sides of the
 *                                                 pyramid. An array with fewer than two entries yields a NaN
 *                                                 coordinate, as documented on bar.
 * @property {function}         leftAccessor       Data for the left side. Required, same error shape as
 *                                                 barHeight. An accessor that returns undefined or null
 *                                                 still throws from d3's data join, since a side with no
 *                                                 data is a broken chart rather than an empty one.
 * @property {function}         rightAccessor      Data for the right side. Same requirements as leftAccessor.
 * @property {function}         [leftRefAccessor]  Reference data for the left side, drawn as a single path
 *                                                 outlining the reference series. Optional in both senses:
 *                                                 the accessor may be unset, and an accessor that returns
 *                                                 no data for some state renders no line for that state.
 *                                                 undefined and null are warned about, since they violate
 *                                                 the accessor's contract; an empty array is treated as a
 *                                                 legitimately empty series and passes silently.
 * @property {function}         [rightRefAccessor] Reference data for the right side. Same as leftRefAccessor.
 *
 * Note: a reference point sits at the outer edge of the bar it describes, vertically
 * centred on it: x is SPINE_PADDING + barWidth, matching the bar's own outer edge, and y is
 * barPosition + barHeight / 2, the bar's mid-line. Both sides share the same generator; the
 * left one is mirrored with a scale(-1, 1) transform.
 *
 * Note: an entering reference path gets its d attribute synchronously, so getBBox, snapshots
 * and PNG exports see real geometry on the tick it is rendered. Updates are additionally
 * written through a transition, so a change of data eases into place. The bars underneath do
 * not animate at all - bar's transition property is inert - so on a state change the outline
 * eases towards its new position while the bars jump, and the two visibly detach for the
 * length of the transition. Fixing that belongs to bar.
 *
 * Note: a reference series with no points renders no path at all, and a path already in the
 * DOM is removed when its series goes away. Each side is still capped at a single line, since
 * the series is wrapped in a one-element array before the join.
 *
 * Note: the reference line skips points whose barWidth or barPosition is not a finite number,
 * so a gap in the reference series breaks the outline at the gap rather than truncating it,
 * the way bar's own missing-value guard keeps the bars drawable.
 *
 * Note: the reference line's appearance comes entirely from the
 * .sszvis-pyramid__referenceline rule in sszvis.css - the component sets only the class.
 * Without that stylesheet the path renders as a solid black shape, since fill defaults to
 * black. stackedPyramid's otherwise identical line component inlines the same four values
 * instead. See test/component/pyramid.test.ts.
 *
 * @return {sszvis.component}
 */

import { line as d3Line, select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { defaultTransition } from "../transition.js";
import bar from "./bar.js";

/* Constants
----------------------------------------------- */
const SPINE_PADDING = 0.5;

/** Properties with no sensible fallback: without any one of them nothing can be drawn. */
const REQUIRED_PROPS = [
  "barHeight",
  "barWidth",
  "barPosition",
  "leftAccessor",
  "rightAccessor",
] as const;

/* Types
----------------------------------------------- */

/**
 * The bar dimensions are wrapped by fn.functor on set, so they are always stored as
 * functions by the time the renderer reads them. The parameters are variadic because d3
 * calls them with the datum, the index and the group - except on the left side, where the
 * component calls barWidth itself with the datum alone.
 */
type ValueAccessor<D, R> = (datum: D, index: number) => R;

/**
 * Pulls one side's series out of the chart's datum. Unlike the bar dimensions these are
 * stored exactly as they were set, so they are always functions, and the datum they read
 * is whatever the caller bound to the chart layer.
 */
type SideAccessor<T, D> = (data: T) => D[];

/**
 * How a bar dimension reads back once it is stored. Both parameters are optional because a
 * constant becomes a functor that ignores its arguments, and because the component calls
 * barWidth itself with the datum alone when placing the left bars.
 */
type StoredAccessor<D, R> = (datum?: D, index?: number) => R;

type PyramidProps<T, D> = {
  barHeight: StoredAccessor<D, number>;
  barWidth: StoredAccessor<D, number>;
  barPosition: StoredAccessor<D, number>;
  barFill: StoredAccessor<D, string | undefined>;
  tooltipAnchor: (number | string)[];
  leftAccessor: SideAccessor<T, D>;
  rightAccessor: SideAccessor<T, D>;
  leftRefAccessor?: SideAccessor<T, D>;
  rightRefAccessor?: SideAccessor<T, D>;
};

/**
 * A constant or an accessor over one bar's datum; either is accepted for the bar
 * dimensions, since fn.functor normalises both.
 */
type PyramidValue<D, R> = R | ValueAccessor<D, R>;

export interface PyramidComponent<T = unknown, D = unknown>
  extends ComponentBuilder<PyramidComponent<T, D>> {
  barHeight(): StoredAccessor<D, number>;
  barHeight<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
  barWidth(): StoredAccessor<D, number>;
  barWidth<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
  barPosition(): StoredAccessor<D, number>;
  barPosition<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
  barFill(): StoredAccessor<D, string | undefined>;
  barFill<V = D>(value: PyramidValue<V, string | undefined>): PyramidComponent<T, D>;
  tooltipAnchor(): (number | string)[];
  tooltipAnchor(anchor: (number | string)[]): PyramidComponent<T, D>;
  leftAccessor(): SideAccessor<T, D>;
  leftAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
  rightAccessor(): SideAccessor<T, D>;
  rightAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
  leftRefAccessor(): SideAccessor<T, D> | undefined;
  leftRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
  rightRefAccessor(): SideAccessor<T, D> | undefined;
  rightRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
}

/* Module
----------------------------------------------- */
export default function pyramid<T = unknown, D = unknown>(): PyramidComponent<T, D> {
  return component<PyramidComponent<T, D>>()
    .prop("barHeight", fn.functor)
    .prop("barWidth", fn.functor)
    .prop("barPosition", fn.functor)
    .prop("barFill", fn.functor)
    .barFill("#000")
    .prop("tooltipAnchor")
    .tooltipAnchor([0.5, 0.5])
    .prop("leftAccessor")
    .prop("rightAccessor")
    .prop("leftRefAccessor")
    .prop("rightRefAccessor")
    .render(function (this: Element, data: T) {
      const selection = select(this);
      const props = selection.props<PyramidProps<T, D>>();

      // Validation, before any element exists: none of these can render correctly when
      // unset, and two of the three bar dimensions used to fail silently by reaching bar's
      // missing-value guard as undefined.
      for (const name of REQUIRED_PROPS) {
        if (props[name] === undefined) {
          throw new Error(`[pyramid] the ${name} property is required`);
        }
      }

      // Components

      const leftBar = bar<D>()
        // Forwards d3's index, so an index-aware barWidth positions the mirrored bars the
        // same way it sizes them.
        .x((d: D, i: number) => -SPINE_PADDING - props.barWidth(d, i))
        .y(props.barPosition)
        .height(props.barHeight)
        .width(props.barWidth)
        .fill(props.barFill)
        .tooltipAnchor(props.tooltipAnchor);

      const rightBar = bar<D>()
        .x(SPINE_PADDING)
        .y(props.barPosition)
        .height(props.barHeight)
        .width(props.barWidth)
        .fill(props.barFill)
        .tooltipAnchor(props.tooltipAnchor);

      const leftLine = lineComponent<D>()
        .barPosition(props.barPosition)
        .barHeight(props.barHeight)
        .barWidth(props.barWidth)
        .mirror(true);

      const rightLine = lineComponent<D>()
        .barPosition(props.barPosition)
        .barHeight(props.barHeight)
        .barWidth(props.barWidth);

      // Rendering

      selection.selectGroup("left").datum(props.leftAccessor(data)).call(leftBar);

      selection.selectGroup("right").datum(props.rightAccessor(data)).call(rightBar);

      selection
        .selectGroup("leftReference")
        .datum(referenceSeries(props.leftRefAccessor, data, "leftRefAccessor"))
        .call(leftLine);

      selection
        .selectGroup("rightReference")
        .datum(referenceSeries(props.rightRefAccessor, data, "rightRefAccessor"))
        .call(rightLine);
    });
}

/**
 * Resolves one side's reference series into the array-of-series the line component joins on:
 * one entry when there is something to draw, none otherwise. A series with no points
 * therefore removes its path rather than leaving an empty one behind.
 *
 * An accessor returning undefined or null breaks its contract, so it is warned about - but it
 * is warned about rather than thrown on, because it is data-driven: an accessor indexing into
 * a cascaded object hits it as soon as one category is missing from one state, and that must
 * not take the chart down. An empty array is a legitimately empty series and passes silently.
 */
function referenceSeries<T, D>(
  accessor: SideAccessor<T, D> | undefined,
  data: T,
  name: string
): D[][] {
  if (accessor === undefined) return [];
  const series = accessor(data);
  if (!Array.isArray(series)) {
    logger.warn(
      `[pyramid] ${name} returned ${String(series)} rather than an array; no reference line was drawn. Return an empty array for a state that has no reference series.`
    );
    return [];
  }
  return series.length === 0 ? [] : [series];
}

type ReferenceLineProps<D> = {
  barPosition: StoredAccessor<D, number>;
  barHeight: StoredAccessor<D, number>;
  barWidth: StoredAccessor<D, number>;
  mirror: boolean;
};

interface ReferenceLineComponent<D> extends ComponentBuilder<ReferenceLineComponent<D>> {
  barPosition(): StoredAccessor<D, number>;
  barPosition(value: StoredAccessor<D, number>): ReferenceLineComponent<D>;
  barHeight(): StoredAccessor<D, number>;
  barHeight(value: StoredAccessor<D, number>): ReferenceLineComponent<D>;
  barWidth(): StoredAccessor<D, number>;
  barWidth(value: StoredAccessor<D, number>): ReferenceLineComponent<D>;
  mirror(): boolean;
  mirror(value: boolean): ReferenceLineComponent<D>;
}

/**
 * Draws one side's reference outline as a single path. The data is one array of points per
 * path, so the datum handed to this component is an array of arrays - in practice always
 * of length one, since each side has at most one reference line.
 */
function lineComponent<D>(): ReferenceLineComponent<D> {
  return component<ReferenceLineComponent<D>>()
    .prop("barPosition")
    .prop("barHeight")
    .prop("barWidth")
    .prop("mirror")
    .mirror(false)
    .render(function (this: Element, data: D[][]) {
      const selection = select(this);
      const props = selection.props<ReferenceLineProps<D>>();

      // The reference point is the outer edge of the bar it describes, vertically centred on
      // it - the same corner-plus-half-height the bars themselves occupy.
      const pointX = (d: D, i: number) => SPINE_PADDING + props.barWidth(d, i);
      const pointY = (d: D, i: number) => props.barPosition(d, i) + props.barHeight(d, i) / 2;

      const lineGen = d3Line<D>()
        // A point whose geometry is not a finite number is skipped, which breaks the outline
        // at the gap instead of poisoning the path string from there on.
        .defined((d, i) => isDrawable(pointX(d, i)) && isDrawable(pointY(d, i)))
        .x(pointX)
        .y(pointY);

      const line = selection
        .selectAll<SVGPathElement, D[]>(".sszvis-pyramid__referenceline")
        .data(data)
        .join((enter) =>
          enter
            .append("path")
            .attr("class", "sszvis-pyramid__referenceline")
            // Entering paths get their geometry synchronously: a transition alone would
            // leave getBBox, snapshots and PNG exports looking at an empty path.
            .attr("d", lineGen)
        );

      line
        .attr("transform", props.mirror ? "scale(-1, 1)" : "")
        .transition(defaultTransition())
        .attr("d", lineGen);
    });
}

/** Whether a computed coordinate can be written into a path string at all. */
function isDrawable(value: number): boolean {
  return Number.isFinite(Number(value));
}
