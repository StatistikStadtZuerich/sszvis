/**
 * highlight renderer component
 *
 * @module sszvis/map/renderer/highlight
 *
 * A component used internally for rendering the highlight layer of maps.
 * The highlight layer accepts an array of data values to highlight, and renders
 * The map entities associated with those data values using a special stroke.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.map.renderer.highlight', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('keyName').keyName(sszvis.map.utils.GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
      .prop('geoJson')
      .prop('mapPath')
      .prop('highlight').highlight([]) // an array of data values to highlight
      .prop('highlightStroke', d3.functor).highlightStroke('white') // a function for highlighted entity stroke colors (default: white)
      .prop('highlightStrokeWidth', d3.functor).highlightStrokeWidth(2)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var highlightBorders = selection
          .selectAll('.sszvis-map__highlight');

        if (!props.highlight.length) {
          highlightBorders.remove();
          return true; // no highlight, no worry
        }

        var groupedMapData = props.geoJson.features.reduce(function(m, feature) {
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

        highlightBorders = highlightBorders.data(mergedHighlight);

        highlightBorders.enter()
          .append('path')
          .classed('sszvis-map__highlight', true);

        highlightBorders.exit().remove();

        highlightBorders
          .attr('d', function(d) { return props.mapPath(d.geoJson); })
          .style('stroke', function(d) { return props.highlightStroke(d.datum); })
          .style('stroke-width', function(d) { return props.highlightStrokeWidth(d.datum); });
      });
  };

});
