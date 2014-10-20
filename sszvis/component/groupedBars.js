/**
 * Grouped Bars
 * @return {d3.component}
 */
namespace('sszvis.component.groupedBars', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('groupScale')
      .prop('groupSize')
      .prop('groupWidth')
      .prop('groupSpace').groupSpace(0.05)
      .prop('y')
      .prop('height')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var inGroupScale = d3.scale.ordinal()
          .domain(d3.range(props.groupSize))
          .rangeBands([0, props.groupWidth], props.groupSpace, 0);

        var groups = selection.selectAll('g.sszvis-g')
          .data(data);

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        groups.exit().remove();

        var bars = groups.selectAll('rect.sszvis-bar')
          .data(sszvis.fn.identity);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true);

        bars.exit().remove();

        bars
          .transition()
          .call(sszvis.transition)
          .attr('x', function(d, i) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.groupScale(d) + inGroupScale(i);
          })
          .attr('width', inGroupScale.rangeBand())
          .attr('y', props.y)
          .attr('height', props.height)
          .attr('fill', props.fill);
      });
  };

});