namespace('sszvis.map.highlightRenderer', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('keyName').keyName('geoId') // the name of the data key that identifies which map entity it belongs to
      .prop('geoJson')
      .prop('mapPath')
      .prop('defined', d3.functor).defined(true) // a predicate function to determine whether a datum has a defined value
      .prop('highlight').highlight([]) // an array of data values to highlight
      .prop('highlightStroke', d3.functor) // a function for highlighted entity stroke colors
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var highlightBorders = selection
          .selectAll('.sszvis-map__highlight');

        if (!props.highlight.length) {
          highlightBorders.remove();
          return true; // no highlight, no worry
        }

        var groupedMapData = props.geoJson.features.reduce(function(m, feature) {
          m[feature.id] = feature;
          return m;
        }, {});

        // merge the highlight data
        var mergedHighlight = props.highlight.reduce(function(m, v) {
          if (v) {
            m.push({
              geoJson: groupedMapData[v[props.keyName]],
              datum: v
            });
          }
          return m;
        }, []);

        highlightBorders = highlightBorders.data(mergedHighlight);

        highlightBorders.enter()
          .append('path')
          .classed('sszvis-map__highlight', true);

        highlightBorders.exit().remove();

        highlightBorders
          .attr('d', function(d) {
            return props.mapPath(d.geoJson);
          })
          .attr('stroke', function(d) {
            return props.defined(d.datum) ? props.highlightStroke(d.datum) : 'white';
          });
      });
  };

});
