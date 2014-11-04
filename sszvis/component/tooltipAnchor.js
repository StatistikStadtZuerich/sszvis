/**
 * Tooltip Anchor
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltipAnchor', function(module) {

  var fn = sszvis.fn;

  module.exports = function() {

    return d3.component()
      .prop('debug')
      .prop('position').position(d3.functor([0, 0]))
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        Array.isArray(data) || (data = [data]);

        var anchor = selection.selectAll('[data-tooltip-anchor]')
          .data(data);

          // NOTE why are anchors rects? 
          // NOTE as these rects are invisible, couldn't they're information just be stored in the data? 
        anchor.enter()
          .append('rect')
          .attr('height', 1)
          .attr('width', 1)
          .attr('fill', 'none')
          .attr('stroke', 'none')
          .attr('visibility', 'none')
          .attr('pointer-events', 'none')
          .attr('data-tooltip-anchor', '');

        anchor.exit().remove();

        anchor
          .attr('transform', fn.compose(translate, props.position));

        if (props.debug) {
          var referencePoint = selection.selectAll('[data-tooltip-anchor-debug]')
            .data(data);

          referencePoint.enter()
            .append('circle')
            .attr('data-tooltip-anchor-debug', '');

          referencePoint
            .attr('r', 2)
            .attr('fill', '#fff')
            .attr('stroke', '#f00')
            .attr('stroke-width', 1.5)
            .attr('transform', fn.compose(translate, props.position));

          referencePoint.exit().remove();
        }

      });

  };

  // NOTE very useful function. it could be moved into sszvis.fn, so its accessible from other places
  function translate(position) {
    return 'translate('+ position[0] +','+ position[1] +')';
  }

});
