/**
 * mesh renderer component
 *
 * @module sszvis/map/renderer/mesh
 *
 * A component used internally for rendering the borders of all map entities as a single mesh.
 * This component expects a GeoJson object which is a single polyline for the entire mesh of all borders.
 * All borders will therefore be rendered as one continuous object, which is faster, more memory-efficient,
 * and prevents overlapping borders from creating strange rendering effects. The downside is that the entire
 * line must have a single set of styles which all borders share. To highlight individual borders, use the highlight renderer.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 * @property {string, function} borderColor           The color of the border path stroke. Default is white
 *
 * @return {d3.component}
 */

import d3 from 'd3';

export default function() {
  return d3.component()
    .prop('geoJson')
    .prop('mapPath')
    .prop('borderColor').borderColor('white') // A function or string for the color of all borders. Note: all borders have the same color
    .prop('strokeWidth').strokeWidth(1.25)
    .render(function() {
      var selection = d3.select(this);
      var props = selection.props();

      // add the map borders. These are rendered as one single path element
      var meshLine = selection
        .selectAll('.sszvis-map__border')
        .data([props.geoJson]);

      meshLine.enter()
        .append('path')
        .classed('sszvis-map__border', true);

      meshLine.exit().remove();

      meshLine
        .attr('d', props.mapPath)
        .style('stroke', props.borderColor)
        .style('stroke-width', props.strokeWidth);
    });
};
