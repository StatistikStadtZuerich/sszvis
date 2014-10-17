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

  function missingValuePattern(selection) {
    var pWidth = 4;
    var pHeight = 4;

    selection
      .attr('id', 'missing-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#bfbfbf');

    selection
      .append('line')
      .attr('x1', pWidth)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', pHeight)
      .attr('stroke', '#737373');
  }

  function lakePattern(selection) {
    var pWidth = 6;
    var pHeight = 6;

    selection
      .attr('id', 'lake-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#fff');

    selection
      .append('line')
      .attr('x1', pWidth)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', pHeight)
      .attr('stroke', '#d0d0d0');
  }

  var COMPILED_MAPS = {
    compiled: false,
    zurich: {},
    switzerland_geo: {}
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

    COMPILED_MAPS.switzerland_geo = topojson.feature(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

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

        compile_maps();

        var selection = d3.select(this);
        var props = selection.props();

        var mapData;
        switch (props.type) {
          case 'zurich-stadtkreise': mapData = COMPILED_MAPS.zurich.stadtkreise_geo; break;
          case 'zurich-statistischeQuartiere': mapData = COMPILED_MAPS.zurich.statistische_quartiere_geo; break;
          case 'zurich-wahlkreise': mapData = COMPILED_MAPS.zurich.wahlkreise_geo; break;
          case 'switzerland-cantons': mapData = COMPILED_MAPS.switzerland_geo; break;
          default: throw new Error('incorrect map type specified: ' + props.type);
        }

        var mapPath = swissMapPath(props.width, props.height, mapData);

        var defs = selection.selectAll('.sszvis-map-defs')
          .data([1])
          .enter()
          .append('defs')
          .classed('sszvis-map-defs', true);

        var newMissingPattern = defs
          .selectAll('.sszvis-map-pattern#missing-pattern')
          .data([1])
          .enter()
          .append('pattern')
          .call(missingValuePattern);

        var baseGroups = selection.selectAll('.sszvis-map-group')
          .data(mapData.features);

        var mapShapes = baseGroups.enter()
          .append('g')
          .classed('sszvis-map-group', true)
              .append('path')
              .datum(function(d) {
                var o = {
                  geoJson: d
                };
                o[props.keyName] = d.id;
                return o;
              })
              .classed('sszvis-map-area', true)
              .attr('d', sszvis.fn.compose(mapPath, sszvis.fn.prop('geoJson')))
              .attr('fill', 'url(#missing-pattern)');

        baseGroups.exit().remove();

        var joinedShapes = baseGroups.selectAll('.sszvis-map-area')
          .data(data, sszvis.fn.prop(props.keyName));

        joinedShapes
          .transition()
          .call(sszvis.transition.fastTransition)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        joinedShapes.exit()
          .attr('fill', 'url(#missing-pattern)');

        // special rendering for lake zurich
        if (props.type.indexOf('zurich-') >= 0) {
          var newLakePattern = defs
            .selectAll('.sszvis-map-pattern#lake-pattern')
            .data([1])
            .enter()
            .append('pattern')
            .call(lakePattern);

          var zurichSee = selection.selectAll('.sszvis-lake-zurich')
            .data([COMPILED_MAPS.zurich.zurichsee_geo]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map-area sszvis-lake-zurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            // TODO: add special texturing for Lake Zurich
            .attr('fill', 'url(#lake-pattern)');
        }
      });
  };

});