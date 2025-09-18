import { dispatch, select, geoCentroid } from 'd3';
import tooltipAnchor from '../../annotation/tooltipAnchor.js';
import { component } from '../../d3-component.js';
import { functor, prop, defined } from '../../fn.js';
import { mapMissingValuePattern } from '../../patterns.js';
import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { slowTransition } from '../../transition.js';
import { GEO_KEY_DEFAULT } from '../mapUtils.js';

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
 * @return {sszvis.component}
 */

function geojson () {
  const event = dispatch("over", "out", "click");
  const geojsonComponent = component().prop("dataKeyName").dataKeyName(GEO_KEY_DEFAULT).prop("geoJsonKeyName").geoJsonKeyName("id").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true).prop("fill", functor).fill("black").prop("stroke", functor).stroke("black").prop("strokeWidth", functor).strokeWidth(1.25).prop("transitionColor").transitionColor(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();

    // render the missing value pattern
    ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

    // getDataKeyName will be called on data values. It should return a map entity id.
    // getMapKeyName will be called on the 'properties' of each map feature. It should
    // return a map entity id. Data values are matched with corresponding map features using
    // these entity ids.
    const getDataKeyName = prop(props.dataKeyName);
    const getMapKeyName = prop(props.geoJsonKeyName);
    const groupedInputData = data.reduce((m, v) => {
      m[getDataKeyName(v)] = v;
      return m;
    });
    const mergedData = props.geoJson.features.map(feature => ({
      geoJson: feature,
      datum: groupedInputData[getMapKeyName(feature.properties)]
    }));
    function getMapFill(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
    }
    function getMapStroke(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
    }
    const geoElements = selection.selectAll(".sszvis-map__geojsonelement").data(mergedData).join("path").classed("sszvis-map__geojsonelement", true).attr("data-event-target", "").attr("fill", getMapFill);
    selection.selectAll(".sszvis-map__geojsonelement--undefined").attr("fill", getMapFill);
    geoElements.classed("sszvis-map__geojsonelement--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
    if (props.transitionColor) {
      geoElements.transition().call(slowTransition).attr("fill", getMapFill);
    } else {
      geoElements.attr("fill", getMapFill);
    }
    geoElements.attr("stroke", getMapStroke).attr("stroke-width", props.strokeWidth);
    selection.selectAll("[data-event-target]").on("mouseover", d => {
      event.over(d.datum);
    }).on("mouseout", d => {
      event.out(d.datum);
    }).on("click", d => {
      event.click(d.datum);
    });

    // the tooltip anchor generator
    const ta = tooltipAnchor().position(d => {
      d.geoJson.properties || (d.geoJson.properties = {});
      let sphericalCentroid = d.geoJson.properties.sphericalCentroid;
      if (!sphericalCentroid) {
        d.geoJson.properties.sphericalCentroid = sphericalCentroid = geoCentroid(d.geoJson);
      }
      return props.mapPath.projection()(sphericalCentroid);
    });
    const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(mergedData);

    // attach tooltip anchors
    tooltipGroup.call(ta);
  });
  geojsonComponent.on = () => {
    const value = event.on.apply(event, arguments);
    return value === event ? geojsonComponent : value;
  };
  return geojsonComponent;
}

export { geojson as default };
//# sourceMappingURL=geojson.js.map
