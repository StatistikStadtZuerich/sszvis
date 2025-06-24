import { select, area } from 'd3';
import { compose, not } from '../fn.js';
import { defaultTransition } from '../transition.js';
import { component } from '../d3-component.js';

/**
 * Stacked Area component
 *
 * Stacked area charts are useful for showing how component parts contribute to a total quantity
 *
 * The stackedArea component uses a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout) under the hood,
 * so some of its configuration properties are similar. This component requires an array of layer objects,
 * where each layer object represents a layer in the stack.
 *
 * @module sszvis/component/stackedArea
 *
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
 * @return {sszvis.component}
 */

function stackedArea () {
  return component().prop("x").prop("y0").prop("y1").prop("fill").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((d, i) => i).prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const defaultDefined = function () {
      return compose(not(isNaN), props.y0) && compose(not(isNaN), props.y1);
    };
    const areaGen = area().defined(props.defined === undefined ? defaultDefined : props.defined).x(props.x).y0(props.y0).y1(props.y1);
    let paths = selection.selectAll("path.sszvis-path").data(data, props.key).join("path").classed("sszvis-path", true);
    if (props.transition) {
      paths = paths.transition(defaultTransition());
    }
    paths.attr("d", areaGen).attr("fill", props.fill).attr("stroke", props.stroke || "#ffffff").attr("stroke-width", props.strokeWidth === undefined ? 1 : props.strokeWidth);
  });
}

export { stackedArea as default };
//# sourceMappingURL=stackedArea.js.map
