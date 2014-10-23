/**
 * Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at it's spine, i.e. the center of
 * the chart.
 *
 * @requires sszvis.component.bar
 *
 * @property {number}   barHeight        The height of a bar
 * @property {d3.scale} barWidth         Scale that returns the width for a datum
 * @property {d3.scale} fill             Scale that returns the color for a datum
 * @property {d3.scale} verticalPosition Scale that returns the vertical position of a bar
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {
  'use strict';

  /* Constants
  ----------------------------------------------- */
  var SPINE_PADDING = 0.5;


  /* Module
  ----------------------------------------------- */
  module.exports = function() {
    return d3.component()
      .prop('barHeight')
      .prop('barWidth')
      .prop('fill')
      .prop('verticalPosition')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


        // Components

        var leftBar = sszvis.component.bar()
          .x(function(d){ return -SPINE_PADDING - props.barWidth(d); })
          .y(props.verticalPosition)
          .height(props.barHeight)
          .width(props.barWidth)
          .fill(props.fill);

        var rightBar = sszvis.component.bar()
          .x(SPINE_PADDING)
          .y(props.verticalPosition)
          .height(props.barHeight)
          .width(props.barWidth)
          .fill(props.fill);

        var leftLine = lineComponent()
          .verticalPosition(props.verticalPosition)
          .barWidth(props.barWidth)
          .mirror(true);

        var rightLine = lineComponent()
          .verticalPosition(props.verticalPosition)
          .barWidth(props.barWidth);


        // Rendering

        selection.selectGroup('left')
          .datum(data.left)
          .call(leftBar);

        selection.selectGroup('right')
          .datum(data.right)
          .call(rightBar);

        selection.selectGroup('leftReference')
          .datum(data.leftReference ? [data.leftReference] : [])
          .call(leftLine);

        selection.selectGroup('rightReference')
          .datum(data.rightReference ? [data.rightReference] : [])
          .call(rightLine);

      });
  };


  function lineComponent() {
    return d3.component()
      .prop('verticalPosition')
      .prop('barWidth')
      .prop('mirror').mirror(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var lineGen = d3.svg.line()
          .x(props.barWidth)
          .y(props.verticalPosition);

        var line = selection.selectAll('.sszvis-path')
          .data(data);

        line.enter()
          .append('path')
          .attr('class', 'sszvis-path')
          .attr('fill', 'none')
          .attr('stroke', '#aaa')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3 3');

        line
          .attr('transform', props.mirror ? 'scale(-1, 1)' : '')
          .transition()
          .call(sszvis.transition)
          .attr('d', lineGen);

        line.exit().remove();
      });
  }

});
