/**
 * Slider control for use in filtering. Works very much like an interactive axis.
 * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
 * select values on that scale. Ticks created using an sszvis.axis show the user where
 * data values lie.
 *
 * @module  sszvis/control/sliderControl
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
namespace('sszvis.control.sliderControl', function(module) {
  'use strict';

  function contains(x, a) {
    return a.indexOf(x) >= 0;
  }

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('minorTicks').minorTicks([])
      .prop('majorTicks').majorTicks([])
      .prop('tickLabels')
      .prop('value')
      .prop('label')
      .prop('onchange')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var axisOffset = 28; // vertical offset for the axis
        var majorTickSize = 12;
        var backgroundOffset = sszvis.fn.roundPixelCrisp(18); // vertical offset for the middle of the background
        var handleWidth = 10; // the width of the handle
        var handleHeight = 23; // the height of the handle
        var bgWidth = 6.5; // the width of the background
        var lineEndOffset = (bgWidth / 2); // the amount by which to offset the ends of the background line
        var handleSideOffset = (handleWidth / 2) + 0.5; // the amount by which to offset the position of the handle

        var scaleDomain = props.scale.domain();
        var scaleRange = sszvis.fn.scaleRange(props.scale);
        var alteredScale = props.scale.copy()
          .range([scaleRange[0] + handleSideOffset, scaleRange[1] - handleSideOffset]);
        var alteredRange = sszvis.fn.scaleRange(alteredScale);
        var width = alteredRange[1] - alteredRange[0]; // the width of the component's axis

        // the mostly unchanging bits
        var bg = selection.selectAll('g.sszvis-slidercontrol__backgroundgroup')
          .data([1]);

        var enterBg = bg.enter()
          .append('g')
          .classed('sszvis-slidercontrol__backgroundgroup', true);

        // create the axis
        var axis = sszvis.axis.x()
          .scale(alteredScale)
          .orient('bottom')
          .hideBorderTickThreshold(0)
          .tickSize(majorTickSize)
          .tickPadding(6)
          .tickValues(sszvis.fn.set([].concat(props.majorTicks, props.minorTicks)))
          .tickFormat(function(d) {
            return contains(d, props.majorTicks) ? props.tickLabels(d) : '';
          });

        var axisSelection = enterBg.selectAll('g.sszvis-axisGroup')
          .data([1]);

        axisSelection.enter()
          .append('g')
          .classed('sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slidercontrol', true)
          .attr('transform', sszvis.fn.translateString(0, axisOffset));

        axisSelection.call(axis);

        // adjust visual aspects of the axis to fit the design
        var minorAxisTicks = axisSelection.selectAll('.tick line').filter(function(d) {
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
        var backgroundSelection = enterBg.selectAll('g.sszvis-slider__background')
          .data([1])
          .enter()
          .append('g')
          .attr('transform', sszvis.fn.translateString(0, backgroundOffset))
          .classed('sszvis-slider__background', true);

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth)
          .style('stroke', '#888')
          .style('stroke-linecap', 'round')
          .attr('x1', sszvis.fn.roundPixelCrisp(scaleRange[0] + lineEndOffset)).attr('x2', sszvis.fn.roundPixelCrisp(scaleRange[1] - lineEndOffset));

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth - 1)
          .style('stroke', '#fff')
          .style('stroke-linecap', 'round')
          .attr('x1', sszvis.fn.roundPixelCrisp(scaleRange[0] + lineEndOffset)).attr('x2', sszvis.fn.roundPixelCrisp(scaleRange[1] - lineEndOffset));

        var shadow = selection.selectAll('g.sszvis-slider__background').selectAll('.sszvis-slider__backgroundshadow')
          .data([props.value]);

        shadow.enter()
          .append('line')
          .attr('class', 'sszvis-slider__backgroundshadow')
          .attr('stroke-width', bgWidth - 1)
          .style('stroke', '#E0E0E0')
          .style('stroke-linecap', 'round');

          shadow
            .attr('x1', sszvis.fn.roundPixelCrisp(scaleRange[0] + lineEndOffset))
            .attr('x2', function(d) {
              return sszvis.fn.roundPixelCrisp(alteredScale(d));
            });

        // draw the handle and the label
        var handle = selection.selectAll('g.sszvis-slidercontrol__handle')
          .data([props.value]);

        handle.exit().remove();

        var handleEntering = handle.enter()
          .append('g').classed('sszvis-slidercontrol__handle', true);

        handle
          .attr('transform', function(d) {
            return sszvis.fn.translateString(sszvis.fn.roundPixelCrisp(alteredScale(d)), 0.5);
          })

        handleEntering
          .append('text')
          .classed('sszvis-slidercontrol--label', true);

        handle.selectAll('.sszvis-slidercontrol--label')
          .data(function(d) { return [d]; })
          .text(props.label)
          .style('text-anchor', function(d) {
            return sszvis.fn.stringEqual(d, scaleDomain[0]) ? 'start' : sszvis.fn.stringEqual(d, scaleDomain[1]) ? 'end' : 'middle';
          })
          .attr('dx', function(d) {
            return sszvis.fn.stringEqual(d, scaleDomain[0]) ? -(handleWidth / 2) : sszvis.fn.stringEqual(d, scaleDomain[1]) ? (handleWidth / 2) : 0;
          });

        handleEntering
          .append('rect')
          .classed('sszvis-slidercontrol__handlebox', true)
          .attr('x', -(handleWidth / 2))
          .attr('y', backgroundOffset - handleHeight / 2)
          .attr('width', handleWidth).attr('height', handleHeight)
          .attr('rx', 2).attr('ry', 2);

        var handleLineDimension = (handleHeight / 2 - 4); // the amount by which to offset the small handle line within the handle

        handleEntering
          .append('line')
          .classed('sszvis-slidercontrol__handleline', true)
          .attr('y1', backgroundOffset - handleLineDimension).attr('y2', backgroundOffset + handleLineDimension);

        var sliderInteraction = sszvis.behavior.move()
          .xScale(props.scale)
          // range goes from the text top (text is 11px tall) to the bottom of the axis
          .yScale(d3.scale.linear().range([-11, axisOffset + majorTickSize]))
          .draggable(true)
          .on('drag', props.onchange);

        selection.selectGroup('sliderInteraction')
          .classed('sszvis-slidercontrol--interactionLayer', true)
          .attr('transform', sszvis.fn.translateString(0, 4))
          .call(sliderInteraction);
      });
  };

});
