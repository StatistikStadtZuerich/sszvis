/**
 * Slider control for use in filtering.
 *
 * @module  sszvis/control/sliderControl
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
        var backgroundOffset = 18; // vertical offset for the middle of the background
        var handleWidth = 10; // the width of the handle
        var handleHeight = 23; // the height of the handle
        var bgWidth = 6; // the width of the background
        var lineEndOffset = (bgWidth / 2); // the amount by which to offset the ends of the background line
        var handleSideOffset = (handleWidth / 2) + 1; // the amount by which to offset the position of the handle

        var scaleDomain = props.scale.domain();
        var scaleRange = sszvis.fn.scaleRange(props.scale);
        var alteredScale = props.scale.copy()
          .range([scaleRange[0] + handleSideOffset, scaleRange[1] - handleSideOffset]);
        var alteredRange = sszvis.fn.scaleRange(alteredScale);
        var width = alteredRange[1] - alteredRange[0]; // the width of the component's axis

        // the unchanging bits
        var bg = selection.selectAll('g.sszvis-g')
          .data([1]);

        var enterBg = bg.enter()
          .append('g')
          .classed('sszvis-g', true);

        // create the axis
        var axis = sszvis.axis.x()
          .scale(alteredScale)
          .orient('bottom')
          .hideBorderTickThreshold(0)
          .tickSize(12)
          .tickPadding(6)
          .tickValues(sszvis.fn.set([].concat(props.majorTicks, props.minorTicks)))
          .tickFormat(function(d) {
            return contains(d, props.majorTicks) ? props.tickLabels(d) : '';
          });

        var axisSelection = enterBg.selectAll('g.sszvis-axisGroup')
          .data([1])
          .enter()
          .append('g')
          .classed('sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slidercontrol', true)
          .attr('transform', sszvis.fn.translateString(0, axisOffset))
          .call(axis);

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
        var backgroundSelection = enterBg.selectAll('g.sszvis-background')
          .data([1])
          .enter()
          .append('g')
          .attr('transform', sszvis.fn.translateString(0, backgroundOffset))
          .classed('sszvis-background', true);

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth)
          .style('stroke', '#888')
          .style('stroke-linecap', 'round')
          .attr('x1', lineEndOffset).attr('x2', scaleRange[1] - lineEndOffset);

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth - 1)
          .style('stroke', '#fff')
          .style('stroke-linecap', 'round')
          .attr('x1', lineEndOffset).attr('x2', scaleRange[1] - lineEndOffset);

        // draw the handle and the label
        var handle = selection.selectAll('g.sszvis-slidercontrol--handle')
          .data([props.value]);

        handle.exit().remove();

        var handleEntering = handle.enter()
          .append('g').classed('sszvis-slidercontrol--handle', true);

        handle
          .attr('transform', function(d) {
            return sszvis.fn.translateString(sszvis.fn.roundPixelCrisp(alteredScale(d)), 0);
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
          .classed('sszvis-slidercontrol--handlebox', true)
          .attr('x', -(handleWidth / 2))
          .attr('y', backgroundOffset - handleHeight / 2)
          .attr('width', handleWidth).attr('height', handleHeight)
          .attr('rx', 2).attr('ry', 2);

        var handleLineDimension = (handleHeight / 2 - 4); // the amount by which to offset the small handle line within the handle

        handleEntering
          .append('line')
          .classed('sszvis-slidercontrol--handleline', true)
          .attr('y1', backgroundOffset - handleLineDimension).attr('y2', backgroundOffset + handleLineDimension);

        var sliderInteraction = sszvis.behavior.click()
          .xScale(props.scale)
          .yScale(d3.scale.linear().range([0, handleHeight]))
          .on('click', props.onchange)
          .on('down', props.onchange)
          .on('drag', props.onchange);

        selection.selectGroup('sliderInteraction')
          .attr('transform', sszvis.fn.translateString(0, 4))
          .call(sliderInteraction);
      });
  };

});
