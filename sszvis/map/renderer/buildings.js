sszvis_namespace('sszvis.map.renderer.buildings', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('dataKeyName').dataKeyName('geoId')
      .prop('geoJsonKeyName').geoJsonKeyName('id')
      .prop('geoJson')
      .prop('mapPath')
      .prop('defined', d3.functor).defined(true)
      .prop('fill', d3.functor).fill('black')
      .prop('stroke').stroke('black')
      .prop('strokeThickness').strokeThickness(1.25)
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
          .attr('stroke-width', props.strokeThickness);
      });
  };

});
