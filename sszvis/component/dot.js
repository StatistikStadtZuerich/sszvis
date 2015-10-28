/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * @module sszvis/component/dot
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.component.dot', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('radius')
      .prop('stroke')
      .prop('fill')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var dots = selection.selectAll('.sszvis-circle')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-circle', true);

        dots.exit().remove();

        dots
          .attr('stroke', props.stroke)
          .attr('fill', props.fill);

        dots
          .transition()
          .call(sszvis.transition)
          .attr('cx', props.x)
          .attr('cy', props.y)
          .attr('r', props.radius);

        // Tooltip anchors

        var tooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(d) {
            return [props.x(d), props.y(d)];
          });

        selection.call(tooltipAnchor);
      });
  };

});
