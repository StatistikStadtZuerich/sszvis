/**
 * Select control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.buttonGroup).
 *
 * @module sszvis/control/select
 *
 * @property {array} values         an array of values which are the options available in the control.
 * @property {any} current          the currently selected value of the select control. Should be one of the options passed to .values()
 * @property {number} width         The total width of the select control. If text labels exceed this width they will be trimmed to fit using an ellipsis mark. (default: 300px)
 * @property {function} change      A callback/event handler function to call when the user clicks on a value.
 *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
 *
 * @return {sszvis.component}
 */

import {select} from 'd3';

import * as fn from '../fn.js';
import { component } from '../d3-component.js';

export default function() {
  return component()
    .prop('values')
    .prop('current')
    .prop('width').width(300)
    .prop('change').change(fn.identity)
    .render(function() {
      var selection = select(this);
      var props = selection.props();

      var wrapperEl = selection.selectAll('.sszvis-control-optionSelectable')
        .data(['sszvis-control-select'], function(d){return d;});
      wrapperEl.enter()
        .append('div')
        .classed('sszvis-control-optionSelectable', true)
        .classed('sszvis-control-select', true);
      wrapperEl.exit().remove();

      wrapperEl
        .style('width', props.width + 'px');

      var metricsEl = wrapperEl.selectDiv('selectMetrics')
        .classed('sszvis-control-select__metrics', true);

      var selectEl = wrapperEl.selectAll('.sszvis-control-select__element')
        .data([1]);

      selectEl.enter()
        .append('select')
        .classed('sszvis-control-select__element', true)
        .on('change', function() {
          // We store the index in the select's value instead of the datum
          // because an option's value can only hold strings.
          var i = select(this).property('value');
          props.change(props.values[i]);
          // Prevent highlights on the select element after users have selected
          // an option by moving away from it.
          setTimeout(function(){ window.focus(); }, 0);
        });

      selectEl
        .style('width', (props.width + 30) + 'px');

      var optionEls = selectEl.selectAll('option')
        .data(props.values);

      optionEls.enter()
        .append('option');

      optionEls.exit().remove();

      optionEls
        .attr('selected', function(d) { return d === props.current ? 'selected' : null; })
        .attr('value', function(d, i){ return i; })
        .text(function(d) {
          return truncateToWidth(metricsEl, props.width - 40, d);
        });
    });
};

function truncateToWidth(metricsEl, maxWidth, originalString) {
  var MAX_RECURSION = 1000;
  var fitText = function(str, i) {
    metricsEl.text(str);
    var textWidth = Math.ceil(metricsEl.node().clientWidth);
    if (i < MAX_RECURSION && textWidth > maxWidth) {
      return fitText(str.slice(0, str.length - 2) + '…', i + 1);
    } else {
      return str;
    }
  };
  return fitText(originalString, 0);
}
