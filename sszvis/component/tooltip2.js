/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip2', function(module) {

  module.exports = function() {

    var props = {
      layer: null,
      visible: sszvis.fn.constant(false)
    }

    var component = function(selection) {

      var data = [];
      selection.each(function(d) {
        var pos = this.getBoundingClientRect();
        if (props.visible(d)) {
          data.push({
            datum: d,
            x: pos.left,
            y: pos.top
          })
        }
      });

      var tooltip = props.layer.selectAll('.tooltip')
        .data(data)

      tooltip.enter()
        .append('circle')
        .attr('pointer-events', 'none')
        .attr('class', 'tooltip');

      var radius = 10;

      tooltip
        .attr('r', radius)
        .attr('fill', '#f00')
        .attr('cx', -radius)
        .attr('cy', -radius)
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })

      tooltip.exit().remove();

    }

    component.renderInto = function(layer) {
      if (!arguments.length) return props.layer;
      props.layer = layer;
      return component;
    }

    component.visible = function(visible) {
      if (!arguments.length) return props.visible;
      props.visible = d3.functor(visible);
      return component;
    }

    return component;
  };

});
