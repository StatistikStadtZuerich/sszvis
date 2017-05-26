/**
 * Panning behavior
 *
 * This behavior is used for adding "panning" functionality to a set of chart elements.
 * The "panning" functionality refers to a combination of mouseover and touch responsiveness,
 * where on a mouse interaction an event is fired on hover, but the touch interaction is more
 * complex. The idea is to sort of imitate the way a hover interaction works, but with only a
 * finger. When a user starts a touch on an element which has this behavior enabled, the
 * default scrolling behavior of the browser will be canceled. The user can then move
 * their finger across the surface of the screen, onto other elements, and the scroll
 * will be canceled. When the finger moves onto other elements with this behavior attached,
 * the event will be fired. Meanwhile, if the user starts the interaction somewhere outside
 * an element, the scroll will happen as usual, and if they move onto an activated element,
 * no event will be fired and the scrolling will continue.
 *
 * This behavior is applied to all the children of a selection which match the elementSelector
 * property. Event listeners are attached to each of the child elements. The elementSelector
 * property is necessary to know which elements to attach to (and therefore to also avoid
 * attaching event listeners to elements which shouldn't be interaction-active).
 *
 * @module sszvis/behavior/panning
 *
 * @property {String} elementSelector    This should be a string selector that matches child
 *                                       elements of the selection on which this component
 *                                       is rendered using the .call(component) pattern. All
 *                                       child elements will have the panning event listeners
 *                                       attached to them.
 * @property {String, Function} on       The .on() method should specify an event name and a handler
 *                                       function for that event. The supported events are:
 *                                       'start' - when the interaction starts on an element.
 *                                       'pan' - when the user pans on the same element or onto another
 *                                       element (note, no 'start' event will be fired when the user
 *                                       pans with a touch from one element onto another, since this
 *                                       behavior is too difficult to test for and emulate).
 *                                       'end' - when the interaction with an element ends.
 *
 * @return {d3.component}
 */

import d3 from 'd3';

import * as fn from '../fn.js';
import { datumFromPanEvent } from './util.js';

export default function() {
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
          var datum = datumFromPanEvent(fn.firstTouch(d3.event));
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
