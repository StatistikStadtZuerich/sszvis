/**
 * base renderer component
 *
 * @module sszvis/map/renderer/base
 *
 * A component used internally for rendering the base layer of maps.
 * These map entities have a color fill, which is possibly a pattern that represents
 * missing values. They are also event targets. If your map has nothing else, it should have a
 * base layer.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
 *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
 *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {Boolean} transitionColor                Whether or not to transition the fill color of the map entities. (default: true)
 *
 * @return {sszvis.component}
 */

import { select } from "d3";

import * as fn from "../../fn.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { mapMissingValuePattern } from "../../patterns.js";
import { slowTransition } from "../../transition.js";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { getGeoJsonCenter } from "../mapUtils.js";
import { component } from "../../d3-component.js";

export default function () {
  return component()
    .prop("mergedData")
    .prop("geoJson")
    .prop("mapPath")
    .prop("defined", fn.functor)
    .defined(true) // a predicate function to determine whether a datum has a defined value
    .prop("fill", fn.functor)
    .fill(() => "black") // a function for the entity fill color. default is black
    .prop("transitionColor")
    .transitionColor(true)
    .render(function () {
      var selection = select(this);
      var props = selection.props();

      // render the missing value pattern
      ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

      // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
      function getMapFill(d) {
        return props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
      }

      var mapAreas = selection.selectAll(".sszvis-map__area").data(props.mergedData);

      // add the base map paths - these are filled according to the map fill function
      var newMapAreas = mapAreas
        .enter()
        .append("path")
        .classed("sszvis-map__area", true)
        .classed("sszvis-map__area--entering", true)
        .attr("data-event-target", "")
        .attr("fill", getMapFill);

      mapAreas.classed("sszvis-map__area--entering", false);

      mapAreas.exit().remove();

      mapAreas = mapAreas.merge(newMapAreas);

      selection.selectAll(".sszvis-map__area--undefined").attr("fill", getMapFill);

      // change the fill if necessary
      mapAreas
        .classed(
          "sszvis-map__area--undefined",
          (d) => !fn.defined(d.datum) || !props.defined(d.datum)
        )
        .attr("d", (d) => props.mapPath(d.geoJson));

      if (props.transitionColor) {
        mapAreas.transition().call(slowTransition).attr("fill", getMapFill);
      } else {
        mapAreas.attr("fill", getMapFill);
      }

      // the tooltip anchor generator
      var ta = tooltipAnchor().position((d) =>
        props.mapPath.projection()(getGeoJsonCenter(d.geoJson))
      );

      var tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });
}
