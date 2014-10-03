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

        var anchor = selection.selectAll('[data-tooltip-anchor]')
          .data(data);

        anchor.enter()
          .append('g')
          .attr('data-tooltip-anchor', '');

        anchor
          .attr('transform', fn.compose(translate, props.position));

        anchor.exit().remove();


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

  function translate(position) {
    return 'translate('+ position[0] +','+ position[1] +')';
  }

});
