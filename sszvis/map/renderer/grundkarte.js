/**
 * grundkarte renderer component
 *
 * This component is used internally as a renderer for simple "grundkarte" base maps.
 * It is used by the "grundkarte" functions for each of the map types.
 */
sszvis_namespace('sszvis.map.renderer.grundkarte', function(module) {
  'use strict';

  module.exports = function() {
    var mesh = sszvis.map.renderer.mesh();

    var component = d3.component()
      .prop('geoJson')
      .prop('featureData')
      .prop('mapPathCacheKey')
      .prop('width')
      .prop('height')
      .delegate('borderColor', mesh).borderColor('black')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        // create a map path generator function
        var mapPath = sszvis.map.utils.swissMapPath(props.width, props.height, props.featureData, props.mapPathCacheKey);

        mesh
          .geoJson(props.geoJson)
          .mapPath(mapPath);

        selection.call(mesh);
      });

    return component;
  };

});
