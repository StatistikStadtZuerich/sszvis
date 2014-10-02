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

        var segments = selection.selectAll('path')
          .data(data);

        segments.enter()
          .append('path')
          .classed('sszvis-path', true);

        segments
          .attr('transform', 'translate(' + props.radius + ',' + props.radius + ')')
          .attr('d', arcGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});