/**
 * Stacked Bar Chart
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
