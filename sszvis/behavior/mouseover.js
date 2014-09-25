namespace('sszvis.behavior.mouseover', function(module) {

  module.exports = function() {
    var fn = sszvis.fn;

    var overFunc = fn.identity;
    var outFunc = fn.identity;

    function addMouseOver(selection) {
      selection
        .on('mouseover', overFunc)
        .on('mouseout', outFunc);
    }

    addMouseOver.mouseover = function(func) {
      overFunc = func;
      return this;
    }

    addMouseOver.mouseout = function(func) {
      outFunc = func;
      return this;
    }

    return addMouseOver;
  }

});
