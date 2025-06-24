import { select } from 'd3';
import { functor } from '../../fn.js';
import { GEO_KEY_DEFAULT } from '../mapUtils.js';
import { component } from '../../d3-component.js';

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
 * @return {sszvis.component}
 */

function mapRendererHighlight () {
  return component().prop("keyName").keyName(GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
  .prop("geoJson").prop("mapPath").prop("highlight").highlight([]) // an array of data values to highlight
  .prop("highlightStroke", functor).highlightStroke("white") // a function for highlighted entity stroke colors (default: white)
  .prop("highlightStrokeWidth", functor).highlightStrokeWidth(2).render(function () {
    const selection = select(this);
    const props = selection.props();
    const highlightBorders = selection.selectAll(".sszvis-map__highlight");
    if (props.highlight.length === 0) {
      highlightBorders.remove();
      return true; // no highlight, no worry
    }
    const groupedMapData = props.geoJson.features.reduce((m, feature) => {
      m[feature.id] = feature;
      return m;
    }, {});

    // merge the highlight data
    const mergedHighlight = props.highlight.reduce((m, v) => {
      if (v) {
        m.push({
          geoJson: groupedMapData[v[props.keyName]],
          datum: v
        });
      }
      return m;
    }, []);
    highlightBorders.data(mergedHighlight).join("path").classed("sszvis-map__highlight", true).attr("d", d => props.mapPath(d.geoJson)).style("stroke", d => props.highlightStroke(d.datum)).style("stroke-width", d => props.highlightStrokeWidth(d.datum));
  });
}

export { mapRendererHighlight as default };
//# sourceMappingURL=highlight.js.map
