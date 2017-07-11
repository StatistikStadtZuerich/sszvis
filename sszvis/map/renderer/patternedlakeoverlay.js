/**
 * patternedlakeoverlay component
 *
 * @module sszvis/map/renderer/patternedlakeoverlay
 *
 * A component used internally for rendering Lake Zurich, and the borders of map entities which
 * lie above Lake Zurich.
 *
 * @property {d3.geo.path} mapPath      A path-generator function used to create the path data string of the provided GeoJson.
 * @property {GeoJson} lakeFeature      A GeoJson object which provides data for the outline shape of Lake Zurich. This shape will
 *                                      be filled with a special texture fill and masked with an alpha gradient fade.
 * @property {GeoJson} lakeBounds       A GeoJson object which provides data for the shape of map entity borders which lie over the
 *                                      lake. These borders will be drawn over the lake shape, as grey dotted lines.
 *
 * @return {sszvis.component}
 */

import {select} from 'd3';

import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { mapLakePattern, mapLakeFadeGradient, mapLakeGradientMask } from '../../patterns.js';
import { component } from '../../d3-component.js';

export default function() {
  return component()
    .prop('mapPath')
    .prop('lakeFeature')
    .prop('lakeBounds')
    .prop('lakePathColor')
    .prop('fadeOut').fadeOut(true)
    .render(function() {
      var selection = select(this);
      var props = selection.props();

      // the lake texture
      ensureDefsElement(selection, 'pattern', 'lake-pattern')
        .call(mapLakePattern);

      if (props.fadeOut) {
        // the fade gradient
        ensureDefsElement(selection, 'linearGradient', 'lake-fade-gradient')
          .call(mapLakeFadeGradient);

        // the mask, which uses the fade gradient
        ensureDefsElement(selection, 'mask', 'lake-fade-mask')
          .call(mapLakeGradientMask);
      }

      // generate the Lake Zurich path
      var zurichSee = selection.selectAll('.sszvis-map__lakezurich')
        .data([props.lakeFeature]);

      var newZurichSee = zurichSee.enter()
        .append('path')
        .classed('sszvis-map__lakezurich', true);

      zurichSee.exit().remove();

      zurichSee = zurichSee.merge(newZurichSee);

      zurichSee
        .attr('d', props.mapPath)
        .attr('fill', 'url(#lake-pattern)')

      if (props.fadeOut) {
        // this mask applies the fade effect
        zurichSee.attr('mask', 'url(#lake-fade-mask)');
      }

      // add a path for the boundaries of map entities which extend over the lake.
      // This path is rendered as a dotted line over the lake shape
      var lakePath = selection.selectAll('.sszvis-map__lakepath')
        .data([props.lakeBounds]);

      var newLakePath = lakePath.enter()
        .append('path')
        .classed('sszvis-map__lakepath', true);

      lakePath.exit().remove();

      lakePath = lakePath.merge(newLakePath);

      lakePath
        .attr('d', props.mapPath);

      if (props.lakePathColor) {
        lakePath.style('stroke', props.lakePathColor);
      }
    });
};
