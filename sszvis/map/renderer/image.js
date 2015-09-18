sszvis_namespace('sszvis.map.renderer.image', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('projection')
      .prop('src')
      .prop('geoBounds')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var image = selection.selectAll('.sszvis-map__image')
          .data([0]); // At the moment, 1 image per container

        image.enter()
          .append('img')
          .classed('sszvis-map__image', true);

        image.exit().remove();

        var topLeft = props.projection(props.geoBounds[0]);
        var bottomRight = props.projection(props.geoBounds[1]);

        image
          .attr('src', props.src)
          .style('left', topLeft[0] + 'px')
          .style('top', topLeft[1] + 'px')
          .style('width', (bottomRight[0] - topLeft[0]) + 'px')
          .style('height', (bottomRight[1] - topLeft[1]) + 'px');
      });
  };

});