/**
 * Responsive design breakpoints for sszvis
 *
 * @module sszvis/breakpoint
 *
 * Provides the default breakpoint sizes for SSZVIS. The breakpoints are upper limits,
 * i.e. [0 - 601) is the first range, [601 - 800) is the second, and so on.
 *
 * @property {Number} SMALL    The small breakpoint
 * @property {Number} NARROW    The narrow breakpoint
 * @property {Number} TABLET    The tablet breakpoint
 * @property {Number} NORMAL    The normal breakpoint
 * @property {Number} WIDE      The wide breakpoint
 */
sszvis_namespace('sszvis.breakpoint', function(module) {

  module.exports = {
    SMALL: 601,
    NARROW: 800,
    TABLET: 1025,
    NORMAL: 1261,
    WIDE: 1441
  };

});
