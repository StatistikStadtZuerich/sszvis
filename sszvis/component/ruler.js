
/**
 * Ruler component
 * @return {d3.component}
 */
namespace('sszvis.component.ruler', function(module) {
  'use strict';

  module.exports = function() {

    var fn = sszvis.fn;

    return d3.component()
      .prop('top')
      .prop('bottom')
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('label').label(fn.constant(''))
      .prop('color')
      .prop('flip', d3.functor).flip(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var key = function(d) {
          return props.x(d) + '_' + props.y(d);
        };

        // FIXME: in situations with multiple data points - e.g. when displaying multiple dots,
        // this generates multiple lines. When the lines overlap in the same place, they're redundant,
        // when they show up in separate places, this is a potentially useful, but surprising and undocumented
        // feature. Perhaps this behavior should be either documented or removed.
        var ruler = selection.selectAll('.sszvis-ruler__rule')
          .data(data, key);

        ruler.enter()
          .append('line')
          .classed('sszvis-ruler__rule', true);

        ruler
          .attr('x1', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x))
          .attr('y1', props.y)
          .attr('x2', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x))
          .attr('y2', props.bottom);

        ruler.exit().remove();

        var dot = selection.selectAll('.sszvis-ruler__dot')
          .data(data, key);

        dot.enter()
          .append('circle')
          .classed('sszvis-ruler__dot', true);

        dot
          .attr('cx', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x))
          .attr('cy', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y))
          .attr('r', 3.5)
          .attr('fill', props.color);

        dot.exit().remove();

        var label = selection.selectAll('.sszvis-ruler__label')
          .data(data, key);

        label.enter()
          .append('text')
          .classed('sszvis-ruler__label', true);

        label
          .attr('x', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x))
          .attr('y', sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y))
          .attr('dx', function(d) {
            return props.flip(d) ? -10 : 10;
          })
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (props.y(d) < props.top + baselineShift)    return 2 * baselineShift;
            if (props.y(d) > props.bottom - baselineShift) return 0;
            return baselineShift;
          })
          .attr('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .text(props.label);

        label.exit().remove();

      });
  };

});
