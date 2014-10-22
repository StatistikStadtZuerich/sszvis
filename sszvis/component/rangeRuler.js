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
      .prop('y0', d3.functor).y0(sszvis.fn.prop('y0'))
      .prop('dy', d3.functor).dy(sszvis.fn.prop('y'))
      .prop('yScale')
      .prop('label').label(sszvis.fn.constant(''))
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var y0 = sszvis.fn.compose(props.yScale, props.y0);
        var y1 = sszvis.fn.compose(props.yScale, function(d) { return props.y0(d) + props.dy(d); });
        var ty = sszvis.fn.compose(props.yScale, function(d) { return props.y0(d) + props.dy(d) / 2; });
        var top = y1(sszvis.fn.last(data));
        var bottom = d3.max(props.yScale.range());
        var dotRadius = 1.5;

        var totalValue = data.reduce(function(m, d) {
          return m + props.dy(d);
        }, 0);

        var line = selection.selectAll('.sszvis-rangeRuler--rule')
          .data([1]);

        line.enter()
          .append('line')
          .classed('sszvis-rangeRuler--rule', true);

        line.exit().remove();

        line
          .attr('x1', props.x)
          .attr('y1', top)
          .attr('x2', props.x)
          .attr('y2', bottom);

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
          .attr('cy', y0)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--p2')
          .data(function(d) { return [d]; })
          .attr('cx', props.x)
          .attr('cy', y1)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--label')
          .data(function(d) { return [d]; })
          .attr('x', function(d, i) {
            return props.x(d, i) + 10;
          })
          .attr('y', ty)
          .text(props.label);

        var total = selection.selectAll('.sszvis-rangeRuler--total')
          .data([totalValue]);

        total.enter()
          .append('text')
          .classed('sszvis-rangeRuler--total', true);

        total.exit().remove();

        total
          .attr('x', function(d, i) {
            return props.x(d, i) + 10;
          })
          .attr('y', top - 10)
          .text('Total ' + sszvis.format.number(totalValue));
      });
  };

});