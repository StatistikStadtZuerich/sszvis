
/**
 * Ruler component
 * @return {d3.component}
 */
namespace('sszvis.component.ruler', function(module) {
  'use strict';

  module.exports = function() {

    var fn = sszvis.fn;

    return d3.component()
      .prop('x', d3.functor).x(fn.identity)
      .prop('y', d3.functor).y(fn.identity)
      .prop('xScale')
      .prop('yScale')
      .prop('label').label(fn.constant(''))
      .prop('color')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var key = function(d) {
          return props.x(d) + '_' + props.y(d);
        };

        var x = fn.compose(props.xScale, props.x);
        var y = fn.compose(props.yScale, props.y);
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range());

        // FIXME: in situations with multiple data points - e.g. when displaying multiple dots,
        // this generates multiple lines. When the lines overlap in the same place, they're redundant,
        // when they show up in separate places, this is a potentially useful, but surprising and undocumented
        // feature. Perhaps this behavior should be either documented or removed.
        var ruler = selection.selectAll('.sszvis-ruler-rule')
          .data(data, key);

        ruler.enter()
          .append('line')
          .classed('sszvis-ruler-rule', true);

        ruler
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x)
          .attr('y2', bottom);

        ruler.exit().remove();

        var dot = selection.selectAll('.sszvis-ruler-dot')
          .data(data, key);

        dot.enter()
          .append('circle')
          .classed('sszvis-ruler-dot', true);

        dot
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 3.5)
          .attr('fill', props.color);

        dot.exit().remove();

        var label = selection.selectAll('.sszvis-ruler-label')
          .data(data, key);

        label.enter()
          .append('text')
          .classed('sszvis-ruler-label', true);

        label
          .attr('x', x)
          .attr('y', y)
          .attr('dx', 10)
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (y(d) < top + baselineShift)    return 2 * baselineShift;
            if (y(d) > bottom - baselineShift) return 0;
            return baselineShift;
          })
          .text(props.label);

        label.exit().remove();

      });
  };

});
