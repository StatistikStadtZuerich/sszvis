/**
 * Map Component
 *
 * Use this component to make a map, either of the city of Zurich or of Switzerland
 * @return {d3.component}
 *
 * props.type options:
 * zurich-stadtkreise
 * zurich-statistischeQuartiere
 * zurich-wahlkreise
 * switzerland-cantons
 */
namespace('sszvis.map', function(module) {
  'use strict';

  function swissMapPath(width, height, featureCollection) {
        var mercatorProjection = d3.geo.mercator()
          .rotate([-7.439583333333333, -46.95240555555556]);

          mercatorProjection
            .scale(1)
            .translate([0, 0]);

        var mercatorPath = d3.geo.path()
          .projection(mercatorProjection);

        var b = mercatorPath.bounds(featureCollection),
            s = 0.96 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        mercatorProjection
            .scale(s)
            .translate(t);

        return mercatorPath;
  }

  var COMPILED_MAPS = {
    compiled: false,
    zurich: {},
    zurichMesh: {},
    switzerlandGeo: {},
    switzerlandMesh: {}
  };

  function compileMaps() {
    if (COMPILED_MAPS.compiled) return true;

    var zurichNames = ['stadtkreise_geo', 'statistische_quartiere_geo', 'wahlkreise_geo'],
        zurichTopology = sszvis.mapdata.zurich,
        zurichObjects = zurichTopology.objects;

    zurichNames.forEach(function(name) {
      COMPILED_MAPS.zurich[name] = topojson.feature(zurichTopology, zurichObjects[name]);
    });

    zurichNames.forEach(function(name) {
      COMPILED_MAPS.zurichMesh[name] = topojson.mesh(zurichTopology, zurichObjects[name]);
    });

    COMPILED_MAPS.zurich.zurichsee_geo = topojson.feature(zurichTopology, zurichObjects.zurichsee_geo);

    COMPILED_MAPS.switzerlandGeo = topojson.feature(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    COMPILED_MAPS.switzerlandMesh = topojson.mesh(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    COMPILED_MAPS.compiled = true;

    return true;
  }

  module.exports = function() {
    return d3.component()
      .prop('type')
      .prop('keyName').keyName('geoId')
      .prop('width')
      .prop('height')
      .prop('fill').fill(function() { return 'black'; }) // default is black
      .prop('stroke').stroke(function() { return 'none'; }) // default is none
      .render(function(data) {
        if (typeof topojson === 'undefined') {
          throw new Error('sszvis.map component requires topojson as an additional dependency');
        }

        compileMaps();

        var selection = d3.select(this);
        var props = selection.props();

        var mapData, meshData;
        switch (props.type) {
          case 'zurich-stadtkreise':
            mapData = COMPILED_MAPS.zurich.stadtkreise_geo;
            meshData = COMPILED_MAPS.zurichMesh.stadtkreise_geo;
            break;
          case 'zurich-statistischeQuartiere':
            mapData = COMPILED_MAPS.zurich.statistische_quartiere_geo;
            meshData = COMPILED_MAPS.zurichMesh.statistische_quartiere_geo;
            break;
          case 'zurich-wahlkreise':
            mapData = COMPILED_MAPS.zurich.wahlkreise_geo;
            meshData = COMPILED_MAPS.zurichMesh.wahlkreise_geo;
            break;
          case 'switzerland-cantons':
            mapData = COMPILED_MAPS.switzerlandGeo;
            meshData = COMPILED_MAPS.switzerlandMesh;
            break;
          default:
            throw new Error('incorrect map type specified: ' + props.type);
        }

        var mapPath = swissMapPath(props.width, props.height, mapData);

        sszvis.patterns.ensurePattern(selection, 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        var baseGroups = selection.selectAll('.sszvis-map-group')
          .data(mapData.features);

        var mapGroupsEnter = baseGroups.enter()
          .append('g')
          .classed('sszvis-map-group', true);

        mapGroupsEnter
          .append('path')
          .datum(function(d) {
            var o = {
              geoJson: d
            };
            o[props.keyName] = d.id;
            return o;
          })
          .classed('sszvis-map__area', true)
          .attr('d', sszvis.fn.compose(mapPath, sszvis.fn.prop('geoJson')))
          .attr('fill', 'url(#missing-pattern)');

        // add borders
        selection
          .selectAll('.sszvis-map__border')
          .data([meshData])
          .enter()
          .append('path')
          .classed('sszvis-map__border', true)
          .attr('d', mapPath);

        baseGroups.exit().remove();

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(mapPath.centroid);

        baseGroups.call(tooltipAnchor);

        var joinedShapes = baseGroups.selectAll('.sszvis-map-area')
          .data(data, sszvis.fn.prop(props.keyName));

        joinedShapes
          .transition()
          .call(sszvis.transition.fastTransition)
          .attr('fill', props.fill);

        joinedShapes.exit()
          .attr('fill', 'url(#missing-pattern)');

        baseGroups.data(data, sszvis.fn.prop(props.keyName));

        // special rendering for lake zurich
        if (props.type.indexOf('zurich-') >= 0) {
          sszvis.patterns.ensurePattern(selection, 'lake-pattern')
            .call(sszvis.patterns.mapLakePattern);

          var zurichSee = selection.selectAll('.sszvis-lake-zurich')
            .data([COMPILED_MAPS.zurich.zurichsee_geo]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map__area sszvis-lake-zurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', 'url(#lake-pattern)');
        }
      });
  };

});
