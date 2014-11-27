/**
 *
 * Radius size legend. Use for showing how different radius sizes correspond to data values.
 *
 * @module sszvis/legend/radius
 *
 * @property {function} scale                     A scale to use to generate the radius sizes
 * @property {string, function} fill              A function or string that gives a fill color for the demonstration circles (default white)
 * @property {string, function} stroke            A function or string that gives a stroke color for the demonstration circles (default black)
 * @property {number, function} strokeWidth       A number or function that gives a stroke width for the demonstration circles (default 1.25)
 * @property {function} labelFormat               Formatter function for the labels (default identity)
 *
 * @returns {d3.component}
 */
namespace('sszvis.legend.radius', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('fill').fill('#fff')
      .prop('stroke').stroke('#000')
      .prop('strokeWidth').strokeWidth(1.25)
      .prop('labelFormat').labelFormat(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var domain = props.scale.domain();
        var points = [domain[1], Math.round(d3.mean(domain)), domain[0]];
        var maxRadius = sszvis.fn.scaleRange(props.scale)[1];

        var group = selection.selectAll('g.sszvis-legend__elementgroup')
          .data([0]);

        group.enter().append('g').attr('class', 'sszvis-legend__elementgroup');

        group.attr('transform', sszvis.fn.translateString(sszvis.fn.roundPixelCrisp(maxRadius), sszvis.fn.roundPixelCrisp(maxRadius)));

        var circles = group.selectAll('circle.sszvis-legend__greyline')
          .data(points);

        circles.enter()
          .append('circle')
          .classed('sszvis-legend__greyline', true);

        circles.exit().remove();

        function getCircleCenter(d) {
          return maxRadius - props.scale(d);
        }

        function getCircleEdge(d) {
          return maxRadius - 2 * props.scale(d);
        }

        circles
          .attr('r', props.scale)
          .attr('stroke-width', 1.2)
          .attr('cy', getCircleCenter);

        var lines = group.selectAll('line.sszvis-legend__dashedline')
          .data(points);

        lines.enter()
          .append('line')
          .classed('sszvis-legend__dashedline', true);

        lines.exit().remove();

        lines
          .attr('x1', 0)
          .attr('y1', getCircleEdge)
          .attr('x2', maxRadius + 15)
          .attr('y2', getCircleEdge);

        var labels = group.selectAll('text.sszvis-legend__label')
          .data(points);

        labels.enter()
          .append('text')
          .attr('class', 'sszvis-legend__label sszvis-legend__label--small');

        labels.exit().remove();

        labels
          .attr('dx', maxRadius + 18)
          .attr('y', getCircleEdge)
          .attr('dy', '0.35em') // vertically-center
          .text(props.labelFormat);
      });
  };

});
