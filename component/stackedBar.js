import { stack, max, stackOrderReverse, select, stackOrderNone } from 'd3';
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
 *                                      Also not defaulted, and also throws when unset.
 * @property {number, function} width   Required by the vertical orientation, which sizes its
 *                                      bars with it - usually xScale.bandwidth(). The
 *                                      horizontal orientation computes its width from xScale
 *                                      and never reads the property. Omitting it on a vertical
 *                                      chart is not reported: every bar gets width 0.
 * @property {number, function} height  Required by the horizontal orientation, and ignored by
 *                                      the vertical one, which computes its height from yScale.
 *                                      Fails just as silently when omitted on a horizontal
 *                                      chart: every bar gets height 0.
 * @property {string, function} fill    Optional. A constant or an accessor over a slice. When
 *                                      unset, no fill attribute is written at all and the
 *                                      rectangles fall back to the SVG/CSS default.
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
 * Note: the value of a cell is read from its first row only, so data that is not already
 * aggregated to one row per (stack, series) pair is silently truncated rather than summed. The
 * same unguarded read throws when a stack is missing one of the series keys, so every stack has
 * to carry a row for every series - callers with sparse data have to pad it with zero rows.
 *
 * Note: the series keys come from Object.keys over the grouped data, and JavaScript orders
 * integer-like keys numerically regardless of insertion order. A series accessor returning
 * years or numeric codes therefore loses the caller's ordering, and since the key order is the
 * stacking order, the stack silently changes shape. The stacks themselves are reordered the
 * same way, which is only cosmetic, since each slice is positioned by its own stack value.
 *
 * Note: `keys` and `maxValue` are hung off the returned array rather than wrapped in an object,
 * so any array operation - a spread, a map, a filter, a trip through JSON - drops them, and
 * `keys` shadows Array.prototype.keys, which makes the layout a badly behaved array. `maxValue`
 * is the maximum of the upper bounds only, so it is not the extent of the data when a value is
 * negative, and it is undefined rather than 0 for an empty layout, which turns into a NaN axis
 * when it is fed straight into a scale domain the way the examples do.
 *
 * Note: a negative value produces a negative rect width on a horizontal chart, which the
 * browser rejects, so the segment is simply not drawn. Neither orientation supports values
 * below the baseline.
 *
 * Note: the four scale and size properties are required but neither defaulted nor validated.
 * Two of them fail silently as zero-size bars, and the two scales throw a low-level TypeError
 * that names neither the property nor the component.
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
// Accessors for the first and second element of a tuple (2-element array).
const fst = prop("0");
const snd = prop("1");
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
    const rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);
    // Collect all keys ()
    const keys = rows.reduce((a, row) => set([...a, ...Object.keys(row)]), []);
    const stacks = stack().keys(keys)
    // Only the first datum of each cell is read, and the read is unguarded: a stack
    // that is missing one of the series keys throws here.
    .value((x, key) => valueAcc(x[key][0])).order(order)(rows);
    // Simplify the 'data' property. The slices themselves are the objects d3 created,
    // rewritten in place, so a caller holding one sees the new shape. The series arrays
    // are rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
    // series - have to be carried across by hand.
    const series = stacks.map(stack => {
      const slices = stack.map(d => {
        const datum = d.data[stack.key][0];
        return Object.assign(d, {
          series: stack.key,
          data: datum,
          stack: _stackAcc(datum)
        });
      });
      return Object.assign(slices, {
        key: stack.key,
        index: stack.index
      });
    });
    const maxValue = max(series, stack => max(stack, d => d[1]));
    return Object.assign(series, {
      keys,
      maxValue
    });
  };
}
const stackedBarHorizontalData = stackedBarData(stackOrderNone);
const stackedBarVerticalData = stackedBarData(stackOrderReverse);
/**
 * Joins one group per series and draws that series' slices with the bar component. This is
 * everything the two orientations have in common; they differ only in how the four bar
 * dimensions are derived from the props.
 */
function drawStacks(selection, data, barGen) {
  const groups = selection.selectAll(".sszvis-stack").data(data).join("g").classed("sszvis-stack", true);
  groups.call(barGen);
}
function stackedBarHorizontal() {
  return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const barGen = bar().x(compose(props.xScale, fst)).y(compose(props.yScale, stackAcc)).width(d => props.xScale(d[1]) - props.xScale(d[0])).height(props.height).fill(props.fill).stroke(props.stroke || "#FFFFFF");
    drawStacks(selection, data, barGen);
  });
}
function stackedBarVertical() {
  return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const barGen = bar().x(compose(props.xScale, stackAcc)).y(compose(props.yScale, snd)).width(props.width).height(d => props.yScale(d[0]) - props.yScale(d[1])).fill(props.fill).stroke(props.stroke || "#FFFFFF");
    drawStacks(selection, data, barGen);
  });
}

export { stackedBarHorizontal, stackedBarHorizontalData, stackedBarVertical, stackedBarVerticalData };
//# sourceMappingURL=stackedBar.js.map
