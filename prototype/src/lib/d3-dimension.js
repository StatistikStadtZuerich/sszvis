;(function() {

  /**
   * Creates a dimensions object that simplifies working
   * with the d3 margin convention.
   * @see {@link http://bl.ocks.org/mbostock/3019563}
   *
   * @param {number} width
   * @param {number} height
   * @param {object} [padding]
   *
   * @returns {object}
   */
  d3.dimension = function(width, height, padding) {
    padding = _.extend({top: 0, right: 0, bottom: 0, left: 0}, padding);
    return {
      height:      height - padding.top  - padding.bottom,
      width:       width  - padding.left - padding.right,
      padding:     padding,
      outerHeight: height,
      outerWidth:  width,
    }
  }

}());
