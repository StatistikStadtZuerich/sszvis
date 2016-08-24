/**
 * Behavior utilities
 *
 * These utilities are intended for internal usage by the sszvis.behavior components.
 * They aren't intended for use in example code, but should be in a separate module
 * because they are accessed by several different behavior components.
 *
 * @function {Event} elementFromEvent             Accepts an event, and returns the element, if any,
 *                                                which is in the document under that event. Uses
 *                                                document.elementFromPoint to determine the element.
 *                                                If there is no such element, or the event is invalid,
 *                                                this function will return null.
 * @function {Element} datumFromPannableElement   Accepts an element, determines if it's "pannable",
 *                                                and returns the datum, if any, attached to this element.
 *                                                This is determined by the presence of the data-sszvis-behavior-pannable
 *                                                attribute on the element. Behaviors which use "panning" behavior
 *                                                will attach this attribute to the elements they target.
 *                                                Elements which have panning behaviors attached to them
 *                                                will get this attribute assigned to them. If the element doesn't
 *                                                have this attriute, or doesn't have a datum assigned, this funciton
 *                                                returns null.
 * @function {Event} datumFromPanEvent            A combination of elementFromEvent and datumFromPannableElement, which
 *                                                accepts an event and returns the datum attached to the element under
 *                                                that event, if such an element and such a datum exists.
 */
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
