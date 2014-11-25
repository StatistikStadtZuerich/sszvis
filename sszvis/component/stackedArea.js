/**
 * Stacked Area Chart
 *
 * Stacked area charts are useful for showing how component parts contribute to a total quantity
 *
 * The stacked.area component uses a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout) under the hood,
 * so some of its configuration properties are similar. This component requires an array of layer objects,
 * where each layer object represents a layer in the stack.

 * @property {function} x                      Accessor function to read *x*-values from the data. Should return a value in screen pixels.
 *                                             Used to figure out which values share a vertical position in the stack.
 * @property {function} yAccessor              Accessor function to read raw *y*-values from the data. Should return a value which is in data-units,
 *                                             not screen pixels. The results of this function are used to compute the stack, and they are then
 *                                             passed into the yScale before display.
 * @property {function} yScale                 A y-scale for determining the vertical position of data quantities. Used to compute the
 *                                             bottom and top lines of the stack.
 * @property {string, function} fill           String or accessor function for the area fill. Passed a layer object.
 * @property {string, function} stroke         String or accessor function for the area stroke. Passed a layer object.
 * @property {function} key                    Specify a key function for use in the data join. The value returned by the key should be unique
 *                                             among stacks. This option is particularly important when creating a chart which transitions
 *                                             between stacked and separated views.
 * @property {function} valuesAccessor         Specify an accessor for the values of the layer objects. The default treats the layer object
 *                                             as an array of values. Use this if your layer objects should be treated as something other than
 *                                             arrays of values.
 *
 * @return {d3.component}
 */
namespace('sszvis.component.stacked.area', function(module) {
'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('yAccessor')
      .prop('yScale')
      .prop('fill')
      .prop('stroke')
      .prop('key').key(function(d, i){ return i; })
      .prop('valuesAccessor').valuesAccessor(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        data = data.slice().reverse();

        var stackLayout = d3.layout.stack()
          .x(props.x)
          .y(props.yAccessor);

        stackLayout(data.map(props.valuesAccessor));

        var areaGen = d3.svg.area()
          .x(props.x)
          .y0(function(d) { return props.yScale(d.y0); })
          .y1(function(d) { return props.yScale(d.y0 + d.y); });

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
