/**
 * Ruler annotation
 *
 * The ruler component can be used to create a vertical line which highlights data at a certain
 * x-value, for instance in a line chart or area chart. The ruler expects data to be bound to
 * the layer it renders into, and it will generate a small dot for each data point it finds.
 *
 * @module sszvis/annotation/ruler
 *
 * @property {number} top                 A number which is the y-position of the top of the ruler line
 * @property {number} bottom              A number which is the y-position of the bottom of the ruler line
 * @property {function} x                 A number or function returning a number for the x-position of the ruler line.
 * @property {function} y                 A function for determining the y-position of the ruler dots. Should take a data
 *                                        value as an argument and return a y-position.
 * @property {function} label             A function for determining the labels of the ruler dots. Should take a
 *                                        data value as argument and return a label.
 * @property {string, function} color     A string or function to specify the color of the ruler dots.
 * @property {function} flip              A boolean or function which returns a boolean that specifies
 *                                        whether the labels on the ruler dots should be flipped. (they default to the right side)
 * @property {function} labelId           An id accessor function for the labels. This is used to match label data to svg elements,
 *                                        and it is used by the reduceOverlap algorithm to match calculated bounds and positions with
 *                                        labels. The default implementation uses the x and y positions of each label, but when labels
 *                                        overlap, these positions are the same (and one will be removed!). It's generally a good idea
 *                                        to provide your own function here, but you should especially use this when multiple labels
 *                                        could overlap with each other. Usually this will be some kind of category accessor function.
 * @property {boolean} reduceOverlap      Use an iterative relaxation algorithm to adjust the positions of the labels (when there is more
 *                                        than one label) so that they don't overlap. This can be computationally expensive, when there are
 *                                        many labels that need adjusting. This is turned off by default.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.annotation.ruler', function(module) {
  'use strict';

  module.exports = function() {

    return d3.component()
      .prop('top')
      .prop('bottom')
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('label').label(d3.functor(''))
      .prop('color')
      .prop('flip', d3.functor).flip(false)
      .prop('labelId', d3.functor)
      .prop('reduceOverlap').reduceOverlap(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var labelId = props.labelId || function(d) { return props.x(d) + '_' + props.y(d) };

        var ruler = selection.selectAll('.sszvis-ruler__rule')
          .data(data, labelId);

        ruler.enter()
          .append('line')
          .classed('sszvis-ruler__rule', true);

        ruler
          .attr('x1', sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x))
          .attr('y1', props.y)
          .attr('x2', sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x))
          .attr('y2', props.bottom);

        ruler.exit().remove();

        var dot = selection.selectAll('.sszvis-ruler__dot')
          .data(data, labelId);

        dot.enter()
          .append('circle')
          .classed('sszvis-ruler__dot', true);

        dot
          .attr('cx', sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x))
          .attr('cy', sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.y))
          .attr('r', 3.5)
          .attr('fill', props.color);

        dot.exit().remove();


        var labelOutline = selection.selectAll('.sszvis-ruler__label-outline')
          .data(data, labelId);

        labelOutline.enter()
          .append('text')
          .classed('sszvis-ruler__label-outline', true);

        labelOutline.exit().remove();


        var label = selection.selectAll('.sszvis-ruler__label')
          .data(data, labelId);

        label.enter()
          .append('text')
          .classed('sszvis-ruler__label', true);

        label.exit().remove();


        // Update both label and labelOutline selections

        var crispX = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.x);
        var crispY = sszvis.fn.compose(sszvis.svgUtils.crisp.halfPixel, props.y);

        var textSelection = selection.selectAll('.sszvis-ruler__label, .sszvis-ruler__label-outline')
          .attr('transform', function(d) {
            var x = crispX(d);
            var y = crispY(d);

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

        if (props.reduceOverlap) {
          var THRESHOLD = 2;
          var ITERATIONS = 10;
          var labelBounds = [];
          // Optimization for the lookup later
          var labelBoundsIndex = {};

          // Reset vertical shift (set by previous renders)
          textSelection.attr('y', '');

          // Create bounds objects
          label.each(function(d) {
            var bounds = this.getBoundingClientRect();
            var item = {
              top: bounds.top,
              bottom: bounds.bottom,
              dy: 0
            };
            labelBounds.push(item);
            labelBoundsIndex[labelId(d)] = item;
          });

          // Sort array in place by vertical position
          // (only supports labels of same height)
          labelBounds.sort(function(a, b) {
            return d3.ascending(a.top, b.top);
          });

          // Calculate overlap and correct position 
          while (--ITERATIONS) {
            labelBounds.forEach(function(firstLabel, index) {
              labelBounds.slice(index + 1).forEach(function(secondLabel) {
                var overlap = firstLabel.bottom - secondLabel.top;
                if (overlap >= THRESHOLD) {
                  var offset = overlap / 2;
                  firstLabel.bottom -= offset;
                  firstLabel.top -= offset;
                  firstLabel.dy -= offset;
                  secondLabel.bottom += offset;
                  secondLabel.top += offset;
                  secondLabel.dy += offset;
                }
              });
            });
          }

          // Shift vertically to remove overlap
          textSelection.attr('y', function(d) {
            var label = labelBoundsIndex[labelId(d)];
            return label.dy;
          });

        }

      });
  };

});
