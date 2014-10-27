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
          .classed('sszvis-bar', true)
          .attr('fill', props.fill);

        bars.exit().remove();

        bars
          .attr('x', function(d, i) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.defined(d) ? props.groupScale(d) + inGroupScale(i) : 0;
          })
          .attr('y', function(d, i) {
            return props.defined(d) ? props.y(d, i) : 0;
          })
          .attr('transform', function(d, i) {
            // special positioning for the "missing value" bars
            return props.defined(d) ? '' : 'translate(' + (props.groupScale(d) + inGroupScale(i) + inGroupScale.rangeBand() / 2) + ',' + (props.y(d, i) - 5) + ') rotate(25)';
          });

        // filter for the bars which have a value and display it
        bars
          .filter(sszvis.fn.compose(sszvis.fn.not(isNaN), props.height))
          .transition()
          .call(sszvis.transition)
          .attr('width', inGroupScale.rangeBand())
          .attr('height', props.height)
          .attr('fill', props.fill);

        // handle missing values
        bars
          .filter(sszvis.fn.compose(isNaN, props.height))
          .attr('width', 1)
          .attr('height', 10)
          .attr('fill', '#000');
      });
  };

});
