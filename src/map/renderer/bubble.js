/**
 * @module sszvis/map/anchoredCircles
 *
 * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
 * You will usually want to pass this component, configured, as the .anchoredShape property of a base
 * map component.
 *
 * @property {Object} mergedData                    Used internally by the base map component which renders this. Is a merged dataset used to render the shapes
 * @property {Function} mapPath                     Used internally by the base map component which renders this. Is a path generation function which provides projections.
 * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
 * @property {Color, Function} fill                 The fill color of the circles. Can be a function
 * @property {Color, Function} strokeColor          The stroke color of the circles. Can be a function
 * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data changes. Default true
 *
 * @return {sszvis.component}
 */

import { select, dispatch } from "d3";

import * as fn from "../../fn.js";
import { defaultTransition } from "../../transition.js";
import { getGeoJsonCenter } from "../mapUtils.js";
import translateString from "../../svgUtils/translateString.js";
import { component } from "../../d3-component.js";

const datumAcc = fn.prop("datum");

export default function () {
  const event = dispatch("over", "out", "click");

  const anchoredCirclesComponent = component()
    .prop("mergedData")
    .prop("mapPath")
    .prop("radius", fn.functor)
    .prop("fill", fn.functor)
    .prop("strokeColor", fn.functor)
    .strokeColor("#ffffff")
    .prop("strokeWidth", fn.functor)
    .strokeWidth(1)
    .prop("transition")
    .transition(true)
    .render(function () {
      const selection = select(this);
      const props = selection.props();

      const radiusAcc = fn.compose(props.radius, datumAcc);

      const anchoredCircles = selection
        .selectGroup("anchoredCircles")
        .selectAll(".sszvis-anchored-circle")
        .data(props.mergedData, (d) => d.geoJson.id)
        .join("circle")
        .attr("class", "sszvis-anchored-circle sszvis-anchored-circle--entering")
        .attr("r", radiusAcc)
        .on("mouseover", function (d) {
          event.call("over", this, d.datum);
        })
        .on("mouseout", function (d) {
          event.call("out", this, d.datum);
        })
        .on("click", function (d) {
          event.call("click", this, d.datum);
        })
        .attr("transform", (d) => {
          const position = props.mapPath.projection()(getGeoJsonCenter(d.geoJson));
          return translateString(position[0], position[1]);
        })
        .style("fill", (d) => props.fill(d.datum))
        .style("stroke", (d) => props.strokeColor(d.datum))
        .style("stroke-width", (d) => props.strokeWidth(d.datum))
        .sort((a, b) => props.radius(b.datum) - props.radius(a.datum));

      // Remove the --entering modifier from the updating circles
      anchoredCircles.classed("sszvis-anchored-circle--entering", false);

      if (props.transition) {
        const t = defaultTransition();
        anchoredCircles.exit().transition(t).attr("r", 0).remove();

        anchoredCircles.transition(t).attr("r", radiusAcc);
      } else {
        anchoredCircles.exit().remove();
        anchoredCircles.attr("r", radiusAcc);
      }
    });

  anchoredCirclesComponent.on = function () {
    const value = event.on.apply(event, arguments);
    return value === event ? anchoredCirclesComponent : value;
  };

  return anchoredCirclesComponent;
}
