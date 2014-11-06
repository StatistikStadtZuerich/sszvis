/**
 * Legend component
 *
 * @module sszvis/legend
 */
 // NOTE Why are legent.colorRange and legen.color
 //in two different namespaces?
 //Why not create just one namespace 'sszvis.legend'
 //and return an object with 'color' and 'colorRange'?

 // NOTE Should this not be in the components folder? As it creates a component.

namespace('sszvis.legend.linearColorScale', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('displayValues').displayValues([])
      .prop('width').width(200)
      .prop('segments').segments(8)
      .prop('units').units(false)
      .prop('labelPadding').labelPadding(16)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.scale) {
          sszvis.logError('legend.linearColorScale - a scale must be specified.');
          return false;
        }

        var values = props.displayValues;
        if (!values.length && props.scale.ticks) {
          values = props.scale.ticks(props.segments);
        }

        // Avoid division by zero
        var segWidth = values.length > 0 ? props.width / values.length : 0;
        var segHeight = 10;

        var segments = selection.selectAll('rect.sszvis-legend--mark')
          .data(values);

        segments.enter()
          .append('rect')
          .classed('sszvis-legend--mark', true);

        segments.exit().remove();

        segments
          .attr('x', function(d, i) { return i * segWidth; })
          .attr('y', 0)
          .attr('width', segWidth)
          .attr('height', segHeight)
          .attr('fill', function(d) { return props.scale(d); });

        var startEnd = [values[0], values[values.length - 1]];

        // rounded end caps for the segments
        var endCaps = selection.selectAll('circle.ssvis-legend--mark')
          .data(startEnd);

        endCaps.enter()
          .append('circle')
          .attr('cx', function(d, i) { return i * props.width; })
          .attr('cy', segHeight / 2)
          .attr('r', segHeight / 2)
          .attr('fill', function(d) { return props.scale(d); });

        if (props.units) startEnd[1] += ' ' + props.units;

        var labels = selection.selectAll('.sszvis-legend--label')
          .data(startEnd);

        labels.enter()
          .append('text')
          .classed('sszvis-legend--label', true);

        labels.exit().remove();

        labels
          .attr('text-anchor', function(d, i) { return i === 0 ? 'end' : 'start'; })
          .attr('alignment-baseline', 'central')
          .attr('transform', function(d, i) { return 'translate(' + (i * props.width + (i === 0 ? -1 : 1) * props.labelPadding) + ', ' + (segHeight / 2) + ')'; })
          .text(function(d) { return d; });
      });
  };

});
