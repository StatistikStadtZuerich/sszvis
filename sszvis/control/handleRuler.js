/**
 * Ruler with a handle control
 *
 * The handle ruler component is very similar to the ruler component, except that it is rendered
 * with a 24-pixel tall handle at the top. It is moved and repositioned in the same manner as a ruler,
 * so the actual interaction with the handle is up to the developer to specify. This component also
 * creates dots for each data point it finds bound to its layer.
 *
 * @module sszvis/control/handleRuler
 *
 * @property {function} x                   A function or number which determines the x-position of the ruler
 * @property {function} y                   A function which determines the y-position of the ruler dots. Passed data values.
 * @property {number} top                   A number for the y-position of the top of the ruler.
 * @property {number} bottom                A number for the y-position of the bottom of the ruler.
 * @property {string, function} label       A string or string function for the labels of the ruler dots.
 * @property {string, function} color       A string or color for the fill color of the ruler dots.
 * @property {boolean, function} flip       A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)
 *
 * @returns {d3.component}
 */
namespace('sszvis.control.handleRuler', function(module) {
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

        // NOTE can you explain what is going on here
        var crispX = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x);
        var crispY = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.y);

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
          .attr('y1', sszvis.svgUtils.crisp.halfPixel(props.top))
          .attr('x2', crispX)
          .attr('y2', sszvis.svgUtils.crisp.halfPixel(bottom));

        group.selectAll('.sszvis-handleRuler__handle')
          .attr('x', function(d) {
            return crispX(d) - handleWidth / 2;
          })
          .attr('y', sszvis.svgUtils.crisp.halfPixel(handleTop))
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-handleRuler__handle-mark')
          .attr('x1', crispX)
          .attr('y1', sszvis.svgUtils.crisp.halfPixel(handleTop + handleHeight * 0.15))
          .attr('x2', crispX)
          .attr('y2', sszvis.svgUtils.crisp.halfPixel(handleTop + handleHeight * 0.85));

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
            var x = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x)(d);
            var y = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.y)(d);

            var dx = props.flip(d) ? -10 : 10;
            var dy = (y < props.top + dy) ? 2 * dy
                   : (y > props.bottom - dy) ? 0
                   : 5;

            return sszvis.svgUtils.translateString(x + dx, y + dy);
          })
          .style('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .html(props.label);

      });
  };

});
