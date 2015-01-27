/**
 * Grouped Bars component
 *
 * The grouped bars component is used to create grouped vertical bar charts.
 *
 * The input to the grouped bar component should be an array of arrays, where each inner
 * array contains the bars for a single group. Each of the inner arrays becomes a group, and
 * each element in those inner arrays becomes a bar.
 *
 * In addition to the raw data, the user must provide other information necessary for calculating
 * the layout of the groups of bars, namely the number of bars in each group (this component requires that
 * all groups have the same number of bars), a scale for finding the x-offset of each group (usually an
 * instance of d3.scale.ordinal), a width for groups, and y- and height- scales for the bars in the group.
 * Note that the number of bars in each group and the group width determines how wide each bar will be, and
 * this width is calculated internally to the groupedBars component.
 *
 * The groups are calculated and laid out entirely by the groupedBars component.
 *
 * @module sszvis/component/groupedBars
 *
 * @property {scale} groupScale         This should be a scale function for determining the correct group offset of a member of a group.
 *                                      This function is passed the group member, and should return a value for the group offset which
 *                                      is the same for all members of the group. The within-group offset (which is different for each member)
 *                                      is then added to this group offset in order to position the bars individually within the group.
 *                                      So, for instance, if the groups are based on the "city" property, the groupScale should return
 *                                      the same value for all data objects with "city = Zurich".
 * @property {number} groupSize         This property tells groupedBars how many bars to expect for each group. It is used to assist in
 *                                      calculating the within-group layout and size of the bars. This number is treated as the same for all
 *                                      groups. Groups with less members than this number will have visible gaps. (Note that having less members
 *                                      in a group is not the same as having a member with a missing value, which will be discussed later)
 * @property {number} groupWidth        The width of the groups. This value is treated as the same for all groups. The width available to the groups
 *                                      is divided up among the bars. Often, this value will be the result of calling .rangeBand() on a d3.scale.ordinal scale.
 * @property {number} groupSpace        The percentage of space between each group. (default: 0.05). Usually the default is fine here.
 * @property {function} y               The y-position of the bars in the group. This function is given a data value and should return
 *                                      a y-value. It should be similar to other functions you have already seen for positioning bars.
 * @property {function} height          The height of the bars in the group. This function is given a data value and should return
 *                                      a height value. It should be similar to other functions you have already seen for setting the height of bars.
 * @property {string, function} fill    A functor which gives the color for each bar (often based on the bar's group). This can be a string or a function.
 * @property {string, function} stroke  The stroke color for each bar (default: none)
 * @property {function} defined         A predicate function which can be used to determine whether a bar has a defined value. (default: true).
 *                                      Any bar for which this function returns false, meaning that it has an undefined (missing) value,
 *                                      will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with
 *                                      missing values from bars with very small values, which would display as a very thin rectangle.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.component.groupedBars', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('groupScale')
      .prop('groupSize')
      .prop('groupWidth')
      .prop('groupSpace').groupSpace(0.05)
      .prop('y', d3.functor)
      .prop('height')
      .prop('fill')
      .prop('stroke')
      .prop('defined', d3.functor).defined(true)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var inGroupScale = d3.scale.ordinal()
          .domain(d3.range(props.groupSize))
          .rangeRoundBands([0, props.groupWidth], props.groupSpace, 0);

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
            return sszvis.svgUtils.translateString(props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__) + inGroupScale.rangeBand() / 2, props.y(d, i));
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

        var tooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(group) {
            var xTotal = 0;
            var tallest = Infinity;
            group.forEach(function(d, i) {
              xTotal += props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__) + inGroupScale.rangeBand() / 2;
              // smaller y is higher
              tallest = Math.min(tallest, props.y(d, i));
            });
            var xAverage = xTotal / group.length;
            return [xAverage, tallest];
          });

        selection.call(tooltipAnchor);
      });
  };

});
