/**
 * @module sszvis/patterns
 *
 */
namespace('sszvis.patterns', function(module) {

  module.exports.mapMissingValuePattern = function(selection) {
    var pWidth = 4;
    var pHeight = 4;

    selection
      .attr('id', 'missing-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#bfbfbf');

    selection
      .append('line')
      .attr('x1', pWidth)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', pHeight)
      .attr('stroke', '#737373');
  };

  module.exports.mapLakePattern = function(selection) {
    var pWidth = 6;
    var pHeight = 6;

    selection
      .attr('id', 'lake-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#fff');

    selection
      .append('line')
      .attr('x1', pWidth)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', pHeight)
      .attr('stroke', '#d0d0d0');
  };

});