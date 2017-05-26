/**
 * Button Group control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.select).
 *
 * @module sszvis/control/buttonGroup
 *
 * @property {array} values         an array of values which are the options available in the control. Each one will become a button
 * @property {any} current          the current value of the button group. Should be one of the options passed to .values()
 * @property {number} width         The total width of the button group. Each option will have 1/3rd of this width. (default: 300px)
 * @property {function} change      A callback/event handler function to call when the user clicks on a value.
 *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
 *
 * @return {d3.component}
 */
'use strict';

import d3 from 'd3';

import * as fn from '../fn.js';

export default function() {
  return d3.component()
    .prop('values')
    .prop('current')
    .prop('width').width(300)
    .prop('change').change(fn.identity)
    .render(function() {
      var selection = d3.select(this);
      var props = selection.props();

      var buttonWidth = props.width / props.values.length;

      var container = selection.selectAll('.sszvis-control-optionSelectable')
        .data(['sszvis-control-buttonGroup'], function(d){return d;});
      container.enter()
        .append('div')
        .classed('sszvis-control-optionSelectable', true)
        .classed('sszvis-control-buttonGroup', true);
      container.exit().remove();

      container
        .style('width', props.width + 'px');

      var buttons = container.selectAll('.sszvis-control-buttonGroup__item')
        .data(props.values);

      buttons.enter()
        .append('div')
        .classed('sszvis-control-buttonGroup__item', true);

      buttons.exit().remove();

      buttons
        .style('width', buttonWidth + 'px')
        .classed('selected', function(d) { return d === props.current; })
        .text(function(d) { return d; })
        .on('click', props.change);
    });
};
