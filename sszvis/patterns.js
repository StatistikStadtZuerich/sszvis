/**
 * @module sszvis/patterns
 *
 */
namespace('sszvis.patterns', function(module) {

  module.exports.ensureDefs = function(selection) {
    var defs = selection.selectAll('defs')
      .data([0]);

    defs.enter()
      .append('defs');

    return defs;
  };

  module.exports.ensurePattern = function(selection, patternId) {
    var pattern = sszvis.patterns.ensureDefs(selection)
      .selectAll('pattern#' + patternId)
      .data([0])
      .enter()
      .append('pattern')
      .attr('id', patternId);

    return pattern;
  };

  module.exports.heatTableMissingValuePattern = function(selection) {
    var rectFill = '#FAFAFA',
        crossStroke = '#A4A4A4',
        crossStrokeWidth = 0.035,
        cross1 = 0.35,
        cross2 = 0.65;

    selection
      .attr('patternUnits', 'objectBoundingBox')
      .attr('patternContentUnits', 'objectBoundingBox')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1)
      .attr('fill', rectFill);

    selection
      .append('line')
      .attr('x1', cross1).attr('y1', cross1)
      .attr('x2', cross2).attr('y2', cross2)
      .attr('stroke-width', crossStrokeWidth)
      .attr('stroke', crossStroke);

    selection
      .append('line')
      .attr('x1', cross2).attr('y1', cross1)
      .attr('x2', cross1).attr('y2', cross2)
      .attr('stroke-width', crossStrokeWidth)
      .attr('stroke', crossStroke);
  };

  module.exports.mapMissingValuePattern = function(selection) {
    var pWidth = 14,
        pHeight = 14,
        fillColor = '#FAFAFA',
        lineStroke = '#CCCCCC';

    selection
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
      .attr('fill', fillColor);

    selection
      .append('line')
      .attr('x1', 1).attr('y1', 10)
      .attr('x2', 5).attr('y2', 14)
      .attr('stroke', lineStroke);

    selection
      .append('line')
      .attr('x1', 5).attr('y1', 10)
      .attr('x2', 1).attr('y2', 14)
      .attr('stroke', lineStroke);

    selection
      .append('line')
      .attr('x1', 8).attr('y1', 3)
      .attr('x2', 12).attr('y2', 7)
      .attr('stroke', lineStroke);

    selection
      .append('line')
      .attr('x1', 12).attr('y1', 3)
      .attr('x2', 8).attr('y2', 7)
      .attr('stroke', lineStroke);
  };

  module.exports.mapLakePattern = function(selection) {
    var pWidth = 6;
    var pHeight = 6;
    var offset = 0.5;

    selection
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
      .attr('x1', 0)
      .attr('y1', pHeight * offset)
      .attr('x2', pWidth * offset)
      .attr('y2', 0)
      .attr('stroke', '#d0d0d0')
      .attr('stroke-linecap', 'square');

    selection
      .append('line')
      .attr('x1', pWidth * offset)
      .attr('y1', pHeight)
      .attr('x2', pWidth)
      .attr('y2', pHeight * offset)
      .attr('stroke', '#d0d0d0')
      .attr('stroke-linecap', 'square');
  };

  module.exports.dataAreaPattern = function(selection) {
    var pWidth = 6;
    var pHeight = 6;
    var offset = 0.5;

    selection
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('line')
      .attr('x1', 0)
      .attr('y1', pHeight * offset)
      .attr('x2', pWidth * offset)
      .attr('y2', 0)
      .attr('stroke', '#d0d0d0');

    selection
      .append('line')
      .attr('x1', pWidth * offset)
      .attr('y1', pHeight)
      .attr('x2', pWidth)
      .attr('y2', pHeight * offset)
      .attr('stroke', '#d0d0d0');
  };

});
