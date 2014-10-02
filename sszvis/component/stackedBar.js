/**
 * Stacked Bar Chart
 * @return {d3.component}
 */
namespace('sszvis.component.stacked.bar', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('orientation')
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

        var categories = sszvis.fn.set(data.map(props.categoryAccessor));
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

        // TODO: refactor this class to make more sense?
        var stackLayout = d3.layout.stack()
          .x(props.xAccessor)
          .y(props.yAccessor);

        var placementValue = sszvis.fn.compose(props.xScale, props.xAccessor);
        var extentValueRight = function(d) { return props.yScale(d.y0); };
        var extentValueLeft = function(d) { return props.yScale(d.y0 + d.y); };
        var placementDimension = props.width;
        var extentDimension = function(d) { return Math.abs(props.yScale(d.y0 + d.y) - props.yScale(d.y0)); };

        var xFunc, yFunc, wFunc, hFunc;
        if (props.orientation === 'vertical') {
          xFunc = placementValue;
          yFunc = extentValueLeft;
          wFunc = placementDimension;
          hFunc = extentDimension;
        } else if (props.orientation === 'horizontal') {
          xFunc = extentValueRight;
          yFunc = placementValue;
          wFunc = extentDimension;
          hFunc = placementDimension;
        } else {
          throw new Error('sszvis.component.stacked.bar requires an orientation');
        }

        var barGen = sszvis.component.bar()
          .x(xFunc)
          .y(yFunc)
          .width(wFunc)
          .height(hFunc)
          .fill(props.fill)
          .stroke(props.stroke);

        var groups = selection.selectAll('g.sszvis-g')
          .data(stackLayout(layers));

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        groups.exit().remove();

        var bars = groups.call(barGen);

      });
  };

});