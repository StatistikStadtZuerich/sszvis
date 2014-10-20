/**
 * @module sszvis/component/dataAreaRectangle
 *
 * @returns {d3.component} a rectangular data area component
 */
namespace('sszvis.component.dataAreaRectangle', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('width', d3.functor)
      .prop('height', d3.functor)
      .prop('dx', d3.functor)
      .prop('dy', d3.functor)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        sszvis.patterns.ensurePattern(selection, 'data-area-pattern')
          .call(sszvis.patterns.dataAreaPattern);

        var dataArea = selection.selectAll('.sszvis-data-area-rectangle')
          .data(data);

        dataArea.enter()
          .append('rect')
          .classed('sszvis-data-area-rectangle', true);

        dataArea
          .attr('x', props.x)
          .attr('t', props.y)
          .attr('width', props.width)
          .attr('height', props.height)
          .attr('fill', 'url(#data-area-pattern)');

        if (props.caption) {
          var dataCaptions = selection.selectAll('.sszvis-data-area-rectangle-caption')
            .data(data);

          dataCaptions.enter()
            .append('text')
            .classed('sszvis-data-area-rectangle-caption', true);

          dataCaptions
            .attr('x', function(d, i) {
              return props.x(d, i) + props.width(d, i) / 2;
            })
            .attr('y', function(d, i) {
              return props.y(d, i) + props.height(d, i) / 2;
            })
            .attr('dx', props.dx)
            .attr('dy', props.dy)
            .text(props.caption);
        }
      });
  }

});