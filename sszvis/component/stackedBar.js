/**
 * Stacked Bar Chart
 * @return {d3.component}
 */
namespace('sszvis.component.stacked.bar', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('xAccessor')
      .prop('xScale')
      .prop('yAccessor')
      .prop('yScale')
      .prop('categoryAccessor')
      .prop('width')
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

        var barGen = sszvis.component.bar()
          .x(sszvis.fn.compose(props.xScale, props.xAccessor))
          .y(function(d) { return props.yScale(d.y0 + d.y); })
          .width(props.width)
          .height(function(d) { return Math.abs(props.yScale(d.y0 + d.y) - props.yScale(d.y0)); })
          .fill(props.fill)
          .stroke(props.stroke);

        var groups = selection.selectAll('g')
          .data(stackLayout(layers));

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        var bars = groups.call(barGen);

      });
  };

});