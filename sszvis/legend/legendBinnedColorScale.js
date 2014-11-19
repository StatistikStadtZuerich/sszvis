namespace('sszvis.legend.binnedColorScale', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('displayValues')
      .prop('width').width(200)
      .prop('labelFormat').labelFormat(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.scale) return sszvis.logger.error('legend.binnedColorScale - a scale must be specified.');
        if (!props.displayValues) return sszvis.logger.error('legend.binnedColorScale - display values must be specified.');

        var barWidth = d3.scale.linear()
          .domain(d3.extent(props.displayValues))
          .range([0, props.width]);
        var sum = 0;
        var rectData = [];
        d3.pairs(props.displayValues).forEach(function(p) {
          var w = barWidth(p[1]) - sum;
          rectData.push({
            x: sum,
            w: w,
            c: props.scale(p[0]),
            p0: p[0],
            p1: p[1]
          });
          sum += w;
        });

        var segHeight = 10;
        var circleRad = segHeight / 2;

        var segments = selection.selectAll('rect.sszvis-legend__mark')
          .data(rectData);

        segments.enter()
          .append('rect')
          .classed('sszvis-legend__mark', true);

        segments.exit().remove();

        segments
          .attr('x', function(d, i) {
            return i === 0 ? d.x + circleRad : d.x;
          })
          .attr('y', 0)
          .attr('width', function(d, i) {
            return i === 0 || i === rectData.length - 1 ? d.w - circleRad : d.w;
          })
          .attr('height', segHeight)
          .attr('fill', sszvis.fn.prop('c'));

        var firstLast = [sszvis.fn.first(rectData), sszvis.fn.last(rectData)];

        var circles = selection.selectAll('circle.sszvis-legend__mark')
          .data(firstLast);

        circles.enter()
          .append('circle')
          .classed('sszvis-legend__mark', true);

        circles.exit().remove();

        circles
          .attr('r', circleRad)
          .attr('cy', circleRad)
          .attr('cx', function(d, i) {
            return i === 0 ? d.x + circleRad : d.x + d.w - circleRad;
          })
          .attr('fill', sszvis.fn.prop('c'));

        var labelData = rectData.splice(1);

        var lines = selection.selectAll('line.sszvis-legend__mark')
          .data(labelData);

        lines.enter()
          .append('line')
          .classed('sszvis-legend__mark', true);

        lines.exit().remove();

        lines
          .attr('x1', function(d) { return sszvis.fn.roundPixelCrisp(d.x); })
          .attr('x2', function(d) { return sszvis.fn.roundPixelCrisp(d.x); })
          .attr('y1', segHeight + 1)
          .attr('y2', segHeight + 6)
          .attr('stroke', '#B8B8B8');

        var labels = selection.selectAll('.sszvis-legend__axislabel')
          .data(labelData);

        labels.enter()
          .append('text')
          .classed('sszvis-legend__axislabel', true);

        labels.exit().remove();

        labels
          .style('text-anchor', 'middle')
          .attr('transform', function(d, i) { return 'translate(' + (d.x) + ',' + (segHeight + 20) + ')'; })
          .text(function(d) {
            return props.labelFormat(d.p0);
          });
      });
  };

});
