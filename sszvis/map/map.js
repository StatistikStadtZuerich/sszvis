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

  var COMPILED_MAPS = {
    compiled: false,
    zurich: {},
    switzerland: {}
  };

  function compile_maps() {
    if (COMPILED_MAPS.compiled) return true;

    var zuri_names = ['stadtkreise_geo', 'statistische_quartiere_geo', 'wahlkreise_geo'],
        zuri_topology = sszvis.mapdata.zurich,
        zuri_objects = zuri_topology.objects;

    zuri_names.forEach(function(name) {
      COMPILED_MAPS.zurich[name] = topojson.feature(zuri_topology, zuri_objects[name]);
    });

    COMPILED_MAPS.zurich.zurichsee_geo = topojson.feature(zuri_topology, zuri_objects.zurichsee_geo);

    return COMPILED_MAPS.compiled = true;
  }

  module.exports = function() {
    return d3.component()
      .prop('type')
      .prop('width')
      .prop('height')
      .prop('fill')
      .render(function(data) {
        if (typeof topojson === 'undefined') {
          throw new Error('sszvis.map component requires topojson as an additional dependency');
        }

        compile_maps();

        var selection = d3.select(this);
        var props = selection.props();

        var mapData;
        switch (props.type) {
          case 'zurich-stadtkreise': mapData = COMPILED_MAPS.zurich.stadtkreise_geo; break;
          case 'zurich-statistischeQuartiere': mapData = COMPILED_MAPS.zurich.statistische_quartiere_geo; break;
          case 'zurich-wahlkreise': mapData = COMPILED_MAPS.zurich.wahlkreise_geo; break;
        }

        var mapPath = swissMapPath(props.width, props.height, mapData);

        mapData.features.forEach(function(f) {
          f._datum = data[f.id] || null;
        });

        var shapes = selection.selectAll('.sszvis-map-area')
          .data(mapData.features);

        shapes.enter()
          .append('path')
          .classed('sszvis-map-area', true);

        shapes.exit().remove();

        shapes
          .attr('d', mapPath)
          .attr('fill', function(d) { return props.fill(d._datum); });

        // special rendering for lake zurich
        // TODO: make this configuration better
        if (props.type.indexOf('zurich') >= 0) {
          var zurichSee = selection.selectAll('.sszvis-lake-zurich')
            .data([COMPILED_MAPS.zurich.zurichsee_geo]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map-area sszvis-lake-zurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', '#fff');
        }
      });
  };

});