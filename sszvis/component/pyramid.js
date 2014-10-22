/**
 * Pyramid Component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('width')
      .prop('height')
      .prop('groupPadding')
      .prop('alignmentValue')
      .prop('barWidth')
      .prop('extentValue')
      .prop('fill')
      .prop('renderMode')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


        // Bars

        var leftBar = barComponent()
          .alignmentValue(props.alignmentValue)
          .barWidth(props.barWidth)
          .extentValue(props.extentValue)
          .fill(props.fill)
          .transform(transformLeft(props.width - props.groupPadding));


        var rightBar = barComponent()
          .alignmentValue(props.alignmentValue)
          .barWidth(props.barWidth)
          .extentValue(props.extentValue)
          .fill(props.fill)
          .transform(transformRight(props.width + props.groupPadding));

        selection.selectGroup('left')
          .datum(data.left)
          .call(leftBar);

        selection.selectGroup('right')
          .datum(data.right)
          .call(rightBar);


        // Reference lines

        var leftLine = lineComponent()
          .alignmentValue(props.alignmentValue)
          .extentValue(props.extentValue)
          .transform(transformLeft(props.width - props.groupPadding));

        var rightLine = lineComponent()
          .alignmentValue(props.alignmentValue)
          .extentValue(props.extentValue)
          .transform(transformRight(props.width + props.groupPadding));

        selection.selectGroup('leftReference')
          .datum(data.leftReference ? [data.leftReference] : [])
          .call(leftLine);

        selection.selectGroup('rightReference')
          .datum(data.rightReference ? [data.rightReference] : [])
          .call(rightLine);

      });
  };

  function transformLeft(width) {
    // 90deg rotation plus +width
    return 'matrix(0, 1, -1, 0, ' + width + ', 0)';
  }

  function transformRight(width) {
    // reflection around y = x plus +width
    return 'matrix(0, 1, 1, 0, ' + width + ', 0)';
  }

  function barComponent() {
    return d3.component()
      .prop('alignmentValue')
      .prop('barWidth')
      .prop('extentValue')
      .prop('fill')
      .prop('transform')
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
          .attr('transform', props.transform)
          .transition()
          .call(sszvis.transition)
          .attr('x', props.alignmentValue)
          .attr('y', 0)
          .attr('width', props.barWidth)
          .attr('height', props.extentValue);

        bar.exit().remove();
      });
  }

  function lineComponent() {
    return d3.component()
      .prop('alignmentValue')
      .prop('extentValue')
      .prop('transform')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var lineGen = d3.svg.line()
          .x(props.alignmentValue)
          .y(props.extentValue);

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
          .attr('transform', props.transform)
          .transition()
          .call(sszvis.transition)
          .attr('d', lineGen);

        line.exit().remove();
      });
  }

});
