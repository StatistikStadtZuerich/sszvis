namespace('sszvis.legend.binnedColorScale', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('displayValues')
      .prop('width').width(200)
      .prop('valueFormat').valueFormat(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.scale) return sszvis.logError('legend.binnedColorScale - a scale must be specified.');
        if (!props.displayValues) return sszvis.logError('legend.binnedColorScale - display values must be specified.');

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

        var segments = selection.selectAll('rect.sszvis-legend--mark')
          .data(rectData);

        segments.enter()
          .append('rect')
          .classed('sszvis-legend--mark', true);

        segments.exit().remove();

        segments
          .attr('x', sszvis.fn.prop('x'))
          .attr('y', 0)
          .attr('width', sszvis.fn.prop('w'))
          .attr('height', segHeight)
          .attr('fill', sszvis.fn.prop('c'));

        var labelData = rectData.concat({
          x: sum,
          p0: sszvis.fn.last(rectData).p1
        });

        var lines = selection.selectAll('line.sszvis-legend--mark')
          .data(labelData);

        lines.enter()
          .append('line')
          .classed('sszvis-legend--mark', true);

        lines.exit().remove();

        lines
          .attr('x1', function(d) { return Math.round(d.x); })
          .attr('x2', function(d) { return Math.round(d.x); })
          .attr('y1', 0)
          .attr('y2', segHeight + 4)
          .attr('stroke', '#909090');

        var labels = selection.selectAll('.sszvis-legend__label')
          .data(labelData);

        labels.enter()
          .append('text')
          .classed('sszvis-legend__label', true);

        labels.exit().remove();

        labels
          .attr('text-anchor', 'middle')
          .attr('transform', function(d, i) { return 'translate(' + (d.x) + ',' + (segHeight + 16) + ')'; })
          .text(function(d) {
            return props.valueFormat(d.p0);
          });
      });
  };

});
