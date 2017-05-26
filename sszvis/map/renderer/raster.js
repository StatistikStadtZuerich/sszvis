/**
 * raster renderer component
 *
 * @module  sszvis/map/renderer/raster
 *
 * Used for rendering a raster layer within a map (can also be used in other contexts, but the map usage
 * is the most straightforward). Requires a width and a height for the raster layer, a function which
 * returns raster positions, and one which returns fill colors.
 *
 * @property {Boolean} debug         Whether to activate debug mode, which shows a red square over the whole
 *                                   canvas, for testing alignment with other map layers.
 * @property {Number} width          The width of the canvas
 * @property {Number} height         The height of the canvas
 * @property {Function} position     A function which takes a datum and returns a position for the corresponding
 *                                   raster square, returned as [x, y] pairs.
 * @property {Number} cellSide       The length (in pixels) of one side of each raster cell
 * @property {Function} fill         The fill function. Takes a datum and should return a fill color for the datum's pixel.
 * @property {Number} opacity        The opacity of the canvas. Defaults to 1
 *
 * @return {d3.component}
 */
'use strict';

export default function() {
  return d3.component()
    .prop('debug').debug(false)
    .prop('width')
    .prop('height')
    .prop('position')
    .prop('cellSide').cellSide(2)
    .prop('fill', d3.functor)
    .prop('opacity').opacity(1)
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
        .attr('height', props.height)
        .style('opacity', props.opacity);

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
