/**
 * buildings renderer component
 *
 * @module sszvis/map/renderer/buildings
 *
 * A component used for rendering overlays of buildings above map layers. Technically,
 * it can be used to render any arbitrary GeoJson.
 *
 * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
 *                                          with geographic entities. Default 'geoId'.
 * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
 *                                          with data entities. Default 'id'.
 * @property {GeoJson} geoJson              The GeoJson object which should be rendered. Needs to have a 'features' property.
 * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
 * @property {Function, Boolean} defined    A function which, when given a data value, returns whether or not data in that value is defined.
 * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
 * @property {String} stroke                The stroke color of the entities. Can be a string or a function returning a string. Default black.
 * @property {Number} strokeWidth           The thickness of the strokes of the shapes. Can be a number or a function returning a number. Default 1.25.
 * @property {Boolean} transitionColor      Whether or not to transition the fill color of the buildings when it changes. Default true.
 * 
 * @return {d3.component}
 */
sszvis_namespace('sszvis.map.renderer.buildings', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('over', 'out', 'click');

    var component = d3.component()
      .prop('dataKeyName').dataKeyName('geoId')
      .prop('geoJsonKeyName').geoJsonKeyName('id')
      .prop('geoJson')
      .prop('mapPath')
      .prop('defined', d3.functor).defined(true)
      .prop('fill', d3.functor).fill('black')
      .prop('stroke', d3.functor).stroke('black')
      .prop('strokeWidth', d3.functor).strokeWidth(1.25)
      .prop('transitionColor').transitionColor(true)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // render the missing value pattern
        sszvis.svgUtils.ensureDefsElement(selection, 'pattern', 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        // getDataKeyName will be called on data values. It should return a map entity id.
        // getMapKeyName will be called on the 'properties' of each map feature. It should
        // return a map entity id. Data values are matched with corresponding map features using
        // these entity ids.
        var getDataKeyName = sszvis.fn.prop(props.dataKeyName);
        var getMapKeyName = sszvis.fn.prop(props.geoJsonKeyName);

        var groupedInputData = data.reduce(function(m, v) {
          m[getDataKeyName(v)] = v;
          return m;
        });

        var mergedData = props.geoJson.features.map(function(feature) {
          return {
            geoJson: feature,
            datum: groupedInputData[getMapKeyName(feature.properties)]
          };
        });

        function getMapFill(d) {
          return sszvis.fn.defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
        }

        var buildings = selection.selectAll('.sszvis-map__building')
          .data(mergedData);

        buildings.enter()
          .append('path')
          .classed('sszvis-map__building', true)
          .attr('data-event-target', '')
          .attr('d', function(d) {
            return props.mapPath(d.geoJson);
          })
          .attr('fill', getMapFill);

        buildings.exit().remove();

        selection.selectAll('.sszvis-map__building--undefined')
          .attr('fill', getMapFill);

        buildings
          .classed('sszvis-map__building--undefined', function(d) { return !sszvis.fn.defined(d.datum) || !props.defined(d.datum); });

        if (props.transitionColor) {
          buildings
            .transition()
            .call(sszvis.transition.slowTransition)
            .attr('fill', getMapFill);
        } else {
          buildings.attr('fill', getMapFill);
        }

        buildings
          .attr('stroke', props.stroke)
          .attr('stroke-width', props.strokeWidth);

        selection.selectAll('[data-event-target]')
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
        var tooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(d) {
            d.geoJson.properties || (d.geoJson.properties = {});

            var computedCenter = d.geoJson.properties.computedCenter;
            if (!computedCenter) {
              d.geoJson.properties.computedCenter = computedCenter = props.mapPath.centroid(d.geoJson);
            }

            return computedCenter;
          });

        var tooltipGroup = selection.selectGroup('tooltipAnchors')
          .datum(mergedData);

        // attach tooltip anchors
        tooltipGroup.call(tooltipAnchor);
      });

    d3.rebind(component, event, 'on');

    return component;
  };

});
