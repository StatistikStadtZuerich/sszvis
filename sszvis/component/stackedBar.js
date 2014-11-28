/**
 * FIXME
 * Stacked Bar Chart
 *
 * This component includes both the vertical and horizontal stacked bar chart components.
 * Both are variations on the same concept, and they both use the same abstract intermediate
 * representation for the stack, but are rendered using different dimensions. Note that using
 * this component will add the properties 'y0' and 'y' to any passed-in data objects, as part of
 * computing the stack intermediate representation. Existing properties with these names will be
 * overwritten.
 *
 * @module sszvis/component/stacked
 *
 * @property {function} xAccessor           Specifies an x-accessor for the stack layout. The result of this function
 *                                          is used to compute the horizontal extent of each element in the stack.
 *                                          The return value must be a number.
 * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
 *                                          the elements of each stack, both the left offset value and the width of each stack segment.
 * @property {number, function} width       Specifies a width for the bars in the stack layout. This value is not used in the
 *                                          horizontal orientation. (xScale is used instead).
 * @property {function} yAccessor           The y-accessor. The return values of this function are used to group elements together as stacks.
 * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
 * @property {number, function} height      Specify the height of each rectangle. This value determines the height of each element in the stacks.
 * @property {string, function} fill        Specify a fill value for the rectangles (default black).
 * @property {string, function} stroke      Specify a stroke value for the stack rectangles (default none).
 * @property {string} orientation           Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart.
 *                                          Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.
 *
 * @return {d3.component}
 */
namespace('sszvis.component.stacked', function(module) {
  'use strict';

  function stackedBar() {
    return d3.component()
      .prop('xAccessor', d3.functor)
      .prop('xScale', d3.functor)
      .prop('width', d3.functor)
      .prop('yAccessor', d3.functor)
      .prop('yScale', d3.functor)
      .prop('height', d3.functor)
      .prop('fill')
      .prop('stroke')
      .prop('orientation').orientation('vertical')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var isHorizontal = props.orientation === 'horizontal';

        if (!isHorizontal) {
          data = data.slice().reverse();
        }

        var stackLayout = d3.layout.stack()
          .x(isHorizontal ? props.yAccessor : props.xAccessor)
          .y(isHorizontal ? props.xAccessor : props.yAccessor);

        var xValue, yValue, widthValue, heightValue;

        if (isHorizontal) {
          xValue = function(d) { return props.xScale(d.y0); };
          yValue = function(d) { return props.yScale(props.yAccessor(d)); };
          widthValue = function(d) { return props.xScale(d.y0 + d.y) - props.xScale(d.y0); };
          heightValue = function() { return props.height.apply(this, arguments); };
        } else {
          xValue = function(d) { return props.xScale(props.xAccessor(d)); };
          yValue = function(d) { return props.yScale(d.y0 + d.y); };
          widthValue = function(d) { return props.width.apply(this, arguments); };
          heightValue = function(d) { return props.yScale(d.y0) - props.yScale(d.y0 + d.y); };
        }

        var barGen = sszvis.component.bar()
          .x(xValue)
          .y(yValue)
          .width(widthValue)
          .height(heightValue)
          .fill(props.fill)
          .stroke(props.stroke);

        var groups = selection.selectAll('.sszvis-stack')
          .data(stackLayout(data));

        groups.enter()
          .append('g')
          .classed('sszvis-stack', true);

        groups.exit().remove();

        groups.call(barGen);
      });
  }

  module.exports.verticalBar = function() { return stackedBar().orientation('vertical'); };

  module.exports.horizontalBar = function() { return stackedBar().orientation('horizontal'); };

});
