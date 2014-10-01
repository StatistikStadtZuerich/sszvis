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
          var stackLayout = d3.layout.stack()
            .x(props.alignmentValue)
            .y(props.extentValue);

          rendered = selection.selectAll('g.sszvis-g')
            .data(stackLayout(data));

          rendered.enter()
            .append('g')
            .classed('sszvis-g', true);

          var bars = rendered.selectAll('rect')
            .data(sszvis.fn.identity);

          bars.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          bars
            .attr('x', props.alignmentValue)
            .attr('y', function(d) { return d.y0; })
            .attr('width', props.barWidth)
            .attr('height', function(d) { return d.y; })
            .attr('fill', props.fill);
        } else if (props.renderMode === 'line') {
          var lineGen = d3.svg.line()
            .x(props.alignmentValue)
            .y(props.extentValue);

          rendered = selection.selectAll('path')
            .data(data);

          rendered.enter()
            .append('path')
            .classed('sszvis-path', true);

          rendered
            .attr('d', lineGen);
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