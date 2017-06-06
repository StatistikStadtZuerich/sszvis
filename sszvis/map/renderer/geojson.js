/**
 * geojson renderer component
 *
 * @module sszvis/map/renderer/geojson
 *
 * A component used for rendering overlays of geojson above map layers.
 * It can be used to render any arbitrary GeoJson.
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
 * @property {Boolean} transitionColor      Whether or not to transition the fill color of the geojson when it changes. Default true.
 *
 * @return {d3.component}
 */

import d3 from 'd3';

import * as fn from '../../fn.js';
import tooltipAnchor from '../../annotation/tooltipAnchor.js';
import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { mapMissingValuePattern } from '../../patterns.js';
import { slowTransition } from '../../transition.js';
import { GEO_KEY_DEFAULT } from '../mapUtils.js';

export default function() {
  var event = d3.dispatch('over', 'out', 'click');

  var component = d3.component()
    .prop('dataKeyName').dataKeyName(GEO_KEY_DEFAULT)
    .prop('geoJsonKeyName').geoJsonKeyName('id')
    .prop('geoJson')
    .prop('mapPath')
    .prop('defined', fn.functor).defined(true)
    .prop('fill', fn.functor).fill('black')
    .prop('stroke', fn.functor).stroke('black')
    .prop('strokeWidth', fn.functor).strokeWidth(1.25)
    .prop('transitionColor').transitionColor(true)
    .render(function(data) {
      var selection = d3.select(this);
      var props = selection.props();

      // render the missing value pattern
      ensureDefsElement(selection, 'pattern', 'missing-pattern')
        .call(mapMissingValuePattern);

      // getDataKeyName will be called on data values. It should return a map entity id.
      // getMapKeyName will be called on the 'properties' of each map feature. It should
      // return a map entity id. Data values are matched with corresponding map features using
      // these entity ids.
      var getDataKeyName = fn.prop(props.dataKeyName);
      var getMapKeyName = fn.prop(props.geoJsonKeyName);

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
        return fn.defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
      }

      function getMapStroke(d) {
        return fn.defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : '';
      }

      var geoElements = selection.selectAll('.sszvis-map__geojsonelement')
        .data(mergedData);

      var newGeoElements = geoElements.enter()
        .append('path')
        .classed('sszvis-map__geojsonelement', true)
        .attr('data-event-target', '')
        .attr('fill', getMapFill);

      geoElements.exit().remove();

      geoElements = geoElements.merge(newGeoElements);

      selection.selectAll('.sszvis-map__geojsonelement--undefined')
        .attr('fill', getMapFill);

      geoElements
        .classed('sszvis-map__geojsonelement--undefined', function(d) { return !fn.defined(d.datum) || !props.defined(d.datum); })
        .attr('d', function(d) { return props.mapPath(d.geoJson); });

      if (props.transitionColor) {
        geoElements
          .transition()
          .call(slowTransition)
          .attr('fill', getMapFill);
      } else {
        geoElements.attr('fill', getMapFill);
      }

      geoElements
        .attr('stroke', getMapStroke)
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
      var ta = tooltipAnchor()
        .position(function(d) {
          d.geoJson.properties || (d.geoJson.properties = {});

          var sphericalCentroid = d.geoJson.properties.sphericalCentroid;
          if (!sphericalCentroid) {
            d.geoJson.properties.sphericalCentroid = sphericalCentroid = d3.geoCentroid(d.geoJson);
          }

          return props.mapPath.projection()(sphericalCentroid);
        });

      var tooltipGroup = selection.selectGroup('tooltipAnchors')
        .datum(mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });

  component.on = function() {
    var value = event.on.apply(event, arguments);
    return value === event ? component : value;
  };

  return component;
};
