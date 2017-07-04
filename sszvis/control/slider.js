/**
 * Slider control
 *
 * Control for use in filtering. Works very much like an interactive axis.
 * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
 * select values on that scale. Ticks created using an sszvis.axis show the user where
 * data values lie.
 *
 * @module  sszvis/control/slider
 *
 * @property {function} scale                 A scale function which this slider represents. The values in the scale's domain
 *                                            are used as the possible values of the slider.
 * @property {array} minorTicks               An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis
 * @property {array} majorTicks               An array of ticks which become major (larger and labeled) ticks on the slider's axis
 * @property {function} tickLabels            A function to use to format the major tick labels.
 * @property {any} value                      The current value of the slider. Should be set whenever slider interaction causes the state to change.
 * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
 * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
 *                                            Note that this component will not change its own state. The callback function must affect some state change
 *                                            in order for this component's display to be updated.
 *
 * @returns {d3.component}
 */

import d3 from 'd3';

import * as fn from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';
import { range } from '../scale.js';
import move from '../behavior/move.js';
import { axisX } from '../axis.js';
import { component } from '../d3-component.js';

function contains(x, a) {
  return a.indexOf(x) >= 0;
}

export default function() {
  return component()
    .prop('scale')
    .prop('value')
    .prop('onchange')
    .prop('minorTicks').minorTicks([])
    .prop('majorTicks').majorTicks([])
    .prop('tickLabels', fn.functor).tickLabels(fn.identity)
    .prop('label', fn.functor).label(fn.identity)
    .render(function() {
      var selection = d3.select(this);
      var props = selection.props();

      var axisOffset = 28; // vertical offset for the axis
      var majorTickSize = 12;
      var backgroundOffset = halfPixel(18); // vertical offset for the middle of the background
      var handleWidth = 10; // the width of the handle
      var handleHeight = 23; // the height of the handle
      var bgWidth = 6; // the width of the background
      var lineEndOffset = (bgWidth / 2); // the amount by which to offset the ends of the background line
      var handleSideOffset = (handleWidth / 2) + 0.5; // the amount by which to offset the position of the handle

      var scaleDomain = props.scale.domain();
      var scaleRange = range(props.scale);
      var alteredScale = props.scale.copy()
        .range([scaleRange[0] + handleSideOffset, scaleRange[1] - handleSideOffset]);

      // the mostly unchanging bits
      var bg = selection.selectAll('g.sszvis-control-slider__backgroundgroup')
        .data([1]);
      var newBg = bg.enter()
        .append('g')
        .classed('sszvis-control-slider__backgroundgroup', true);
      bg = bg.merge(newBg);
      bg.exit().remove();

      // create the axis
      var axis = axisX()
        .scale(alteredScale)
        .orient('bottom')
        .hideBorderTickThreshold(0)
        .tickSize(majorTickSize)
        .tickPadding(6)
        .tickValues(fn.set([].concat(props.majorTicks, props.minorTicks)))
        .tickFormat(function(d) {
          return contains(d, props.majorTicks) ? props.tickLabels(d) : '';
        });

      var axisSelection = bg.selectAll('g.sszvis-axisGroup')
        .data([1]);

      var newAxisSelection = axisSelection.enter()
        .append('g')
        .classed('sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slider', true);
      axisSelection = axisSelection.merge(newAxisSelection);

      axisSelection
        .attr('transform', translateString(0, axisOffset))
        .call(axis);

      // adjust visual aspects of the axis to fit the design
      axisSelection.selectAll('.tick line')
        .filter(function(d) {
          return !contains(d, props.majorTicks);
        })
        .attr('y2', 4);

      var majorAxisText = axisSelection.selectAll('.tick text').filter(function(d) {
        return contains(d, props.majorTicks);
      });
      var numTicks = majorAxisText.size();
      majorAxisText.style('text-anchor', function(d, i) {
        return i === 0 ? 'start' : i === numTicks - 1 ? 'end' : 'middle';
      });

      // create the slider background
      var backgroundSelection = bg.selectAll('g.sszvis-slider__background')
        .data([1]);
      var newBackgroundSelection = backgroundSelection.enter()
        .append('g')
        .classed('sszvis-slider__background', true);
      backgroundSelection = backgroundSelection.merge(newBackgroundSelection);
      backgroundSelection
        .attr('transform', translateString(0, backgroundOffset));

      var bg1 = backgroundSelection.selectAll('.sszvis-slider__background__bg1')
        .data([1]);
      var newBg1 = bg1.enter()
        .append('line')
        .classed('sszvis-slider__background__bg1', true)
        .style('stroke-width', bgWidth)
        .style('stroke', '#888')
        .style('stroke-linecap', 'round');
      bg1 = bg1.merge(newBg1);
      bg1
        .attr('x1', Math.ceil(scaleRange[0] + lineEndOffset))
        .attr('x2', Math.floor(scaleRange[1] - lineEndOffset));

      var bg2 = backgroundSelection.selectAll('.sszvis-slider__background__bg2')
        .data([1]);
      var newBg2 = bg2.enter()
        .append('line')
        .classed('sszvis-slider__background__bg2', true)
        .style('stroke-width', bgWidth - 1)
        .style('stroke', '#fff')
        .style('stroke-linecap', 'round');
      bg2 = bg2.merge(newBg2);
      bg2
        .attr('x1', Math.ceil(scaleRange[0] + lineEndOffset))
        .attr('x2', Math.floor(scaleRange[1] - lineEndOffset));

      var shadow = backgroundSelection.selectAll('.sszvis-slider__backgroundshadow')
        .data([props.value]);
      var newShadow = shadow.enter()
        .append('line')
        .attr('class', 'sszvis-slider__backgroundshadow')
        .attr('stroke-width', bgWidth - 1)
        .style('stroke', '#E0E0E0')
        .style('stroke-linecap', 'round');
      shadow = shadow.merge(newShadow);
      shadow
        .attr('x1', Math.ceil(scaleRange[0] + lineEndOffset))
        .attr('x2', fn.compose(Math.floor, alteredScale));

      // draw the handle and the label
      var handle = selection.selectAll('g.sszvis-control-slider__handle')
        .data([props.value]);
      handle.exit().remove();

      var handleEntering = handle.enter()
        .append('g').classed('sszvis-control-slider__handle', true);
      handle = handle.merge(handleEntering);

      handle
        .attr('transform', function(d) {
          return translateString(halfPixel(alteredScale(d)), 0.5);
        });

      handleEntering
        .append('text')
        .classed('sszvis-control-slider--label', true);

      handle.selectAll('.sszvis-control-slider--label')
        .data(function(d) { return [d]; })
        .text(props.label)
        .style('text-anchor', function(d) {
          return fn.stringEqual(d, scaleDomain[0]) ? 'start' : fn.stringEqual(d, scaleDomain[1]) ? 'end' : 'middle';
        })
        .attr('dx', function(d) {
          return fn.stringEqual(d, scaleDomain[0]) ? -(handleWidth / 2) : fn.stringEqual(d, scaleDomain[1]) ? (handleWidth / 2) : 0;
        });

      handleEntering
        .append('rect')
        .classed('sszvis-control-slider__handlebox', true)
        .attr('x', -(handleWidth / 2))
        .attr('y', backgroundOffset - handleHeight / 2)
        .attr('width', handleWidth).attr('height', handleHeight)
        .attr('rx', 2).attr('ry', 2);

      var handleLineDimension = (handleHeight / 2 - 4); // the amount by which to offset the small handle line within the handle

      handleEntering
        .append('line')
        .classed('sszvis-control-slider__handleline', true)
        .attr('y1', backgroundOffset - handleLineDimension).attr('y2', backgroundOffset + handleLineDimension);

      var sliderInteraction = move()
        .xScale(props.scale)
        // range goes from the text top (text is 11px tall) to the bottom of the axis
        .yScale(d3.scaleLinear().range([-11, axisOffset + majorTickSize]))
        .draggable(true)
        .on('drag', props.onchange);

      selection.selectGroup('sliderInteraction')
        .classed('sszvis-control-slider--interactionLayer', true)
        .attr('transform', translateString(0, 4))
        .call(sliderInteraction);
    });
};
