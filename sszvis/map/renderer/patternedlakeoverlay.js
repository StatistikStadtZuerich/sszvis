/**
 * patternedlakeoverlay component
 *
 * A component used internally for rendering Lake Zurich, and the borders of map entities which
 * lie above Lake Zurich.
 *
 * @property {d3.geo.path} mapPath      A path-generator function used to create the path data string of the provided GeoJson.
 * @property {GeoJson} lakeFeature      A GeoJson object which provides data for the outline shape of Lake Zurich. This shape will
 *                                      be filled with a special texture fill and masked with an alpha gradient fade.
 * @property {GeoJson} lakeBounds       A GeoJson object which provides data for the shape of map entity borders which lie over the
 *                                      lake. These borders will be drawn over the lake shape, as grey dotted lines.
 *
 * @return {d3.component}
 */
namespace('sszvis.map.renderer.patternedlakeoverlay', function(module) {

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

        // generate the Lake Zurich path
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
