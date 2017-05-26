/**
 * Circle annotation
 *
 * A component for creating circular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/circle
 *
 * @param {number, function} x        The x-position of the center of the data area.
 * @param {number, function} y        The y-position of the center of the data area.
 * @param {number, function} r        The radius of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
 *
 * @returns {d3.component} a circular data area component
 */
'use strict';

import d3 from 'd3';

import ensureDefsElement from '../svgUtils/ensureDefsElement.js';
import { dataAreaPattern } from '../patterns.js';

export default function() {
  return d3.component()
    .prop('x', d3.functor)
    .prop('y', d3.functor)
    .prop('r', d3.functor)
    .prop('dx', d3.functor)
    .prop('dy', d3.functor)
    .prop('caption', d3.functor)
    .render(function(data) {
      var selection = d3.select(this);
      var props = selection.props();

      ensureDefsElement(selection, 'pattern', 'data-area-pattern')
        .call(dataAreaPattern);

      var dataArea = selection.selectAll('.sszvis-dataareacircle')
        .data(data);

      dataArea.enter()
        .append('circle')
        .classed('sszvis-dataareacircle', true);

      dataArea
        .attr('cx', props.x)
        .attr('cy', props.y)
        .attr('r', props.r)
        .attr('fill', 'url(#data-area-pattern)');

      if (props.caption) {
        var dataCaptions = selection.selectAll('.sszvis-dataareacircle__caption')
          .data(data);

        dataCaptions.enter()
          .append('text')
          .classed('sszvis-dataareacircle__caption', true);

        dataCaptions
          .attr('x', props.x)
          .attr('y', props.y)
          .attr('dx', props.dx)
          .attr('dy', props.dy)
          .text(props.caption);
      }
    });
};
