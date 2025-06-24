/**
 * d3 plugin to simplify creating reusable charts. Implements
 * the reusable chart interface and can thus be used interchangeably
 * with any other reusable charts.
 *
 * @example
 * var myAxis = sszvis.component()
 *   .prop('ticks').ticks(10)
 *   .render(function(data, i, j) {
 *     var selection = select(this);
 *     var props = selection.props();
 *     var axis = d3.svg.axis().ticks(props.ticks);
 *     selection
 *       .append('g')
 *       .call(axis);
 *   })
 * console.log(myAxis.ticks()); //=> 10
 * select('svg').call(myAxis.ticks(3));
 *
 * @see http://bost.ocks.org/mike/chart/
 *
 * @property {function} prop Define a property accessor
 * @property {function} render The chart's body
 *
 * @return {sszvis.component} A d3 reusable chart
 */
export function component(): sszvis.component;
//# sourceMappingURL=d3-component.d.ts.map