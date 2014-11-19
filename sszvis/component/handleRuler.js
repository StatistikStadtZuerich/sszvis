/**
 * SlideBar for use in sliding along the x-axis of charts
 *
 * @module  sszvis/component/handleRuler
 *
 */
namespace('sszvis.component.handleRuler', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('top')
      .prop('bottom')
      .prop('label').label(d3.functor(''))
      .prop('color')
      .prop('flip', d3.functor).flip(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var crispX = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x);
        var crispY = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y);

        var bottom = props.bottom - 4;
        var handleWidth = 10;
        var handleHeight = 24;
        var handleTop = props.top - handleHeight;

        var group = selection.selectAll('.sszvis-handleRuler__group')
          .data([0]);

        var entering = group.enter()
          .append('g')
          .classed('sszvis-handleRuler__group', true);

        group.exit().remove();

        entering
          .append('line')
          .classed('sszvis-ruler__rule', true);

        entering
          .append('rect')
          .classed('sszvis-handleRuler__handle', true);

        entering
          .append('line')
          .classed('sszvis-handleRuler__handle-mark', true);

        group.selectAll('.sszvis-ruler__rule')
          .attr('x1', crispX)
          .attr('y1', sszvis.fn.roundPixelCrisp(props.top))
          .attr('x2', crispX)
          .attr('y2', sszvis.fn.roundPixelCrisp(bottom));

        group.selectAll('.sszvis-handleRuler__handle')
          .attr('x', function(d) {
            return crispX(d) - handleWidth / 2;
          })
          .attr('y', sszvis.fn.roundPixelCrisp(handleTop))
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-handleRuler__handle-mark')
          .attr('x1', crispX)
          .attr('y1', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.15))
          .attr('x2', crispX)
          .attr('y2', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.85));

        var dots = group.selectAll('.sszvis-ruler__dot')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-ruler__dot', true);

        dots.exit().remove();

        dots
          .attr('cx', crispX)
          .attr('cy', crispY)
          .attr('r', 3.5)
          .attr('fill', props.color);


        var labelOutline = selection.selectAll('.sszvis-ruler__label-outline')
          .data(data);

        labelOutline.enter()
          .append('text')
          .classed('sszvis-ruler__label-outline', true);

        labelOutline.exit().remove();


        var label = selection.selectAll('.sszvis-ruler__label')
          .data(data);

        label.enter()
          .append('text')
          .classed('sszvis-ruler__label', true);

        label.exit().remove();


        // Update both labelOutline and labelOutline selections

        selection.selectAll('.sszvis-ruler__label, .sszvis-ruler__label-outline')
          .attr('transform', function(d) {
            var x = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x)(d);
            var y = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y)(d);

            var dx = props.flip(d) ? -10 : 10;
            var dy = (y < props.top + dy) ? 2 * dy
                   : (y > props.bottom - dy) ? 0
                   : 5;

            return sszvis.fn.translateString(x + dx, y + dy);
          })
          .style('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .html(props.label);

      });
  };

});
