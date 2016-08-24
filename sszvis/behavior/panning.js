/**
 * Panning behavior
 *
 * @module sszvis/behavior/panning
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.behavior.panning', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('start', 'pan', 'end');

    var panningComponent = d3.component()
      .prop('elementSelector')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var elements = selection.selectAll(props.elementSelector);

        elements
          .attr('data-sszvis-behavior-pannable', '')
          .classed('sszvis-interactive', true)
          .on('mouseover', event.start)
          .on('mousemove', event.pan)
          .on('mouseout', event.end)
          .on('touchstart', function(d) {
            d3.event.preventDefault();
            event.start(d);
          })
          .on('touchmove', function() {
            d3.event.preventDefault();
            var datum = sszvis.behavior.util.datumFromPanEvent(sszvis.fn.firstTouch(d3.event));
            if (datum !== null) {
              event.pan(datum);
            } else {
              event.end();
            }
          })
          .on('touchend', event.end);
      });

    d3.rebind(panningComponent, event, 'on');

    return panningComponent;
  };

});
