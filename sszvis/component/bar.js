/**
 * Bar component
 *
 * The bar component is a general-purpose component used to render rectangles, including
 * bars for horizontal and vertical standard and stacked bar charts, bars in the population
 * pyramids, and the boxes of the heat table.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single rectangle. The x-position, y-position, width, and height of each rectangle
 * are then extracted from the data objects using accessor functions.
 *
 * In addition, the user can specify fill and stroke accessor functions. When called, these functions
 * are given each rectangle's data object, and should return a valid fill or stroke color to be applied
 * to the rectangle.
 *
 * The x, y, width, height, fill, and stroke properties may also be specified as constants.
 *
 * @module sszvis/component/bar
 *
 * @property {number, function} x       the x-value of the rectangles. Becomes a functor.
 * @property {number, function} y       the y-value of the rectangles. Becomes a functor.
 * @property {number, function} width   the width-value of the rectangles. Becomes a functor.
 * @property {number, function} height  the height-value of the rectangles. Becomes a functor.
 * @property {string, function} fill    the fill-value of the rectangles. Becomes a functor.
 * @property {string, function} stroke  the stroke-value of the rectangles. Becomes a functor.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.component.bar', function(module) {
  'use strict';

  // replaces NaN values with 0
  function handleMissingVal(v) {
    return isNaN(v) ? 0 : v;
  }

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('width', d3.functor)
      .prop('height', d3.functor)
      .prop('fill', d3.functor)
      .prop('stroke', d3.functor)
      .prop('centerTooltip')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var xAcc = sszvis.fn.compose(handleMissingVal, props.x);
        var yAcc = sszvis.fn.compose(handleMissingVal, props.y);
        var wAcc = sszvis.fn.compose(handleMissingVal, props.width);
        var hAcc = sszvis.fn.compose(handleMissingVal, props.height);

        var bars = selection.selectAll('.sszvis-bar')
          .data(data);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true);

        bars.exit().remove();

        bars
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        bars
          .transition()
          .call(sszvis.transition)
          .attr('x', xAcc)
          .attr('y', yAcc)
          .attr('width', wAcc)
          .attr('height', hAcc);

        // Tooltip anchors
        var tooltipPosition;
        if (props.centerTooltip) {
          tooltipPosition = function(d) {
            return [xAcc(d) + wAcc(d) / 2, yAcc(d) + hAcc(d) / 2];
          };
        } else {
          tooltipPosition = function(d) {
            return [xAcc(d) + wAcc(d) / 2, yAcc(d)];
          };
        }

        var tooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(tooltipPosition);

        selection.call(tooltipAnchor);

      });
  };

});
