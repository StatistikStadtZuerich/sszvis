/**
 * SlideBar for use in sliding along the x-axis of charts
 *
 * @module  sszvis/control/slideBar
 */
namespace('sszvis.control.slideBar', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('xScale')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        console.log(props);
      });
  };

});