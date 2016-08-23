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

    var moveComponent = d3.component()
      .prop('elementSelector')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var elements = selection.selectAll(props.elementSelector);

        elements
          .attr('data-sszvis-behavior-panning', '')
          .classed('sszvis-interactive', true)
          .on('mouseover', function() {
            var datum = datumFromEvent(d3.event);
            if (datum !== null) { event.start(datum); }
          })
          .on('mousemove', function() {
            var datum = datumFromEvent(d3.event);
            if (datum !== null) {
              event.pan(datum);
            } else {
              event.end();
            }
          })
          .on('mouseout', event.end)
          .on('touchstart', function() {
            d3.event.preventDefault();
            var datum = datumFromEvent(sszvis.fn.firstTouch(d3.event));
            if (datum !== null) { event.start(datum); }
          })
          .on('touchmove', function() {
            d3.event.preventDefault();
            var datum = datumFromEvent(sszvis.fn.firstTouch(d3.event));
            if (datum !== null) {
              event.pan(datum);
            } else {
              event.end();
            }
          })
          .on('touchend', event.end);
      });

    d3.rebind(moveComponent, event, 'on');

    return moveComponent;
  };

  function datumFromEvent(evt) {
    if (!sszvis.fn.isNull(evt) && sszvis.fn.defined(evt)) {
      var elementUnder = document.elementFromPoint(evt.clientX, evt.clientY);
      if (!sszvis.fn.isNull(elementUnder)) {
        var selection = d3.select(elementUnder);
        if (!sszvis.fn.isNull(selection.attr('data-sszvis-behavior-panning'))) {
          var datum = selection.datum();
          if (sszvis.fn.defined(datum)) {
            return datum;
          }
        }
      }
    }
    return null;

    // Alternate Version?
    // var elementUnder, selection, datum;
    // return sszvis.fn.isNull(evt) || !sszvis.fn.defined(evt) ? null :
    //        sszvis.fn.isNull(elementUnder = document.elementFromPoint(evt.clientX, evt.clientY)) ? null :
    //        !sszvis.fn.defined((selection = d3.select(elementUnder), selection.attr('data-sszvis-behavior-panning'))) ? null :
    //        !sszvis.fn.defined(datum = selection.datum()) ? null :
    //        datum;
  }

});
