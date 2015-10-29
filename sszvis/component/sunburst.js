sszvis_namespace('sszvis.component.sunburst', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('startAngle', d3.functor)
      .prop('endAngle', d3.functor)
      .prop('innerRadius', d3.functor)
      .prop('outerRadius', d3.functor)
      .prop('fill')
      .prop('stroke').stroke('white')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


      });
  };

});
