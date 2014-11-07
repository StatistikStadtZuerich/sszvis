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
      .prop('defined', d3.functor).defined(true)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var inGroupScale = d3.scale.ordinal()
          .domain(d3.range(props.groupSize))
          .rangeBands([0, props.groupWidth], props.groupSpace, 0);

        var groups = selection.selectAll('g.sszvis-bargroup')
          .data(data);

        groups.enter()
          .append('g')
          .classed('sszvis-bargroup', true);

        groups.exit().remove();

        var barUnits = groups.selectAll('g.sszvis-barunit')
          .data(function(d) { return d; });

        barUnits.enter()
          .append('g')
          .classed('sszvis-barunit', true);

        barUnits.exit().remove();

        barUnits.each(function(d, i) {
          // necessary for the within-group scale
          d.__sszvisGroupedBarIndex__ = i;
        });

        var unitsWithValue = barUnits.filter(props.defined);

        // clear the units before rendering
        unitsWithValue.selectAll('*').remove();

        unitsWithValue
          .append('rect')
          .classed('sszvis-bar', true)
          .attr('fill', props.fill)
          .attr('x', function(d) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__);
          })
          .attr('y', props.y)
          .attr('width', inGroupScale.rangeBand())
          .attr('height', props.height);

        var unitsWithoutValue = barUnits.filter(sszvis.fn.not(props.defined));

        unitsWithoutValue.selectAll('*').remove();

        unitsWithoutValue
          .attr('transform', function(d, i) {
            return sszvis.fn.translateString(props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__) + inGroupScale.rangeBand() / 2, props.y(d, i));
          });

        unitsWithoutValue
          .append('line')
          .classed('sszvis-bar--missing line1', true)
          .attr('x1', -4).attr('y1', -4)
          .attr('x2', 4).attr('y2', 4);

        unitsWithoutValue
          .append('line')
          .classed('sszvis-bar--missing line2', true)
          .attr('x1', 4).attr('y1', -4)
          .attr('x2', -4).attr('y2', 4);
      });
  };

});
