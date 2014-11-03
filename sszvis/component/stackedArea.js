/**
 * Stacked Chart
 * @return {d3.component}
 */

// FIXME: rename namespace or component to be consistent with file system
namespace('sszvis.component.stacked.area', function(module) {

  module.exports = function() {
    return d3.component()
      // NOTE why not just x()? Is this in line with other components
      .prop('xAccessor')
      .prop('xScale')
      // NOTE why not just y()? Is this in line with other components
      .prop('yAccessor')
      .prop('yScale')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var stackLayout = d3.layout.stack()
          .x(props.xAccessor)
          .y(props.yAccessor);

        var areaGen = d3.svg.area()
          .x(sszvis.fn.compose(props.xScale, props.xAccessor))
          .y0(function(d) { return props.yScale(d.y0); })
          .y1(function(d) { return props.yScale(d.y0 + d.y); });

        var paths = selection.selectAll('path.sszvis-path')
          .data(stackLayout(data));

        paths.enter()
          .append('path')
          .classed('sszvis-path', true)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        paths.exit().remove();

        paths
          .transition()
          .call(sszvis.transition)
          .attr('d', areaGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});
