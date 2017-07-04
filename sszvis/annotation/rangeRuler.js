/**
 * RangeRuler annotation
 *
 * The range ruler is similar to the handle ruler and the ruler, except for each data
 * point which it finds bound to its layer, it generates two small dots, and a label which
 * states the value of the data point. For an example, see the interactive stacked area charts.
 * Note that the interactive stacked area charts also include the rangeFlag component for highlighting
 * certain specific dots. This is a sepearate component.
 *
 * @module sszvis/annotation/rangeRuler
 *
 * @property {number functor} x            A function for the x-position of the ruler.
 * @property {number functor} y0           A function for the y-position of the lower dot. Called for each datum.
 * @property {number functor} y1           A function for the y-position of the upper dot. Called for each datum.
 * @property {number} top                  A number for the y-position of the top of the ruler
 * @property {number} bottom               A number for the y-position of the bottom of the ruler
 * @property {string functor} label        A function which generates labels for each range.
 * @property {number} total                A number to display as the total of the range ruler (at the top)
 * @property {boolean functor} flip        Determines whether the rangeRuler labels should be flipped (they default to the right side)
 *
 * @return {d3.component}
 */

import d3 from 'd3';

import * as fn from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import { formatNumber } from '../format.js';
import { component } from '../d3-component.js';

export default function() {
  return component()
    .prop('x', fn.functor)
    .prop('y0', fn.functor)
    .prop('y1', fn.functor)
    .prop('top')
    .prop('bottom')
    .prop('label').label(fn.functor(''))
    .prop('total')
    .prop('flip', fn.functor).flip(false)
    .render(function(data) {
      var selection = d3.select(this);
      var props = selection.props();

      var crispX = fn.compose(halfPixel, props.x);
      var crispY0 = fn.compose(halfPixel, props.y0);
      var crispY1 = fn.compose(halfPixel, props.y1);
      var middleY = function(d) {
        return halfPixel((props.y0(d) + props.y1(d)) / 2);
      };

      var dotRadius = 1.5;

      var line = selection.selectAll('.sszvis-rangeRuler__rule')
        .data([0]);

      var newLine = line.enter()
        .append('line')
        .classed('sszvis-rangeRuler__rule', true);

      line.exit().remove();

      line = line.merge(newLine);

      line
        .attr('x1', crispX)
        .attr('y1', props.top)
        .attr('x2', crispX)
        .attr('y2', props.bottom);

      var marks = selection.selectAll('.sszvis-rangeRuler--mark')
        .data(data);

      var enteringMarks = marks.enter()
        .append('g')
        .classed('sszvis-rangeRuler--mark', true);

      marks.exit().remove();

      marks = marks.merge(enteringMarks);

      enteringMarks.append('circle').classed('sszvis-rangeRuler__p1', true);
      enteringMarks.append('circle').classed('sszvis-rangeRuler__p2', true);
      enteringMarks.append('text').classed('sszvis-rangeRuler__label', true);

      marks.selectAll('.sszvis-rangeRuler__p1')
        .data(function(d) { return [d]; })
        .attr('cx', crispX)
        .attr('cy', crispY0)
        .attr('r', dotRadius);

      marks.selectAll('.sszvis-rangeRuler__p2')
        .data(function(d) { return [d]; })
        .attr('cx', crispX)
        .attr('cy', crispY1)
        .attr('r', dotRadius);

      marks.selectAll('.sszvis-rangeRuler__label')
        .data(function(d) { return [d]; })
        .attr('x', function(d) {
          var offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        })
        .attr('y', middleY)
        .attr('dy', '0.35em') // vertically-center
        .style('text-anchor', function(d) {
          return props.flip(d) ? 'end' : 'start';
        })
        .text(fn.compose(formatNumber, props.label));

      var total = selection.selectAll('.sszvis-rangeRuler__total')
        .data([fn.last(data)]);

      var newTotal = total.enter()
        .append('text')
        .classed('sszvis-rangeRuler__total', true);

      total.exit().remove();

      total = total.merge(newTotal);

      total
        .attr('x', function(d) {
          var offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        })
        .attr('y', props.top - 10)
        .style('text-anchor', function(d) {
          return props.flip(d) ? 'end' : 'start';
        })
        .text('Total ' + formatNumber(props.total));
    });
};
