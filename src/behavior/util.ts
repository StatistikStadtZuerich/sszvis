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
 * @function {Number, Object, Function, Number} testBarThreshold        This function is a convenience function for encapsulating
 *                                                                      the test which should be performed on a touch interaction,
 *                                                                      to see whether the touch falls within the "profile" of a bar
 *                                                                      chart. If so, that is, if the test passes, then scrolling should
 *                                                                      be prevented on the bar charts, and a tooltip should be shown.
 *                                                                      This is the behavior known as "panning" over the surface of the chart,
 *                                                                      while on a mobile device. The function returns true if the touch is
 *                                                                      considered to be within the "profile" of the bar chart, and false otherwise.
 *                                                                      The function takes four arguments:
 *                                                                        cursorValue - This the value, specified in the same units as the original
 *                                                                                      data, at the touch event's position. This value is
 *                                                                                      automatically calculated by the 'move' behavior,
 *                                                                                      by inverting the scale used for the bar charts' extent.
 *                                                                        datum -       This is the data value at the touch event's position,
 *                                                                                      against which you are comparing the profile. Since data
 *                                                                                      values all live in user-land, you should retrieve this
 *                                                                                      datum yourself. Usually this can be done by using the
 *                                                                                      inverted value from the other axis of the bar chart,
 *                                                                                      and searching the data for the datum which matches that
 *                                                                                      value. However, note that the datum argument can be
 *                                                                                      undefined, in which case the touch is considered invalid and
 *                                                                                      the test will return false.
 *                                                                        accessor -    This is an accessor function for retrieving a numeric value
 *                                                                                      from the datum. This function should be used to retrieve out
 *                                                                                      of the datum the value against which cursorValue is compared.
 *                                                                        threshold -   A small threshold, specified in datum units, i.e. in the units
 *                                                                                      of the domain (NOT the range) of the scale function. When a bar
 *                                                                                      value is very small, or 0, or NaN, it would be impossible to have
 *                                                                                      a touch which is over the "profile" of this bar. So in those cases,
 *                                                                                      we consider the touch to be within the profile if it and the data
 *                                                                                      value are under this threshold. This number should be some small
 *                                                                                      number in the data's domain, and will be compared against both
 *                                                                                      cursorValue and the value accessed from the datum.
 */

import { select } from "d3";

import * as fn from "../fn";

// Type definitions for behavior utility functions
interface EventWithCoordinates {
  clientX: number;
  clientY: number;
}

interface DatumContainer<T = unknown> {
  data: T;
}

type AccessorFunction<T, R> = (datum: T) => R;

export const elementFromEvent = function (evt: EventWithCoordinates | null): Element | null {
  if (!fn.isNull(evt) && fn.defined(evt)) {
    return document.elementFromPoint(evt.clientX, evt.clientY);
  }
  return null;
};

export const datumFromPannableElement = function <T = unknown>(
  element: Element | null
): DatumContainer<T> | null {
  if (!fn.isNull(element)) {
    const selection = select(element as Element);
    if (!fn.isNull(selection.attr("data-sszvis-behavior-pannable"))) {
      const datum = selection.datum() as DatumContainer<T> | undefined;
      if (fn.defined(datum)) {
        return datum;
      }
    }
  }
  return null;
};

export const datumFromPanEvent = function <T = unknown>(
  panEvent: Touch | null
): DatumContainer<T> | null {
  const element = elementFromEvent(panEvent);
  return datumFromPannableElement<T>(element);
};

export const testBarThreshold = function <T>(
  cursorValue: number,
  datum: T,
  accessor: AccessorFunction<T, number>,
  threshold: number
): boolean {
  if (!fn.defined(datum)) {
    return false;
  }
  const dataValue = accessor(datum);
  // For bars that are very small, or have a NaN value, then
  // when the touch is close enough to the 0-axis, we prevent scrolling
  // and show the tooltip. The proximity which the touch must have to the 0-axis
  // is determined by threshold, which must be a value in the axis' domain (NOT range).
  return (
    (cursorValue < threshold && Number.isNaN(dataValue)) ||
    (cursorValue < threshold && dataValue < threshold) ||
    cursorValue < dataValue
  );
};
