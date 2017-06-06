/**
 * Pie component
 *
 * The pie component is used to draw pie charts. It uses the d3.arc() generator
 * to create pie wedges.
 *
 * THe input data should be an array of data values, where each data value represents one wedge in the pie.
 *
 * @module sszvis/component/pie
 *
 * @property {number} radius                  The radius of the pie chart (no default)
 * @property {string, function} fill          a fill color for wedges in the pie (default black). Ideally a function
 *                                            which takes a data value.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default none)
 * @property {string, function} angle         specifys the angle of the wedges in radians. Theoretically this could be
 *                                            a constant, but that would make for a very strange pie. Ideally, this
 *                                            is a function which takes a data value and returns the angle in radians.
 *
 * @return {d3.component}
*/

import d3 from 'd3';

import * as fn from '../fn.js';
import transition from '../transition.js';
import tooltipAnchor from '../annotation/tooltipAnchor.js';

export default function() {
  return d3.component()
    .prop('radius')
    .prop('fill')
    .prop('stroke')
    .prop('angle', fn.functor)
    .render(function(data) {
      var selection = d3.select(this);
      var props = selection.props();

      var angle = 0;
      data.forEach(function(value) {
        // In order for an angle transition to work correctly in d3, the transition must be done in data space.
        // The computed arc path itself cannot be interpolated without error.
        // see http://bl.ocks.org/mbostock/5100636 for a straightforward example.
        // However, due to the structure of sszvis and the way d3 data joining works, this poses a bit of a challenge,
        // since old and new data values could be on different objects, and they need to be merged.
        // In the code that follows, value._a0 and value._a1 are the destination angles for the transition.
        // value.a0 and value.a1 are the current values in the transition (either the initial value, some intermediate value, or the final angle value).
        value._a0 = angle;
        // These a0 and a1 values may be overwritten later if there is already data bound at this data index. (see the .each function further down).
        if (isNaN(value.a0)) value.a0 = angle;
        angle += props.angle(value);
        value._a1 = angle;
        // data values which don't already have angles set start out at the complete value.
        if (isNaN(value.a1)) value.a1 = angle;
      });

      var arcGen = d3.arc()
        .innerRadius(4)
        .outerRadius(props.radius)
        .startAngle(function(d) { return d.a0; })
        .endAngle(function(d) { return d.a1; });

      var segments = selection.selectAll('.sszvis-path')
        .each(function(d, i) {
          // This matches the data values iteratively in the same way d3 will when it does the data join.
          // This is kind of a hack, but it's the only way to get any existing angle values from the already-bound data
          if (data[i]) {
            data[i].a0 = d.a0;
            data[i].a1 = d.a1;
          }
        })
        .data(data);

      var newSegments = segments.enter()
        .append('path')
        .classed('sszvis-path', true)
        .attr('transform', 'translate(' + (props.radius) + ',' + (props.radius) + ')')
        .attr('fill', props.fill)
        .attr('stroke', props.stroke);

      segments.exit().remove();

      segments = segments.merge(newSegments);

      segments
        .transition()
        .call(transition)
        .attr('transform', 'translate(' + (props.radius) + ',' + (props.radius) + ')')
        .attrTween('d', function(d) {
          var angle0Interp = d3.interpolate(d.a0, d._a0);
          var angle1Interp = d3.interpolate(d.a1, d._a1);
          return function(t) {
            d.a0 = angle0Interp(t);
            d.a1 = angle1Interp(t);
            return arcGen(d);
          };
        })
        .attr('fill', props.fill)
        .attr('stroke', props.stroke);

      var ta = tooltipAnchor()
        .position(function(d) {
          // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
          // makes the same correction to svg.arc() angles :o
          var a = d.a0 + (Math.abs(d.a1 - d.a0) / 2) - Math.PI/2;
          var r = props.radius * 2/3;
          return [props.radius + Math.cos(a) * r, props.radius + Math.sin(a) * r];
        });

      selection
        .datum(data)
        .call(ta);

    });
};
