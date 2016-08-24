sszvis_namespace('sszvis.behavior.util', function(module) {

  module.exports.elementFromEvent = function(evt) {
    if (!sszvis.fn.isNull(evt) && sszvis.fn.defined(evt)) {
      return document.elementFromPoint(evt.clientX, evt.clientY);
    }
    return null;
  };

  module.exports.datumFromPannableElement = function(element) {
    if (!sszvis.fn.isNull(element)) {
      var selection = d3.select(element);
      if (!sszvis.fn.isNull(selection.attr('data-sszvis-behavior-pannable'))) {
        var datum = selection.datum();
        if (sszvis.fn.defined(datum)) {
          return datum;
        }
      }
    }
    return null;
  };

  module.exports.datumFromPanEvent = function(evt) {
    return module.exports.datumFromPannableElement(module.exports.elementFromEvent(evt));
  };

});
