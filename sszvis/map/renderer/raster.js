sszvis_namespace('sszvis.map.renderer.raster', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('debug').debug(false)
      .prop('width')
      .prop('height')
      .prop('fill')
      .prop('position')
      .prop('cellSide').cellSide(2)
      .prop('fill', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var canvas = selection.selectAll('.sszvis-map__rasterimage')
          .data([0]);

        canvas.enter()
          .append('canvas')
          .classed('sszvis-map__rasterimage', true);

        canvas.exit().remove();

        canvas
          .attr('width', props.width)
          .attr('height', props.height);

        var ctx = canvas.node().getContext('2d');

        ctx.clearRect(0, 0, props.width, props.height);

        if (props.debug) {
          // Displays a rectangle that fills the canvas.
          // Useful for checking alignment with other render layers.
          ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
          ctx.fillRect(0, 0, props.width, props.height);
        }

        var halfSide = props.cellSide / 2;
        data.forEach(function(datum) {
          var position = props.position(datum);
          ctx.fillStyle = props.fill(datum);
          ctx.fillRect(position[0] - halfSide, position[1] - halfSide, props.cellSide, props.cellSide);
        });
      });
  };

});
