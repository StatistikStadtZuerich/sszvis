/**
 * Move behavior
 * @return {d3.component}
 */
namespace('sszvis.behavior.move', function(module) {

  module.exports = function() {
    var event = d3.dispatch('start', 'move', 'end');

    var moveComponent = d3.component()
      .prop('xScale')
      .prop('yScale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = props.xScale.range();
        var yExtent = props.yScale.range().sort(d3.ascending);

        var layer = selection.selectAll('[data-sszvis-behavior-move]')
          .data([0]);

        layer.enter()
          .append('rect')
          .attr('data-sszvis-behavior-move', '');

        layer
          .attr('x', xExtent[0])
          .attr('y', yExtent[0])
          .attr('width',  xExtent[1] - xExtent[0])
          .attr('height', yExtent[1] - yExtent[0])
          .attr('fill', 'transparent')
          .on('mouseover', event.start)
          .on('mouseout', event.end)
          .on('mousemove', function() {
            var xy = d3.mouse(this);
            event.move(props.xScale.invert(xy[0]), props.yScale.invert(xy[1]));
          });
      });

    d3.rebind(moveComponent, event, 'on');

    return moveComponent;
  }

});
