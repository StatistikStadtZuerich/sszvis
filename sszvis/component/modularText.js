/**
 * ModularText component
 *
 * @return {@function} returns a configurable, callable class
 *
 * use like so:
 * modularText()
 *   .lineBreaks(true)
 *   .plain(function(d) { return d.name; })
 *   .plain(function(d) { return d.place; })
 *   .bold(function(d) { return d.value; })
 *   .italic(function(d) { return d.caption; })
 *
 * returns a function which, when called on a datum, produces a text string
 * by calling on the datum, in sequence, the provided functions,
 * with the result of each function formatted in the manner
 * described by the name of the method which was used to add it.
 */
namespace('sszvis.component.modularText', function(module) {

  module.exports = function() {
    var fn = sszvis.fn;

    var textUnits = [],
    hasLineBreaks;

    function makeText(d) {
      var text = "", i = -1, end = textUnits.length, unit;
      while (++i < end) {
        unit = textUnits[i];
        if (i > 0) {
          if (hasLineBreaks) text += "<br />";
          text += " ";
        }
        switch (unit.type) {
          case "bold":
          text += "<strong>" + unit.tFunc(d) + "</strong>"; break;
          case "italic":
          text += "<em>" + unit.tFunc(d) + "</em>"; break;
          case "plain": // intentional drop-through
          default:
          text += "" + unit.tFunc(d); break;
        }
      }
      return text;
    }

    makeText.lineBreaks = function(b) {
      if (!arguments.length) return hasLineBreaks;
      hasLineBreaks = b;
      return makeText;
    };

    ['bold', 'italic', 'plain'].forEach(function(type) {
      makeText[type] = function(tFunc) {
        if (typeof tFunc === "string") tFunc = fn.constant(tFunc);
        textUnits.push({
          type: type,
          tFunc: tFunc
        });
        return makeText;
      };
    });

    return makeText;
  };

});
