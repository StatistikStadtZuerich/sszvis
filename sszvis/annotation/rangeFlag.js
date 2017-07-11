/**
 * Range Flag annotation
 *
 * The range flag component creates a pair of small white circles which fit well with the range ruler.
 * However, this is a separate component for implementation reasons, because the data for the range flag
 * should usually be only one value, distinct from the range ruler which expects multiple values. The range
 * flag also creates a tooltip anchor between the two dots, to which you can attach a tooltip. See the
 * interactive stacked area chart examples for a use of the range flag.
 *
 * @module sszvis/annotation/rangeFlag
 *
 * @property {number functor} x           A value for the x-value of the range flag
 * @property {number functor} y0          A value for the y-value of the lower range flag dot
 * @property {number functor} y1          A value for the y-value of the upper range flag dot
 *
 * @returns {sszvis.component}
 */

import {select} from 'd3';

import * as fn from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';

export default function() {
  return component()
    .prop('x', fn.functor)
    .prop('y0', fn.functor)
    .prop('y1', fn.functor)
    .render(function(data) {
      var selection = select(this);
      var props = selection.props();

      var crispX = fn.compose(halfPixel, props.x);
      var crispY0 = fn.compose(halfPixel, props.y0);
      var crispY1 = fn.compose(halfPixel, props.y1);

      selection.selectAll('.sszvis-rangeFlag__mark.bottom')
        .data(data)
        .call(makeFlagDot('bottom', crispX, crispY0));

      selection.selectAll('.sszvis-rangeFlag__mark.top')
        .data(data)
        .call(makeFlagDot('top', crispX, crispY1));

      var ta = tooltipAnchor()
        .position(function(d) {
          return [crispX(d), halfPixel((props.y0(d) + props.y1(d)) / 2)];
        });

      selection.call(ta);
    });
};

function makeFlagDot(classed, cx, cy) {
  return function(dot) {
    var newDot = dot.enter()
      .append('circle')
      .classed('sszvis-rangeFlag__mark', true)
      .classed(classed, true);

    dot.exit().remove();

    dot = dot.merge(newDot);

    dot
      .attr('r', 3.5)
      .attr('cx', cx)
      .attr('cy', cy);
  };
}
