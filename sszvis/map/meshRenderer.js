namespace('sszvis.map.meshRenderer', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('geoJson')
      .prop('mapPath')
      .prop('borderColor').borderColor('white') // A function or string for the color of all borders. Note: all borders have the same color
      .render(function(data) {
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
          .attr('stroke', props.borderColor);
      });
  };

});
