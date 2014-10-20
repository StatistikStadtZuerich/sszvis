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
          rendered = selection.selectAll('rect.sszvis-bar')
            .data(data);

          rendered.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          rendered.exit().remove();

          rendered
            .transition()
            .call(sszvis.transition)
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

          rendered.exit().remove();

          var bars = rendered.selectAll('rect.sszvis-bar')
            .data(function(d) { return d; });

          bars.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          bars.exit().remove();

          bars
            .transition()
            .call(sszvis.transition)
            .attr('x', props.alignmentValue)
            .attr('y', function(d) { return d.y0; })
            .attr('width', props.barWidth)
            .attr('height', function(d) { return d.y; })
            .attr('fill', props.fill);
        } else if (props.renderMode === 'line') {
          var lineGen = d3.svg.line()
            .x(props.alignmentValue)
            .y(props.extentValue);

          rendered = selection.selectAll('path.sszvis-path')
            .data([data]);

          rendered.enter()
            .append('path')
            .classed('sszvis-path', true);

          rendered.exit().remove();

          rendered
            .transition()
            .call(sszvis.transition)
            .attr('d', lineGen)
            .attr('fill', 'none')
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3 3');
        }

        if (props.direction === 'left') {
          // 90deg rotation plus +width
          rendered.attr('transform', 'matrix(0, 1, -1, 0, ' + (props.width - props.groupPadding) + ', 0)');
        } else if (props.direction === 'right') {
          // reflection around y = x plus +width
          rendered.attr('transform', 'matrix(0, 1, 1, 0, ' + (props.width + props.groupPadding) + ', 0)');
        }

      });
  };

});