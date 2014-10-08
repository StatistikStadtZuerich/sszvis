/**
 * Map Component
 *
 * Use this component to make a map, either of the city of Zurich or of Switzerland
 * @return {d3.component}
 */
namespace('sszvis.map', function(module) {

  function swissMapPath(width, height, featureCollection) {
        var mercatorProjection = d3.geo.mercator()
          .rotate([-7.439583333333333, -46.95240555555556]);

          mercatorProjection
            .scale(1)
            .translate([0, 0]);

        var mercatorPath = d3.geo.path()
          .projection(mercatorProjection);

        var b = mercatorPath.bounds(featureCollection),
            s = .96 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        mercatorProjection
            .scale(s)
            .translate(t);

        return mercatorPath;
  }

  module.exports = function() {
    return d3.component()
      .prop('type')
      .prop('width')
      .prop('height')
      .prop('fill')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var mapData;
        switch (props.type) {
          case 'zurich-stadtkreise': mapData = sszvis.data.zurich.stadtkreise; break;
          case 'zurich-statistischeQuartiere': mapData = sszvis.data.zurich.statistischeQuartiere; break;
          case 'zurich-wahlkreise': mapData = sszvis.data.zurich.wahlkreise; break;
        }

        var mapPath = swissMapPath(props.width, props.height, mapData);

        var shapes = selection.selectAll('.sszvis-map')
          .data(mapData.features);

        shapes.enter()
          .append('path')
          .classed('sszvis-map', true);

        shapes.exit().remove();

        shapes
          .attr('d', mapPath)
          .attr('fill', function(d) {
            console.log(d);
          });
      });
  };

});