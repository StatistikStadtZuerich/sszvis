/**
 * Pyramid Component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('width')
      .prop('height')
      .prop('groupPadding')
      .prop('alignmentValue')
      .prop('barWidth')
      .prop('extentValue')
      .prop('fill')
      .prop('direction') // links, rechts
      .prop('renderMode').renderMode('bar') // bar, stacked, line
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var rendered;
        if (props.renderMode === 'bar') {
          rendered = selection.selectAll('rect')
            .data(data);

          rendered.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          rendered
            .attr('x', props.alignmentValue)
            .attr('y', 0)
            .attr('width', props.barWidth)
            .attr('height', props.extentValue)
            .attr('fill', props.fill);
        } else if (props.renderMode === 'stacked') {

        } else if (props.renderMode === 'line') {

        }

        if (props.direction === 'links') {
          // reflects the shape over the line y = -x plus +width and +height translation
          rendered.attr('transform', 'matrix(0 -1 -1 0 ' + (props.width - props.groupPadding) + ' ' + props.height + ')');
        } else if (props.direction === 'rechts') {
          // -90deg rotation plus +width and +height translation
          rendered.attr('transform', 'matrix(0 -1 1 0 ' + (props.width + props.groupPadding) + ' ' + props.height + ')');
        }

      });
  };

});