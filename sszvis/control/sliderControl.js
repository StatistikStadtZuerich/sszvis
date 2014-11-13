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

        var bg = selection.selectAll('g.sszvis-g')
          .data([1]);

        var range = sszvis.fn.scaleRange(props.scale);
        var width = range[1] - range[0];

        // the unchanging bits
        var enterBg = bg.enter()
          .append('g')
          .classed('sszvis-g', true);

        var axisOffset = 30;

        // create the axis
        var axis = sszvis.axis.x()
          .scale(props.scale)
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

        var backgroundOffset = 16;

        // create the slider background
        var backgroundSelection = enterBg.selectAll('g.sszvis-background')
          .data([1])
          .enter()
          .append('g')
          .attr('transform', sszvis.fn.translateString(0, backgroundOffset))
          .classed('sszvis-background', true);

        var bgWidth = 6, lineOffset = bgWidth / 2;

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth)
          .style('stroke', '#888')
          .style('stroke-linecap', 'round')
          .attr('x1', lineOffset).attr('x2', width - lineOffset);

        backgroundSelection
          .append('line')
          .style('stroke-width', bgWidth - 1)
          .style('stroke', '#fff')
          .style('stroke-linecap', 'round')
          .attr('x1', lineOffset).attr('x2', width - lineOffset);

        // draw the handle and the label
        var handle = selection.selectAll('g.sszvis-slidercontrol--handle')
          .data([props.value]);

        handle.exit().remove();

        var handleEntering = handle.enter()
          .append('g').classed('sszvis-slidercontrol--handle', true);

        handle
          .attr('transform', function(d) {
            return sszvis.fn.translateString(sszvis.fn.roundPixelCrisp(props.scale(d)), 0);
          })

        handleEntering
          .append('text')
          .classed('sszvis-slidercontrol--label', true);

        handle.selectAll('.sszvis-slidercontrol--label')
          .data(function(d) { return [d]; })
          .text(props.label);

        var boxWidth = 10, boxHeight = 23;

        handleEntering
          .append('rect')
          .classed('sszvis-slidercontrol--handlebox', true)
          .attr('x', -(boxWidth / 2))
          .attr('y', backgroundOffset - boxHeight / 2)
          .attr('width', boxWidth).attr('height', boxHeight)
          .attr('rx', 2).attr('ry', 2);

        var handleLineDimension = (boxHeight / 2 - 4);

        handleEntering
          .append('line')
          .classed('sszvis-slidercontrol--handleline', true)
          .attr('y1', backgroundOffset - handleLineDimension).attr('y2', backgroundOffset + handleLineDimension);

        var sliderInteraction = sszvis.behavior.click()
          .xScale(props.scale)
          .yScale(d3.scale.linear().range([0, boxHeight]))
          .on('click', props.onchange)
          .on('down', props.onchange)
          .on('drag', props.onchange);

        selection.selectGroup('sliderInteraction')
          .attr('transform', sszvis.fn.translateString(0, 4))
          .call(sliderInteraction);
      });
  };

});
