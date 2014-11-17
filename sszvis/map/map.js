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

  function compileFeature(rootTopo, objectName) {
    return topojson.feature(rootTopo, rootTopo.objects[objectName]);
  }

  function compileMesh(rootTopo, objectName) {
    return topojson.mesh(rootTopo, rootTopo.objects[objectName]);
  }

  // The MapData object contains the geoJson objects compiled from the TopoJSON format.
  // If it's necessary, the getter functions compile the raw topoJson map data into geoJson.
  // This way, the data can be transmitted as much more compact topoJson, and expanded in-memory into
  // the geoJson necessary for rendering map entities. Note that this compilation step requires the topojson
  // client-side library as a dependency (https://github.com/mbostock/topojson/blob/master/topojson.js)
  var MapData = {};

  MapData.getSwitzerland = function() {
    return {
      // feature data - a collection of distinct entities
      featureData: MapData.switzerlandGeo || (MapData.switzerlandGeo = compileFeature(sszvis.mapdata.switzerland, 'cantons')),
      // mesh data - a single line that represents all Swiss borders
      meshData: MapData.switzerlandMesh || (MapData.switzerlandMesh = compileMesh(sszvis.mapdata.switzerland, 'cantons'))
    };
  };

  var ZURICH_DATA_NAMES = {
    'getZurichStadtKreis': 'stadtkreis',
    'getZurichStatistischeQuartiere': 'statistische_quartiere',
    'getZurichWahlkreis': 'wahlkreis'
  };

  Object.keys(ZURICH_DATA_NAMES).forEach(function(accFnName) {
    var geoDataName = ZURICH_DATA_NAMES[accFnName],
        meshDataName = geoDataName + 'Mesh',
        seeBoundsName = geoDataName + '_seebounds';
    MapData[accFnName] = function() {
      return {
        // feature data - a collection of distinct entities
        featureData: MapData[geoDataName] || (MapData[geoDataName] = compileFeature(sszvis.mapdata.zurich, geoDataName)),
        // mesh data - a single line that includes all the borders of the entities
        meshData: MapData[meshDataName] || (MapData[meshDataName] = compileMesh(sszvis.mapdata.zurich, geoDataName)),
        // the lake zurich feature - shared by all three zurich map types
        lakeFeature: MapData.lakeZurichGeo || (MapData.lakeZurichGeo = compileFeature(sszvis.mapdata.zurich, 'zurichsee')),
        // seebounds: the section of the map bounds which lies over the Zürichsee
        lakeBounds: MapData[seeBoundsName] || (MapData[seeBoundsName] = compileMesh(sszvis.mapdata.zurich, seeBoundsName))
      };
    };
  });

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

        var selection = d3.select(this);
        var props = selection.props();

        // determine which map data objects to use
        // the getter functions compile the maps from TopoJSON to GeoJSON, but only if they haven't already been compiled
        var mapInstanceData;
        switch (props.type) {
          case 'zurich-stadtkreise':
            mapInstanceData = MapData.getZurichStadtKreis();
            break;
          case 'zurich-statistischeQuartiere':
            mapInstanceData = MapData.getZurichStatistischeQuartiere();
            break;
          case 'zurich-wahlkreise':
            mapInstanceData = MapData.getZurichWahlkreis();
            break;
          case 'switzerland-cantons':
            mapInstanceData = MapData.getSwitzerland();
            break;
          default:
            throw new Error('incorrect map type specified: ' + props.type);
        }

        // create a map path generator function
        var mapPath = swissMapPath(props.width, props.height, mapInstanceData.featureData);

        // render the missing value pattern
        sszvis.patterns.ensureDefsElement(selection, 'pattern', 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        // group the input data by map entity id
        var groupedInputData = data.reduce(function(m, v) {
          m[v[props.keyName]] = v;
          return m;
        }, {});

        // merge the map features and the input data into new objects that include both
        var mergedData = mapInstanceData.featureData.features.map(function(feature) {
          return {
            geoJson: feature,
            datum: groupedInputData[feature.id]
          };
        });

        // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
        function getMapFill(d) {
          return sszvis.fn.defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
        }

        var mapAreas = selection.selectAll('.sszvis-map__area')
          .data(mergedData);

        // add the base map paths - these are filled according to the map fill function
        mapAreas.enter()
          .append('path')
          .classed('sszvis-map__area', true)
          .attr('d', function(d) {
            return mapPath(d.geoJson);
          })
          .attr('fill', getMapFill);

        mapAreas.exit().remove();

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
            var computedCenter = d.geoJson.properties.computedCenter;
            var center = d.geoJson.properties.center;
            if (computedCenter) {
              return computedCenter;
            } else if (center) {
              // properties.center should be a string of the form "longitude,latitude"
              var parsed = center.split(',').map(parseFloat);
              return d.geoJson.properties.computedCenter = mapPath.projection()(parsed);
            } else {
              return d.geoJson.properties.computedCenter = mapPath.centroid(d.geoJson);
            }
          });

        var tooltipGroup = selection.selectGroup('tooltipAnchors')
          .datum(mergedData);

        // attach tooltip anchors
        tooltipGroup.call(tooltipAnchor);

        // add the map borders. These are rendered as one single path element
        selection
          .selectAll('.sszvis-map__border')
          .data([mapInstanceData.meshData])
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
            .data([mapInstanceData.lakeFeature]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map__lakezurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', 'url(#lake-pattern)')
            // this mask applies the fade effect
            .attr('mask', 'url(#lake-fade-mask)');

          // add a path for the boundaries of map entities which extend over the lake.
          // This path is rendered as a dotted line over the lake shape
          var lakePath = selection.selectAll('.sszvis-map__lakepath')
            .data([mapInstanceData.lakeBounds]);

          lakePath.enter()
            .append('path')
            .classed('sszvis-map__lakepath', true);

          lakePath.exit().remove();

          lakePath
            .attr('d', mapPath);
        }

        // handle highlighted entities
        if (props.highlight) {
          var groupedMapData = mapInstanceData.featureData.features.reduce(function(m, feature) {
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
