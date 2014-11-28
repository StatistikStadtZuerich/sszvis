namespace('sszvis.map.lakeRenderer', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('mapPath')
      .prop('lakeFeature')
      .prop('lakeBounds')
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        // the lake texture
        sszvis.svgUtils.ensureDefsElement(selection, 'pattern', 'lake-pattern')
          .call(sszvis.patterns.mapLakePattern);

        // the fade gradient
        sszvis.svgUtils.ensureDefsElement(selection, 'linearGradient', 'lake-fade-gradient')
          .call(sszvis.patterns.mapLakeFadeGradient);

        // the mask, which uses the fade gradient
        sszvis.svgUtils.ensureDefsElement(selection, 'mask', 'lake-fade-mask')
          .call(sszvis.patterns.mapLakeGradientMask);

        // generate the lake zurich path
        var zurichSee = selection.selectAll('.sszvis-map__lakezurich')
          .data([props.lakeFeature]);

        zurichSee.enter()
          .append('path')
          .classed('sszvis-map__lakezurich', true);

        zurichSee.exit().remove();

        zurichSee
          .attr('d', props.mapPath)
          .attr('fill', 'url(#lake-pattern)')
          // this mask applies the fade effect
          .attr('mask', 'url(#lake-fade-mask)');

        // add a path for the boundaries of map entities which extend over the lake.
        // This path is rendered as a dotted line over the lake shape
        var lakePath = selection.selectAll('.sszvis-map__lakepath')
          .data([props.lakeBounds]);

        lakePath.enter()
          .append('path')
          .classed('sszvis-map__lakepath', true);

        lakePath.exit().remove();

        lakePath
          .attr('d', props.mapPath);
      });
  };

});
