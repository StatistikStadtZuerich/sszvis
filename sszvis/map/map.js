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

  // This is a special d3.geo.path generator function tailored for rendering maps of
  // Switzerland. The values are chosen specifically to optimize path generation for
  // Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
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
    zurichGeo: {},
    zurichMesh: {},
    switzerlandGeo: {},
    switzerlandMesh: {}
  };

  function ensureCompiledMaps() {
    // this function compiles the raw topoJson map data into geoJson for use in rendering maps.
    // This way, the data can be transmitted as much more compact topoJson, and expanded in-memory into
    // the geoJson necessary for rendering map entities. Note that this compilation step requires the topojson
    // client-side library as a dependency (https://github.com/mbostock/topojson/blob/master/topojson.js)
    if (COMPILED_MAPS.compiled) return true;

    var zurichNames = ['stadtkreis', 'statistische_quartiere', 'wahlkreis'],
        zurichTopo = sszvis.mapdata.zurich; // raw zurich topojson

    // compile zurich topoJson to GeoJson
    zurichNames.forEach(function(name) {
      COMPILED_MAPS.zurichGeo[name] = topojson.feature(zurichTopo, zurichTopo.objects[name]);
    });

    // compile Zurich topoJson to a mesh (boundaries only, shared boundaries are not repeated)
    zurichNames.forEach(function(name) {
      COMPILED_MAPS.zurichMesh[name] = topojson.mesh(zurichTopo, zurichTopo.objects[name]);
    });

    // compile the zurichsee geoJson
    COMPILED_MAPS.zurichGeo.zurichsee = topojson.feature(zurichTopo, zurichTopo.objects.zurichsee);

    // compile the seebounds shapes
    zurichNames.map(function(n) { return n + '_seebounds'; }).forEach(function(name) {
      COMPILED_MAPS.zurichMesh[name] = topojson.mesh(zurichTopo, zurichTopo.objects[name]);
    });

    // compile the Switzerland geoJson
    COMPILED_MAPS.switzerlandGeo = topojson.feature(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    // compile the Switzerland topoJson to a mesh
    COMPILED_MAPS.switzerlandMesh = topojson.mesh(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    COMPILED_MAPS.compiled = true;

    return true;
  }

  module.exports = function() {
    var event = d3.dispatch('over', 'out', 'click');

    var mapComponent = d3.component()
      .prop('type')
      .prop('keyName').keyName('geoId')
      .prop('highlight')
      .prop('highlightStroke', d3.functor)
      .prop('width')
      .prop('height')
      .prop('fill').fill(function() { return 'black'; }) // default is black
      .prop('stroke').stroke(function() { return 'white'; }) // default is white
      .render(function(data) {
        if (typeof topojson === 'undefined') {
          throw new Error('sszvis.map component requires topojson.js as an additional dependency: https://github.com/mbostock/topojson');
        }

        ensureCompiledMaps();

        var selection = d3.select(this);
        var props = selection.props();

        var mapData, meshData, lakeBounds;
        switch (props.type) {
          case 'zurich-stadtkreise':
            mapData = COMPILED_MAPS.zurichGeo.stadtkreis;
            meshData = COMPILED_MAPS.zurichMesh.stadtkreis;
            lakeBounds = COMPILED_MAPS.zurichMesh.stadtkreis_seebounds;
            break;
          case 'zurich-statistischeQuartiere':
            mapData = COMPILED_MAPS.zurichGeo.statistische_quartiere;
            meshData = COMPILED_MAPS.zurichMesh.statistische_quartiere;
            lakeBounds = COMPILED_MAPS.zurichMesh.statistische_quartiere_seebounds;
            break;
          case 'zurich-wahlkreise':
            mapData = COMPILED_MAPS.zurichGeo.wahlkreis;
            meshData = COMPILED_MAPS.zurichMesh.wahlkreis;
            lakeBounds = COMPILED_MAPS.zurichMesh.wahlkreis_seebounds;
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

        var groupedInputData = data.reduce(function(m, v) {
          m[v[props.keyName]] = v;
          return m;
        }, {});

        var mergedData = mapData.features.map(function(feature) {
          return {
            geoJson: feature,
            datum: groupedInputData[feature.id]
          };
        });

        var baseGroups = selection.selectAll('.sszvis-map-group')
          .data(mergedData);

        var mapGroupsEnter = baseGroups.enter()
          .append('g')
          .classed('sszvis-map-group', true);

        baseGroups.exit().remove();

        mapGroupsEnter
          .append('path')
          .classed('sszvis-map__area', true)
          .attr('d', function(d) {
            return mapPath(d.geoJson);
          });

        var mapAreas = baseGroups.selectAll('.sszvis-map__area')
          .data(function(d) { return [d]; });

        mapAreas
          .transition()
          .call(sszvis.transition.fastTransition)
          .attr('fill', function(d) {
            return sszvis.fn.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
          });

        mapAreas
          .on('mouseover', function(d) {
            event.over(d.datum);
          })
          .on('mouseout', function(d) {
            event.out(d.datum);
          })
          .on('click', function(d) {
            event.click(d.datum);
          });

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            var center = d.geoJson.properties.center;
            return center ? mapPath.projection()(center) : mapPath.centroid(d.geoJson);
          });

        baseGroups.call(tooltipAnchor);

        // add borders
        selection
          .selectAll('.sszvis-map__border')
          .data([meshData])
          .enter()
          .append('path')
          .classed('sszvis-map__border', true)
          .attr('d', mapPath)
          .attr('stroke', props.stroke);

        // special rendering for Zürichsee
        if (props.type.indexOf('zurich-') >= 0) {
          sszvis.patterns.ensurePattern(selection, 'lake-pattern')
            .call(sszvis.patterns.mapLakePattern);

          var zurichSee = selection.selectAll('.sszvis-map__lakezurich')
            .data([COMPILED_MAPS.zurichGeo.zurichsee]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map__area sszvis-map__lakezurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', 'url(#lake-pattern)');

          var lakePath = selection.selectAll('.sszvis-map__lakepath')
            .data([lakeBounds]);

          lakePath.enter()
            .append('path')
            .classed('sszvis-map__lakepath', true);

          lakePath.exit().remove();

          lakePath
            .attr('d', mapPath);
        }

        if (props.highlight) {
          var groupedMapData = mapData.features.reduce(function(m, feature) {
            m[feature.id] = feature; return m;
          }, {});

          var mergedHighlight = props.highlight.reduce(function(m, v) {
            if (v) {
              m.push({
                geoJson: groupedMapData[v[props.keyName]],
                datum: v
              });
            }
            return m;
          }, []);

          var highlightBorders = selection
            .selectAll('.sszvis-map__highlight')
            .data(mergedHighlight);

          highlightBorders.enter()
            .append('path')
            .classed('sszvis-map__highlight', true)
            .attr('d', function(d) {
              return mapPath(d.geoJson);
            });

          highlightBorders.exit().remove();

          highlightBorders
            .attr('stroke', function(d) {
              return props.highlightStroke(d.datum);
            });
        }
      });

    d3.rebind(mapComponent, event, 'on');

    return mapComponent;
  };

});
