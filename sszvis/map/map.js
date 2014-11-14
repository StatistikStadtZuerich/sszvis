/**
 * Map Component
 *
 * Use this component to make a map, either of the city of Zurich or of Switzerland.
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible values depend on the map type you are using.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. The key for this value is configurable.
 * The default key which map.js expects is geoId, but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @module  sszvis/map
 *
 * @property {String} type                            The type of the chart. This must be one of the following options: "zurich-stadtkreise", "zurich-statistischeQuartiere", "zurich-wahlkreise", "switzerland-cantons"
 * @property {String} keyName                         The map entity key name. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value. Map entities with data values that fail this predicate test will display the missing value texture
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 *
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {d3.component}
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
            s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
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
    // an event dispatcher
    var event = d3.dispatch('over', 'out', 'click');

    var mapComponent = d3.component()
      .prop('type') // the map type. Four possible values
      .prop('keyName').keyName('geoId') // the name of the data key that identifies which map entity it belongs to
      .prop('highlight') // an array of data values to highlight
      .prop('highlightStroke', d3.functor) // a function for highlighted entity stroke colors
      .prop('width') // the width of the map
      .prop('height') // the height of the map
      .prop('defined', d3.functor).defined(true) // a predicate function to determine whether a datum has a defined value
      .prop('fill', d3.functor).fill(function() { return 'black'; }) // a function for the entity fill color. default is black
      .prop('borderColor').borderColor('white') // A function or string for the color of all borders. Note: all borders have the same color
      .render(function(data) {
        // dependency necessary
        if (typeof topojson === 'undefined') {
          throw new Error('sszvis.map component requires topojson.js as an additional dependency: https://github.com/mbostock/topojson');
        }

        // this function compiles the maps to GeoJSON, but only if they haven't already been compiled
        ensureCompiledMaps();

        var selection = d3.select(this);
        var props = selection.props();

        // determine which map data objects to use
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

        // create a map path generator function
        var mapPath = swissMapPath(props.width, props.height, mapData);

        // render the missing value pattern
        sszvis.patterns.ensureDefsElement(selection, 'pattern', 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        // group the input data by map entity id
        var groupedInputData = data.reduce(function(m, v) {
          m[v[props.keyName]] = v;
          return m;
        }, {});

        // merge the map features and the input data into new objects that include both
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

        // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
        function getMapFill(d) {
          return sszvis.fn.defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
        }

        // add the base map paths - these are filled according to the map fill function
        mapGroupsEnter
          .append('path')
          .classed('sszvis-map__area', true)
          .attr('d', function(d) {
            return mapPath(d.geoJson);
          })
          .attr('fill', getMapFill);

        // propagate the data to the baseGroup child elements
        var mapAreas = baseGroups.selectAll('.sszvis-map__area')
          .data(function(d) { return [d]; });

        // change the fill if necessary
        mapAreas
          .transition()
          .call(sszvis.transition)
          .attr('fill', getMapFill);

        // attach events
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

        // the tooltip anchor generator
        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            var center = d.geoJson.properties.center;
            // properties.center should be a string of the form "longitude,latitude"
            if (center) {
              var parsed = center.split(',').map(parseFloat);
              return mapPath.projection()(parsed);
            } else {
              return mapPath.centroid(d.geoJson);
            }
          });

        // attach tooltip anchors
        baseGroups.call(tooltipAnchor);

        // add the map borders. These are rendered as one single path element
        selection
          .selectAll('.sszvis-map__border')
          .data([meshData])
          .enter()
          .append('path')
          .classed('sszvis-map__border', true)
          .attr('d', mapPath)
          .attr('stroke', props.borderColor);

        // special rendering for Zürichsee
        if (props.type.indexOf('zurich-') >= 0) {
          // the lake texture
          sszvis.patterns.ensureDefsElement(selection, 'pattern', 'lake-pattern')
            .call(sszvis.patterns.mapLakePattern);

          // the fade gradient
          sszvis.patterns.ensureDefsElement(selection, 'linearGradient', 'lake-fade-gradient')
            .call(sszvis.patterns.mapLakeFadeGradient);

          // the mask, which uses the fade gradient
          sszvis.patterns.ensureDefsElement(selection, 'mask', 'lake-fade-mask')
            .call(sszvis.patterns.mapLakeGradientMask);

          // generate the lake zurich path
          var zurichSee = selection.selectAll('.sszvis-map__lakezurich')
            .data([COMPILED_MAPS.zurichGeo.zurichsee]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map__area sszvis-map__lakezurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', 'url(#lake-pattern)')
            // this mask applies the fade effect
            .attr('mask', 'url(#lake-fade-mask)');

          // add a path for the boundaries of map entities which extend over the lake.
          // This path is rendered as a dotted line over the lake shape
          var lakePath = selection.selectAll('.sszvis-map__lakepath')
            .data([lakeBounds]);

          lakePath.enter()
            .append('path')
            .classed('sszvis-map__lakepath', true);

          lakePath.exit().remove();

          lakePath
            .attr('d', mapPath);
        }

        // handle highlighted entities
        if (props.highlight) {
          var groupedMapData = mapData.features.reduce(function(m, feature) {
            m[feature.id] = feature;
            return m;
          }, {});

          // merge the highlight data
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
            .classed('sszvis-map__highlight', true);

          highlightBorders.exit().remove();

          highlightBorders
            .attr('d', function(d) {
              return mapPath(d.geoJson);
            })
            .attr('stroke', function(d) {
              return props.highlightStroke(d.datum);
            });
        }
      });

    // bind event functions to the component
    d3.rebind(mapComponent, event, 'on');

    return mapComponent;
  };

});
