/**
 * Stacked Chart
 * @return {d3.component}
 */
namespace('sszvis.component.stacked.area', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('xAccessor')
      .prop('xScale')
      .prop('yAccessor')
      .prop('yScale')
      .prop('categoryAccessor')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var categories = sszvis.fn.uniqueUnsorted(data.map(props.categoryAccessor));
        var layers = data.reduce(function(memo, value) {
          var index = categories.indexOf(props.categoryAccessor(value));
          if (!memo[index]) {
            memo[index] = [value];
          } else {
            memo[index].push(value);
          }
          return memo;
        }, []);
        categories.forEach(function(cat, i) {
          layers[i].category = cat;
        });

        var stackLayout = d3.layout.stack()
          .x(props.xAccessor)
          .y(props.yAccessor);

        var areaGen = d3.svg.area()
          .x(sszvis.fn.compose(props.xScale, props.xAccessor))
          .y0(function(d) { return props.yScale(d.y0); })
          .y1(function(d) { return props.yScale(d.y0 + d.y); });

        var paths = selection.selectAll('path')
          .data(stackLayout(layers));

        paths.enter()
          .append('path')
          .classed('sszvis-path', true);

        paths
          .attr('d', areaGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});