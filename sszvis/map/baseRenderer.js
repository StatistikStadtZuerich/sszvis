namespace('sszvis.map.baseRenderer', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('keyName').keyName('geoId') // the name of the data key that identifies which map entity it belongs to
      .prop('geoJson')
      .prop('mapPath')
      .prop('defined', d3.functor).defined(true) // a predicate function to determine whether a datum has a defined value
      .prop('fill').fill(function() { return 'black'; }) // a function for the entity fill color. default is black
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // render the missing value pattern
        sszvis.svgUtils.ensureDefsElement(selection, 'pattern', 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        // group the input data by map entity id
        var groupedInputData = data.reduce(function(m, v) {
          m[v[props.keyName]] = v;
          return m;
        }, {});

        // merge the map features and the input data into new objects that include both
        var mergedData = props.geoJson.features.map(function(feature) {
          return {
            geoJson: feature,
            datum: groupedInputData[feature.id]
          };
        });

        // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
        function getMapFill(d) {
          return sszvis.fn.defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : 'url(#missing-pattern)';
        }

        var mapAreas = selection.selectAll('.sszvis-map__area')
          .data(mergedData);

        // add the base map paths - these are filled according to the map fill function
        mapAreas.enter()
          .append('path')
          .classed('sszvis-map__area', true)
          .attr('data-event-target', '')
          .attr('d', function(d) {
            return props.mapPath(d.geoJson);
          })
          .attr('fill', getMapFill);

        mapAreas.exit().remove();

        selection.selectAll('.sszvis-map__area--undefined')
          .attr('fill', getMapFill);

        // change the fill if necessary
        mapAreas
          .classed('sszvis-map__area--undefined', function(d) { return !props.defined(d.datum); })
          .transition()
          .call(sszvis.transition)
          .attr('fill', getMapFill);

        // the tooltip anchor generator
        var tooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(d) {
            var computedCenter = d.geoJson.properties.computedCenter;
            var center = d.geoJson.properties.center;
            if (computedCenter) {
              return computedCenter;
            } else if (center) {
              // properties.center should be a string of the form "longitude,latitude"
              var parsed = center.split(',').map(parseFloat);
              return d.geoJson.properties.computedCenter = props.mapPath.projection()(parsed);
            } else {
              return d.geoJson.properties.computedCenter = props.mapPath.centroid(d.geoJson);
            }
          });

        var tooltipGroup = selection.selectGroup('tooltipAnchors')
          .datum(mergedData);

        // attach tooltip anchors
        tooltipGroup.call(tooltipAnchor);
      });
  };

});
