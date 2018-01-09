/**
 * Stacked Area Multiples component
 *
 * This component, like stackedArea, requires an array of layer objects, where each layer object is one of the multiples.
 * In addition to stackedArea, this chart's layers can be separated to provide two views on the data: a sum of all
 * elements as well as every element on its own.
 *
 * @module sszvis/component/stackedAreaMultiples
 *
 * @property {number, function} x             Accessor function for the *x*-values. Passed a data object and should return a value
 *                                            in screen pixels.
 * @property {number, function} y0            Accessor function for the *y0*-value (the baseline of the area). Passed a data object
 *                                            and should return a value in screen pixels.
 * @property {number, function} y1            Accessor function for the *y1*-value (the top line of the area). Passed a data object
 *                                            and should return a value in screen pixels.
 * @property {string, function} fill          Accessor function for the area fill. Passed a layer object.
 * @property {string, function} stroke        Accessor function for the area stroke. Passed a layer object.
 * @property {function} key                   Specify a key function for use in the data join. The value returned by the key should
 *                                            be unique among stacks. This option is particularly important when creating a chart
 *                                            which transitions between stacked and separated views.
 * @property {function} valuesAccessor        Specify an accessor for the values of the layer objects. The default treats the layer object
 *                                            as an array of values. Use this if your layer objects should be treated as something other than
 *                                            arrays of values.
 *
 * @return {sszvis.component}
 */


import {select, area} from 'd3';

import * as fn from '../fn.js';
import { defaultTransition } from '../transition.js';
import { component } from '../d3-component.js';

export default function() {
  return component()
    .prop('x')
    .prop('y0')
    .prop('y1')
    .prop('fill')
    .prop('stroke')
    .prop('defined')
    .prop('key').key(function(d, i){ return i; })
    .prop('valuesAccessor').valuesAccessor(fn.identity)
    .prop('transition').transition(true)
    .render(function(data) {
      var selection = select(this);
      var props = selection.props();

      //sszsch why reverse?
      data = data.slice().reverse();

      var defaultDefined = function() {
        return fn.compose(fn.not(isNaN), props.y0) && fn.compose(fn.not(isNaN), props.y1);
      }

      var areaGen = area()
        .defined(props.defined !== undefined ? props.defined : defaultDefined)
        .x(props.x)
        .y0(props.y0)
        .y1(props.y1);

      var paths = selection.selectAll('path.sszvis-path')
        .data(data, props.key);

      var newPaths = paths.enter()
        .append('path')
        .classed('sszvis-path', true);

      paths.exit().remove();

      paths = newPaths.merge(paths);

      if (props.transition) {
        paths = paths.transition(defaultTransition());
      }

      paths
        .attr('d', fn.compose(areaGen, props.valuesAccessor))
        .attr('fill', props.fill)
        .attr('stroke', props.stroke);
    });
};
