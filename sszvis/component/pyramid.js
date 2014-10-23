/**
 * Pyramid Component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('barHeight')
      .prop('barLength')
      .prop('fill')
      .prop('verticalPosition')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


        // Bars

        var leftBar = barComponent()
          .verticalPosition(props.verticalPosition)
          .barHeight(props.barHeight)
          .barLength(props.barLength)
          .fill(props.fill)
          .mirror(true);

        var rightBar = barComponent()
          .verticalPosition(props.verticalPosition)
          .barHeight(props.barHeight)
          .barLength(props.barLength)
          .fill(props.fill);

        selection.selectGroup('left')
          .datum(data.left)
          .call(leftBar);

        selection.selectGroup('right')
          .datum(data.right)
          .call(rightBar);


        // Reference lines

        var leftLine = lineComponent()
          .verticalPosition(props.verticalPosition)
          .barLength(props.barLength)
          .mirror(true);

        var rightLine = lineComponent()
          .verticalPosition(props.verticalPosition)
          .barLength(props.barLength);

        selection.selectGroup('leftReference')
          .datum(data.leftReference ? [data.leftReference] : [])
          .call(leftLine);

        selection.selectGroup('rightReference')
          .datum(data.rightReference ? [data.rightReference] : [])
          .call(rightLine);

      });
  };

  function barComponent() {
    return d3.component()
      .prop('verticalPosition')
      .prop('barHeight')
      .prop('barLength')
      .prop('fill')
      .prop('mirror').mirror(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bar = selection.selectAll('.sszvis-bar')
          .data(data);

        bar.enter()
          .append('rect')
          .attr('class', 'sszvis-bar');

        bar
          .attr('fill', props.fill)
          .attr('transform', props.mirror ? 'scale(-1, 1)' : '')
          .transition()
          .call(sszvis.transition)
          .attr('x', 0.5)
          .attr('y', props.verticalPosition)
          .attr('height', props.barHeight)
          .attr('width', props.barLength);

        bar.exit().remove();
      });
  }

  function lineComponent() {
    return d3.component()
      .prop('verticalPosition')
      .prop('barLength')
      .prop('mirror').mirror(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var lineGen = d3.svg.line()
          .x(props.barLength)
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
