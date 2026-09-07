import { stack, sum, max, min, stackOrderReverse, select, stackOrderNone } from 'd3';
import { cascade } from '../cascade.js';
import { component } from '../d3-component.js';
import { set, functor, compose, prop } from '../fn.js';
import bar from './bar.js';

/**
 * Stacked Bar components
 *
 * This module holds the vertical and the horizontal stacked bar chart, together with the two
 * data layout functions that prepare their input. Both components are variations on the same
 * concept and read the same intermediate representation of a stack, but they lay it out along
 * different dimensions, which is why there are two constructors rather than an orientation
 * property.
 *
 * The layout functions, stackedBarVerticalData and stackedBarHorizontalData, take their
 * accessors in the order (stackAcc, seriesAcc, valueAcc) and return a function over a flat
 * array of rows: stackAcc groups the rows into stacks, seriesAcc into the layers within a
 * stack, and valueAcc supplies the number that is stacked. The accessors are deliberately not
 * named after the axes, because which axis each one belongs to depends on the orientation: the
 * examples call stackedBarVerticalData(xAcc, cAcc, yAcc) but stackedBarHorizontalData(yAcc,
 * cAcc, xAcc) - see docs/bar-chart-vertical-stacked/basic.js and
 * docs/bar-chart-horizontal-stacked/basic.js.
 *
 * The result is an array of series, one per series key, each holding the [y0, y1] pairs
 * d3.stack computed, and each pair tagged with its `series`, its `stack` and, as `data`, the
 * single source row it was computed from. That array is what gets bound to the chart layer. The
 * rows passed in are not modified: the d3v3 stack layout used to write `y0` and `y` onto every
 * data object, but d3v7 returns pairs instead and leaves the source data alone.
 *
 * @module sszvis/component/stackedBar/horizontal
 * @module sszvis/component/stackedBar/vertical
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the stack values, i.e. the domain of the ordinal scale
 *
 * @property {function} xScale          Required. On a vertical chart, a band scale over the
 *                                      stack values, used to position each stack. On a
 *                                      horizontal chart, a linear scale over the stacked
 *                                      values, used for both the left edge and the width of
 *                                      every segment. Not defaulted: unset, it throws.
 * @property {function} yScale          Required, and the mirror image of xScale. On a vertical
 *                                      chart, a linear scale over the stacked values, used for
 *                                      both the top edge and the height of every segment; on a
 *                                      horizontal chart, a band scale over the stack values.
 *                                      Also not defaulted, and also throws by name when unset.
 * @property {number, function} width   Required by the vertical orientation, which sizes its
 *                                      bars with it - usually xScale.bandwidth(). The
 *                                      horizontal orientation computes its width from xScale
 *                                      and never reads the property. Omitting it on a vertical
 *                                      chart throws.
 * @property {number, function} height  Required by the horizontal orientation, and ignored by
 *                                      the vertical one, which computes its height from yScale.
 *                                      Omitting it on a horizontal chart throws, just as the
 *                                      vertical orientation does for width.
 * @property {string, function} fill    Optional. A constant or an accessor over a slice. When
 *                                      unset, no fill attribute is written at all and the
 *                                      rectangles fall back to the SVG/CSS default. An accessor
 *                                      is not called for a slice the stack carries no row for:
 *                                      that slice is zero-sized, so its fill would never be
 *                                      painted, and an accessor reading `d.data` would be
 *                                      handed undefined. Such a slice gets no fill attribute.
 * @property {string, function} stroke  Optional. A constant or an accessor over a slice. When
 *                                      unset, a 1px #FFFFFF stroke separates the segments -
 *                                      centred on the bar edge, so it overpaints half a pixel
 *                                      on each side. A truthy value such as "none" replaces the
 *                                      separator, but every falsy value falls back to it, so it
 *                                      cannot be removed by null or an empty string.
 *
 * Note: the two layout functions are the same computation and differ only in the stack order,
 * i.e. in which series key ends up on the baseline. The vertical layout stacks in reverse key
 * order, so the last key sits on the baseline; the horizontal one keeps the key order, so the
 * first key does.
 *
 * Note: a cell's value is the sum of every row the accessors placed in it, so data that is not
 * already aggregated to one row per (stack, series) pair stacks to its true total. The slice's
 * `data` property still points at the first row of the cell. A stack that carries no row for
 * one of the series keys stacks that series as zero, and the slice's `data` is undefined, so
 * sparse data needs no padding with explicit zero rows.
 *
 * Note: the series keys are collected from the data in order of first appearance, so the
 * stacking order is the caller's. The stacks themselves are ordered by the cascade, which
 * enumerates integer-like keys numerically regardless of insertion order; that part is only
 * cosmetic, since each slice is positioned by its own stack value.
 *
 * Note: `keys`, `maxValue` and `minValue` are hung off the returned array rather than wrapped in
 * an object, so any array operation - a spread, a map, a filter, a trip through JSON - drops
 * them, and `keys` shadows Array.prototype.keys, which makes the layout a badly behaved array.
 * `maxValue` and `minValue` are the extent of the stacked bounds, so a negative value is
 * included in them.
 *
 * Note: a negative value is drawn on the other side of the baseline: both orientations take
 * the lower of the two scaled bounds as the segment's origin and the absolute difference as
 * its size. The layout reports the extent as `minValue` and `maxValue`, so the value scale's
 * domain has to be built from both to make room for it.
 *
 * Note: the scale and size properties each orientation reads are required and are validated
 * before anything is drawn: a chart built without one throws an error naming the component and
 * the missing property, rather than rendering zero-size bars or failing inside a helper.
 *
 * Note: the group join uses the descendant selector `.sszvis-stack` rather than a child
 * selector and no key function, so any pre-existing stack below the target group, at any depth,
 * is captured and re-bound, and surviving groups and rects are matched by index rather than by
 * series. The component also forwards neither bar's `transition` property nor its tooltip
 * anchor properties, so every render attaches a transition that is immediately discarded, and
 * the tooltip anchor is always at the top centre of a segment. See
 * test/component/stackedBar.test.ts.
 *
 * @return {sszvis.component}
 */
const stackAcc = prop("stack");
/* Data layout
----------------------------------------------- */
/**
 * Both layouts are the same computation and differ only in the stack order, which decides
 * which series key ends up on the baseline.
 */
function stackedBarData(order) {
  return (_stackAcc,
  // cascade.objectBy stringifies its keys, so a numeric series accessor - a year, or a
  // category code - groups the same way a string one does. The keys themselves are read
  // back off the cascade row with Object.keys, which is why `series` stays a string.
  seriesAcc, valueAcc) => data => {
    var _max, _min;
    const rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);
    // The series keys, and with them the stacking order, come from the data rather than
    // from the cascade rows: those are plain objects, which enumerate integer-like keys
    // numerically and would drop the caller's ordering for numeric series.
    const keys = set(data, d => String(seriesAcc(d)));
    const stacks = stack().keys(keys)
    // Every row the accessors placed in a cell contributes to that cell's value, so
    // data that is not pre-aggregated to one row per (stack, series) pair stacks to
    // its true total rather than to its first row.
    // A stack that carries no row for one of the series keys stacks that series as
    // zero rather than throwing.
    .value((x, key) => {
      var _x$key;
      return sum((_x$key = x[key]) !== null && _x$key !== void 0 ? _x$key : [], valueAcc);
    }).order(order)(rows);
    // Simplify the 'data' property. The slices themselves are the objects d3 created,
    // rewritten in place, so a caller holding one sees the new shape. The series arrays
    // are rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
    // series - have to be carried across by hand.
    // The stack value of a row cannot be read off a cell that may be missing, so it is
    // taken once per row from whichever datum the row does hold. The stack layers d3
    // returns are index-aligned to the rows it was given.
    const stackValues = rows.map(row => _stackAcc(Object.values(row).flat()[0]));
    const series = stacks.map(stack => {
      const slices = stack.map((d, i) => {
        var _d$data$stack$key;
        const datum = (_d$data$stack$key = d.data[stack.key]) === null || _d$data$stack$key === void 0 ? void 0 : _d$data$stack$key[0];
        return Object.assign(d, {
          series: stack.key,
          data: datum,
          stack: stackValues[i]
        });
      });
      return Object.assign(slices, {
        key: stack.key,
        index: stack.index
      });
    });
    // Both bounds are considered, so a stack that reaches below the baseline reports an
    // extent that covers it.
    const maxValue = (_max = max(series, stack => max(stack, d => Math.max(d[0], d[1])))) !== null && _max !== void 0 ? _max : 0;
    const minValue = (_min = min(series, stack => min(stack, d => Math.min(d[0], d[1])))) !== null && _min !== void 0 ? _min : 0;
    return Object.assign(series, {
      keys,
      maxValue,
      minValue
    });
  };
}
const stackedBarHorizontalData = stackedBarData(stackOrderNone);
const stackedBarVerticalData = stackedBarData(stackOrderReverse);
/**
 * Throws for any of the named props the caller never set. The two orientations need
 * different ones, and each silently ignores the other's, so the message names the component
 * as well as the property. Called before anything is drawn, so a misconfigured chart renders
 * nothing rather than a grid of zero-size bars.
 */
function requireProps(name, props, required) {
  for (const prop of required) {
    if (Reflect.get(props, prop) === undefined) {
      throw new Error("[".concat(name, "] the ").concat(prop, " property is required"));
    }
  }
}
/**
 * Joins one group per series and draws that series' slices with the bar component. This is
 * everything the two orientations have in common; they differ only in how the four bar
 * dimensions are derived from the props.
 */
function drawStacks(selection, data, barGen) {
  const groups = selection.selectAll(".sszvis-stack").data(data).join("g").classed("sszvis-stack", true);
  groups.call(barGen);
}
/**
 * Applies a fill to a slice, leaving a slice with no source row unpainted.
 *
 * A stack that carries no row for one of its series contributes a zero-height (or zero-width)
 * slice whose `data` is undefined. Nothing of it is visible, so the caller's accessor - which
 * is written over the row, as every docs example is - is skipped rather than handed an
 * undefined datum to dereference.
 */
function fillOf(fill) {
  if (typeof fill !== "function") return fill;
  return (slice, index) => slice.data === undefined ? undefined : fill(slice, index);
}
function stackedBarHorizontal() {
  return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
    const selection = select(this);
    const props = selection.props();
    requireProps("stackedBarHorizontal", props, ["xScale", "yScale", "height"]);
    const barGen = bar()
    // The lower of the two scaled bounds, so a segment whose value is negative is drawn
    // on the other side of the baseline rather than with a negative width.
    .x(d => Math.min(props.xScale(d[0]), props.xScale(d[1]))).y(compose(props.yScale, stackAcc)).width(d => Math.abs(props.xScale(d[1]) - props.xScale(d[0]))).height(props.height).fill(fillOf(props.fill)).stroke(props.stroke || "#FFFFFF");
    drawStacks(selection, data, barGen);
  });
}
function stackedBarVertical() {
  return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
    const selection = select(this);
    const props = selection.props();
    requireProps("stackedBarVertical", props, ["xScale", "yScale", "width"]);
    const barGen = bar().x(compose(props.xScale, stackAcc))
    // The upper edge is whichever bound scales smaller, which keeps the geometry valid
    // for a negative value and for a y-scale whose range ascends.
    .y(d => Math.min(props.yScale(d[0]), props.yScale(d[1]))).width(props.width).height(d => Math.abs(props.yScale(d[0]) - props.yScale(d[1]))).fill(fillOf(props.fill)).stroke(props.stroke || "#FFFFFF");
    drawStacks(selection, data, barGen);
  });
}

export { stackedBarHorizontal, stackedBarHorizontalData, stackedBarVertical, stackedBarVerticalData };
//# sourceMappingURL=stackedBar.js.map
