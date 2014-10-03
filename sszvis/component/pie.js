/**
 * Pie component
 * @return {d3.component}
*/
namespace('sszvis.component.pie', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('radius')
      .prop('fill')
      .prop('stroke')
      .prop('angle')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var angle = 0;
        data.forEach(function(value) {
          value.a0 = angle;
          angle += props.angle(value);
          value.a1 = angle;
        });

        var arcGen = d3.svg.arc()
          .innerRadius(4)
          .outerRadius(props.radius)
          .startAngle(function(d) { return d.a0; })
          .endAngle(function(d) { return d.a1; });

        var segments = selection.selectAll('path.sszvis-path')
          .data(data);

        segments.enter()
          .append('path')
          .classed('sszvis-path', true);

        segments.exit().remove();

        segments
          .attr('transform', 'translate(' + props.radius + ',' + props.radius + ')')
          .attr('d', arcGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);


        var tipAnchors = selection.selectAll('[sszvis-tooltip-anchor]')
          .data(data);

        tipAnchors.enter()
          .append('g')
          .attr('data-tooltip-anchor', '');

        tipAnchors
          .attr('transform', function(d) {
            var a = d.a0 + (Math.abs(d.a1 - d.a0) / 2) - Math.PI/2;
            var r = props.radius * 2/3;
            var x = props.radius + Math.cos(a) * r;
            var y = props.radius + Math.sin(a) * r;

            return 'translate(' + x + ',' + y + ')';
          });

        tipAnchors.exit().remove();

      });
  };

});
