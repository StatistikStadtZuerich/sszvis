/**
 * FIXME
 * Binned Color Scale Legend
 *
 * Use for displaying the values of discontinuous (binned) color scale's bins
 *
 * @module sszvis/legend/binnedColorScale
 *
 * @param {function} scale              A scale to use to generate the color values
 * @param {array} displayValues         An array of values which should be displayed. Usually these should be the bin edges
 * @param {array} endpoints             The endpoints of the scale (note that these are not necessarily the first and last
 *                                      bin edges). These will become labels at either end of the legend.
 * @param {number} width                The pixel width of the legend. Default 200
 * @param {function} labelFormat        A formatter function for the labels of the displayValues.
 *
 * @return {d3.component}
 */

namespace('sszvis.legend.binnedColorScale', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('displayValues')
      .prop('endpoints')
      .prop('width').width(200)
      .prop('labelFormat').labelFormat(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.scale) return sszvis.logger.error('legend.binnedColorScale - a scale must be specified.');
        if (!props.displayValues) return sszvis.logger.error('legend.binnedColorScale - display values must be specified.');
        if (!props.endpoints) return sszvis.logger.error('legend.binnedColorScale - endpoints must be specified');

        var segHeight = 10;
        var circleRad = segHeight / 2;
        var innerRange = [0, props.width - (2 * circleRad)];

        var barWidth = d3.scale.linear()
          .domain(props.endpoints)
          .range(innerRange);
        var sum = 0;
        var rectData = [];
        var pPrev = props.endpoints[0];
        props.displayValues.forEach(function(p) {
          var w = barWidth(p) - sum;
          var offset = sum % 1;
          rectData.push({
            x: Math.floor(circleRad + sum),
            w: w + offset,
            c: props.scale(pPrev),
            p: p
          });
          sum += w;
          pPrev = p;
        });

        // add the final box (last display value - > endpoint)
        rectData.push({
          x: Math.floor(circleRad + sum),
          w: innerRange[1] - sum,
          c: props.scale(pPrev)
        })

        var circles = selection.selectAll('circle.sszvis-legend__circle')
          .data(props.endpoints);

        circles.enter()
          .append('circle')
          .classed('sszvis-legend__circle', true);

        circles.exit().remove();

        circles
          .attr('r', circleRad)
          .attr('cy', circleRad)
          .attr('cx', function(d, i) {
            return i === 0 ? circleRad : props.width - circleRad;
          })
          .attr('fill', props.scale);

        var segments = selection.selectAll('rect.sszvis-legend__crispmark')
          .data(rectData);

        segments.enter()
          .append('rect')
          .classed('sszvis-legend__crispmark', true);

        segments.exit().remove();

        segments
          .attr('x', function(d) { return d.x; })
          .attr('y', 0)
          .attr('width', function(d, i) { return d.w; })
          .attr('height', segHeight)
          .attr('fill', function(d) { return d.c; });

        var lineData = rectData.slice(0, -1);

        var lines = selection.selectAll('line.sszvis-legend__crispmark')
          .data(lineData);

        lines.enter()
          .append('line')
          .classed('sszvis-legend__crispmark', true);

        lines.exit().remove();

        lines
          .attr('x1', function(d) { return sszvis.fn.roundPixelCrisp(d.x + d.w); })
          .attr('x2', function(d) { return sszvis.fn.roundPixelCrisp(d.x + d.w); })
          .attr('y1', segHeight + 1)
          .attr('y2', segHeight + 6)
          .attr('stroke', '#B8B8B8');

        var labels = selection.selectAll('.sszvis-legend__axislabel')
          .data(lineData);

        labels.enter()
          .append('text')
          .classed('sszvis-legend__axislabel', true);

        labels.exit().remove();

        labels
          .style('text-anchor', 'middle')
          .attr('transform', function(d, i) { return 'translate(' + (d.x + d.w) + ',' + (segHeight + 20) + ')'; })
          .text(function(d) {
            return props.labelFormat(d.p);
          });
      });
  };

});
