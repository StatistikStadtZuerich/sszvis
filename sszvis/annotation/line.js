/**
 * @module sszvis/annotation/line
 *
 * A component for creating reference line data areas. The component should be passed
 * an array of data values, each of which will be used to render a reference line
 * by passing it through the accessor functions. You can specify a caption to display,
 * which will be positioned by default at the midpoint of the line you specify,
 * aligned with the angle of the line. The caption can be offset from the midpoint
 * by specifying dx or dy properties.
 *
 * @returns {d3.component} a linear data area component (reference line)
 */
namespace('sszvis.annotation.line', function(module) {

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
      .prop('dx', d3.functor).dx(0)
      .prop('dy', d3.functor).dy(0)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var x1 = props.xRange[0];
        var x2 = props.xRange[1];
        var y1 = props.yScale(props.m * props.xScale.invert(x1) + props.b);
        var y2 = props.yScale(props.m * props.xScale.invert(x2) + props.b);

        var line = selection.selectAll('.sszvis-reference-line')
          .data(data);

        line.enter()
          .append('line')
          .classed('sszvis-reference-line', true);

        line.exit().remove();

        line
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2);

        if (props.caption) {
          var caption = selection.selectAll('.sszvis-reference-line__caption')
            .data([0]);

          caption.enter()
            .append('text')
            .classed('sszvis-reference-line__caption', true);

          caption.exit().remove();

          caption
            .attr('transform', function() {
              var vx = x2 - x1;
              var vy = y2 - y1;
              var angle = Math.atan2(vy, vx) * 180 / Math.PI;
              var rotation;
              if (angle > 0) {
                // in top half
                rotation = angle < 90 ? -angle : angle;
              } else {
                // in bottom semicircle
                rotation = angle > -90 ? -angle : angle; // display angle math is weird
              }
              return 'translate(' + ((x1 + x2) / 2) + ',' + ((y1 + y2) / 2) + ') rotate(' + (angle) + ')';
            })
            .attr('dx', props.dx)
            .attr('dy', props.dy)
            .text(props.caption);
        }
      });
  };

});
