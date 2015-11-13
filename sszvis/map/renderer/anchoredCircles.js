sszvis_namespace('sszvis.map.anchoredCircles', function(module) {

  module.exports = function() {
    var event = d3.dispatch('over', 'out', 'click');

    var component = d3.component()
      .prop('mergedData')
      .prop('mapPath')
      .prop('radius', d3.functor)
      .prop('fill', d3.functor)
      .prop('strokeColor', d3.functor).strokeColor('#ffffff')
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
            var position = props.mapPath.projection()(sszvis.map.utils.getGeoJsonCenter(d.geoJson));
            return sszvis.svgUtils.translateString(position[0], position[1]);
          })
          .attr('r', function(d) { return props.radius(d.datum); })
          .attr('fill', function(d) { return props.fill(d.datum); })
          .attr('stroke', function(d) { return props.strokeColor(d.datum); })
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
      });

    d3.rebind(component, event, 'on');

    return component;
  };

});
