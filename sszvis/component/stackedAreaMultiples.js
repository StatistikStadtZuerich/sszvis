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
 * @return {d3.component}
 */

namespace('sszvis.component.stackedAreaMultiples', function(module) {
'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y0')
      .prop('y1')
      .prop('fill')
      .prop('stroke')
      .prop('key').key(function(d, i){ return i; })
      .prop('valuesAccessor').valuesAccessor(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        data = data.slice().reverse();

        var areaGen = d3.svg.area()
          .x(props.x)
          .y0(props.y0)
          .y1(props.y1);

        var paths = selection.selectAll('path.sszvis-path')
          .data(data, props.key);

        paths.enter()
          .append('path')
          .classed('sszvis-path', true)
          .attr('fill', props.fill);

        paths.exit().remove();

        paths
          .transition()
          .call(sszvis.transition)
          .attr('d', sszvis.fn.compose(areaGen, props.valuesAccessor))
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});
