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
 * @return {d3.component}
 */

import transition from '../../transition.js';
import { getGeoJsonCenter } from '../mapUtils.js';
import translateString from '../../svgUtils/translateString.js';

export default function() {
  var event = d3.dispatch('over', 'out', 'click');

  var component = d3.component()
    .prop('mergedData')
    .prop('mapPath')
    .prop('radius', d3.functor)
    .prop('fill', d3.functor)
    .prop('strokeColor', d3.functor).strokeColor('#ffffff')
    .prop('strokeWidth', d3.functor).strokeWidth(1)
    .prop('transition').transition(true)
    .render(function() {
      var selection = d3.select(this);
      var props = selection.props();

      var anchoredCircles = selection.selectGroup('anchoredCircles')
        .selectAll('.sszvis-anchored-circle')
        .data(props.mergedData, function(d) { return d.geoJson.id; });

      anchoredCircles.enter()
        .append('circle')
        .attr('class', 'sszvis-anchored-circle');

      anchoredCircles
        .attr('transform', function(d) {
          var position = props.mapPath.projection()(getGeoJsonCenter(d.geoJson));
          return translateString(position[0], position[1]);
        })
        .attr('fill', function(d) { return props.fill(d.datum); })
        .style('stroke', function(d) { return props.strokeColor(d.datum); })
        .style('stroke-width', function(d) { return props.strokeWidth(d.datum); })
        .sort(function(a, b) {
          return props.radius(b.datum) - props.radius(a.datum);
        });

      anchoredCircles
        .on('mouseover', function(d) {
          event.over(d.datum);
        })
        .on('mouseout', function(d) {
          event.out(d.datum);
        })
        .on('click', function(d) {
          event.click(d.datum);
        });

      if (props.transition) {
        anchoredCircles = anchoredCircles.transition()
          .call(transition);
      }

      anchoredCircles.attr('r', function(d) { return props.radius(d.datum); });
    });

  d3.rebind(component, event, 'on');

  return component;
};
