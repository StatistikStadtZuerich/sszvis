/**
 * Stacked Chart
 * @return {d3.component}
 */

namespace('sszvis.component.stacked.areaMultiples', function(module) {
'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y0')
      .prop('y1')
      .prop('fill')
      .prop('stroke')
      .prop('key').key(function(d, i){ return i; })
      .prop('valuesAccessor').valuesAccessor(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        data = data.slice().reverse();

        var areaGen = d3.svg.area()
          .x(props.x)
          .y0(props.y0)
          .y1(props.y1);

        var paths = selection.selectAll('path.sszvis-path')
          .data(data, props.key);

        paths.enter()
          .append('path')
          .classed('sszvis-path', true)
          .attr('fill', props.fill);

        paths.exit().remove();

        paths
          .transition()
          .call(sszvis.transition)
          .attr('d', sszvis.fn.compose(areaGen, props.valuesAccessor))
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});
