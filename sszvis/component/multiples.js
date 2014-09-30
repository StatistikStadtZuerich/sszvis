/**
 * Small Multiples component
 *
 * Used to generate group elements for small multiples charts
 *
 * @return {d3.component}
 */
namespace('sszvis.component.multiples', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('width')
      .prop('height')
      .prop('paddingX')
      .prop('paddingY')
      .prop('rows')
      .prop('cols')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var unitWidth = (props.width - props.paddingX * (props.cols - 1)) / props.cols;
        var unitHeight = (props.height - props.paddingY * (props.rows - 1)) / props.rows;

        var multiples = selection.selectAll('g.sszvis-multiple')
          .data(data);

        multiples.enter()
          .append('g')
          .classed('sszvis-g sszvis-multiple', true);

        var subGroups = multiples.selectAll('g')
          .data(function(d) {
            return [d.values];
          });

        subGroups.enter()
          .append('g')
          .classed('sszvis-multiple-chart', true);

        multiples
          .datum(function(d, i) {
            d.gx = (i % props.cols) * (unitWidth + props.paddingX);
            d.gw = unitWidth;
            d.gy = Math.floor(i / props.cols) * (unitHeight + props.paddingY);
            d.gh = unitHeight;
            return d;
          })
          .attr('transform', function(d, i) {
            return 'translate(' + d.gx + ',' + d.gy + ')';
          });

      });
  };

});