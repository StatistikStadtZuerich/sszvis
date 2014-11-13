namespace('sszvis.behavior.voronoi', function(module) {
'use strict';

  module.exports = function() {
    var event = d3.dispatch('over', 'out');

    var voronoiComponent = d3.component()
      .prop('x')
      .prop('y')
      .prop('bounds')
      .prop('debug')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.bounds) {
          sszvis.logger.error('behavior.voronoi - requires bounds');
          return false;
        }

        var voronoi = d3.geom.voronoi()
          .x(props.x)
          .y(props.y)
          .clipExtent(props.bounds);

        var polys = selection.selectAll('[data-sszvis-behavior-voronoi]')
          .data(voronoi(data));

        polys.enter()
          .append('path')
          .attr('data-sszvis-behavior-voronoi', '');

        polys.exit().remove();

        polys
          .attr('d', function(d) { return 'M' + d.join('L') + 'Z'; })
          .attr('fill', 'transparent')
          .on('mouseover', function(d, i) {
            event.over.apply(this, [d.point, i]);
          })
          .on('mouseout', function(d, i) {
            event.out.apply(this, [d.point, i]);
          })
          .on('touchdown', function(d, i) {
            event.over.apply(this, [d.point, i]);
          })
          .on('touchend', function(d, i) {
            event.out.apply(this, [d.point, i]);

            // calling preventDefault here prevents the browser from sending imitation mouse events
            d3.event.preventDefault();
          });

          if (props.debug) {
            polys.attr('stroke', '#f00');
          }
      });

    d3.rebind(voronoiComponent, event, 'on');

    return voronoiComponent;
  };

});
