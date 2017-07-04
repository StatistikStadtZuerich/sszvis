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

import d3 from 'd3';

import * as fn from '../../fn.js';
import transition from '../../transition.js';
import { getGeoJsonCenter } from '../mapUtils.js';
import translateString from '../../svgUtils/translateString.js';
import { component } from '../../d3-component.js';

export default function() {
  var event = d3.dispatch('over', 'out', 'click');

  var component = component()
    .prop('mergedData')
    .prop('mapPath')
    .prop('radius', fn.functor)
    .prop('fill', fn.functor)
    .prop('strokeColor', fn.functor).strokeColor('#ffffff')
    .prop('strokeWidth', fn.functor).strokeWidth(1)
    .prop('transition').transition(true)
    .render(function() {
      var selection = d3.select(this);
      var props = selection.props();

      var anchoredCircles = selection.selectGroup('anchoredCircles')
        .selectAll('.sszvis-anchored-circle')
        .data(props.mergedData, function(d) { return d.geoJson.id; });

      var newAnchoredCircles = anchoredCircles.enter()
        .append('circle')
        .attr('class', 'sszvis-anchored-circle');

      anchoredCircles = anchoredCircles.merge(newAnchoredCircles);

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
          event.apply('over', this, [d.datum]);
        })
        .on('mouseout', function(d) {
          event.apply('out', this, [d.datum]);
        })
        .on('click', function(d) {
          event.apply('click', this, [d.datum]);
        });

      if (props.transition) {
        anchoredCircles = anchoredCircles.transition()
          .call(transition);
      }

      anchoredCircles.attr('r', function(d) { return props.radius(d.datum); });
    });

  component.on = function() {
    var value = event.on.apply(event, arguments);
    return value === event ? component : value;
  };

  return component;
};
