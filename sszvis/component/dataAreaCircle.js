/**
 * @module sszvis/component/dataAreaCircle
 *
 * @returns {d3.component} a circular data area component
 */
namespace('sszvis.component.dataAreaCircle', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('r', d3.functor)
      .prop('dx', d3.functor)
      .prop('dy', d3.functor)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        sszvis.patterns.ensurePattern(selection, 'data-area-pattern')
          .call(sszvis.patterns.dataAreaPattern);

        var dataArea = selection.selectAll('.sszvis-data-area-circle')
          .data(data);

        dataArea.enter()
          .append('circle')
          .classed('sszvis-data-area-circle', true);

        dataArea
          .attr('cx', props.x)
          .attr('cy', props.y)
          .attr('r', props.r)
          .attr('fill', 'url(#data-area-pattern)');

        var dataCaptions = selection.selectAll('.sszvis-data-area-circle-caption')
          .data(data);

        dataCaptions.enter()
          .append('text')
          .classed('sszvis-data-area-circle-caption', true);

        dataCaptions
          .attr('x', props.x)
          .attr('y', props.y)
          .attr('dx', props.dx)
          .attr('dy', props.dy)
          .text(props.caption);
      });
  };

});