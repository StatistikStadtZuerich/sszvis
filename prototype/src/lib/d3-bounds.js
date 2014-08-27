;(function() {

  /**
   * Creates a dimensions object that simplifies working
   * with the d3 margin convention.
   * @see {@link http://bl.ocks.org/mbostock/3019563}
   *
   * @param {object}
   *
   * @returns {object}
   */
  d3.bounds = function(bounds) {
    var height  = either(bounds.height, 100);
    var width   = either(bounds.width, 100);
    var padding = {
      top:    either(bounds.top, 0),
      right:  either(bounds.right, 0),
      bottom: either(bounds.bottom, 0),
      left:   either(bounds.left, 0)
    }

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width,
    }
  }

  function either(val, fallback) {
    return (typeof val === "undefined") ? fallback : val;
  }


}());
