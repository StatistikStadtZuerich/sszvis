/**
 * @module sszvis/component/dataAreaLine
 *
 * @returns {d3.component} a linear data area component (reference line)
 */
namespace('sszvis.component.dataAreaLine', function(module) {

  // reference line specified in the form y = mx + b
  // user supplies m and b
  // default line is y = x

  module.exports = function() {
    return d3.component()
      .prop('m').m(1)
      .prop('b').b(0)
      .prop('xScale')
      .prop('yScale')
      .prop('xRange')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var y1 = props.yScale(props.m * props.xScale.invert(props.xRange[0]) + props.b);
        var y2 = props.yScale(props.m * props.xScale.invert(props.xRange[1]) + props.b);

        var line = selection.selectAll('.sszvis-reference-line')
          .data(data);

        line.enter()
          .append('line')
          .classed('sszvis-reference-line', true);

        line.exit().remove();

        line
          .attr('x1', props.xRange[0])
          .attr('y1', y1)
          .attr('x2', props.xRange[1])
          .attr('y2', y2);
      });
  };

});