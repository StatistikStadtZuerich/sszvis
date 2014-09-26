/**
 * Grouped Bars
 * @return {d3.component}
 */
namespace('sszvis.component.groupedBars', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('groupAccessor')
      .prop('groupScale')
      .prop('groupWidth')
      .prop('groupSpace').groupSpace(0.05)
      .prop('y')
      .prop('height')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var groupNames = sszvis.fn.uniqueUnsorted(data.map(props.groupAccessor));
        var groupedData = data.reduce(function(memo, value) {
          var index = groupNames.indexOf(props.groupAccessor(value));
          if (!memo[index]) {
            memo[index] = [value];
          } else {
            memo[index].push(value);
          }
          return memo;
        }, []);

        var largestGroup = d3.max(groupedData.map(sszvis.fn.prop('length')));

        var inGroupScale = d3.scale.ordinal()
          .domain(d3.range(largestGroup))
          .rangeBands([0, props.groupWidth], props.groupSpace, 0);

        var groups = selection.selectAll('g')
          .data(groupedData);

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        var bars = groups.selectAll('rect')
          .data(sszvis.fn.identity);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true);

        bars
          .attr('x', function(d, i) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.groupScale(props.groupAccessor(d)) + inGroupScale(i);
          })
          .attr('width', inGroupScale.rangeBand())
          .attr('y', props.y)
          .attr('height', props.height)
          .attr('fill', props.fill);
      });
  };

});