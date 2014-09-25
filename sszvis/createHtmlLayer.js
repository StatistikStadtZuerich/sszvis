namespace('sszvis.createHtmlLayer', function(module) {

  module.exports = function(selector, bounds) {
    var root = d3.select(selector);
    var layer = root.selectAll('div').data([0]);
    layer.enter().append('div');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  }

});
