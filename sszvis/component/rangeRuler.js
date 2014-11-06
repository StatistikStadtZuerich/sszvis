/**
 * RangeRuler component
 *
 * @return {d3.component} range-based rule component (see stacked area chart example)
 */
namespace('sszvis.component.rangeRuler', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y0', d3.functor)
      .prop('y1', d3.functor)
      .prop('top')
      .prop('bottom')
      .prop('label').label(sszvis.fn.constant(''))
      .prop('total')
      .prop('flip', d3.functor).flip(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var middleY = function(d) { return (props.y0(d) + props.y1(d)) / 2; };
        var dotRadius = 1.5;

        var line = selection.selectAll('.sszvis-rangeRuler--rule')
          .data([1]);

        line.enter()
          .append('line')
          .classed('sszvis-rangeRuler--rule', true);

        line.exit().remove();

        line
          .attr('x1', props.x)
          .attr('y1', props.top)
          .attr('x2', props.x)
          .attr('y2', props.bottom);

        var marks = selection.selectAll('.sszvis-rangeRuler--mark')
          .data(data);

        var enteringMarks = marks.enter()
          .append('g')
          .classed('sszvis-rangeRuler--mark', true);

        marks.exit().remove();

        enteringMarks.append('circle').classed('sszvis-rangeRuler--p1', true);
        enteringMarks.append('circle').classed('sszvis-rangeRuler--p2', true);
        enteringMarks.append('text').classed('sszvis-rangeRuler--label', true);

        marks.selectAll('.sszvis-rangeRuler--p1')
          .data(function(d) { return [d]; })
          .attr('cx', props.x)
          .attr('cy', props.y0)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--p2')
          .data(function(d) { return [d]; })
          .attr('cx', props.x)
          .attr('cy', props.y1)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--label')
          .data(function(d) { return [d]; })
          .attr('x', function(d, i) {
            var offset = props.flip(d) ? -10 : 10;
            return props.x(d) + offset;
          })
          .attr('y', middleY)
          .attr('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .text(props.label);

        var total = selection.selectAll('.sszvis-rangeRuler--total')
          .data([sszvis.fn.last(data)]);

        total.enter()
          .append('text')
          .classed('sszvis-rangeRuler--total', true);

        total.exit().remove();

        total
          .attr('x', function(d, i) {
            var offset = props.flip(d) ? -10 : 10;
            return props.x(d) + offset;
          })
          .attr('y', props.top - 10)
          .attr('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .text('Total ' + sszvis.format.number(props.total));
      });
  };

});
