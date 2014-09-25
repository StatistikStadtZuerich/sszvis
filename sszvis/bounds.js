/**
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention.
 *
 * @module sszvis/bounds
 * @see http://bl.ocks.org/mbostock/3019563
 *
 * @param  {Object} bounds
 * @return {Object}
 */
namespace('sszvis.bounds', function(module) {

  module.exports = function(bounds) {
    var height  = sszvis.fn.either(bounds.height, 100);
    var width   = sszvis.fn.either(bounds.width, 100);
    var padding = {
      top:    sszvis.fn.either(bounds.top, 0),
      right:  sszvis.fn.either(bounds.right, 0),
      bottom: sszvis.fn.either(bounds.bottom, 0),
      left:   sszvis.fn.either(bounds.left, 0)
    }

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width,
    }
  }

});
