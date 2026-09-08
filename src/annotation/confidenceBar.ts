/**
 * Confidence Bar annotation
 *
 * A generic component for creating confidence bars that display confidence intervals or error ranges.
 * The component should be passed an array of data values, each of which will be used to
 * render confidence bars by passing them through the accessor functions. Confidence bars consist of
 * a vertical line connecting the confidence bounds and horizontal caps at the top and bottom.
 *
 * @module sszvis/annotation/confidenceBar
 *
 * @template T The type of the data objects used in the confidence bars
 * @param {number, function} x               The x-position accessor for the confidence bars (currently unused)
 * @param {number, function} y               The y-position accessor for the confidence bars
 * @param {number, function} confidenceLow   Accessor function for the lower confidence bound
 * @param {number, function} confidenceHigh  Accessor function for the upper confidence bound
 * @param {number, function} width           The width of the horizontal confidence cap
 * @param {number} groupSize                 The number of items in each group
 * @param {number} groupWidth                The width allocated for each group
 * @param {number} groupSpace                The spacing between items within a group (default: 0.05)
 * @param {function} groupScale              Scale function for positioning groups horizontally
 *
 * @returns {sszvis.component} An confidence bar annotation component
 */

import { type NumberValue, range, scaleBand, select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";

interface ConfidenceBarProps<T = unknown> {
  x?: (d: T) => NumberValue;
  y?: (d: T) => NumberValue;
  confidenceLow: (d: T) => NumberValue;
  confidenceHigh: (d: T) => NumberValue;
  width: number;
  groupSize: number;
  groupWidth: number;
  groupSpace: number;
  groupScale: (d: T) => number;
}

interface ConfidenceBarComponent<T = unknown> extends ComponentBuilder<ConfidenceBarComponent<T>> {
  x(accessor?: (d: T) => NumberValue): ConfidenceBarComponent<T>;
  y(accessor?: (d: T) => NumberValue): ConfidenceBarComponent<T>;
  confidenceLow(accessor?: (d: T) => NumberValue): ConfidenceBarComponent<T>;
  confidenceHigh(accessor?: (d: T) => NumberValue): ConfidenceBarComponent<T>;
  width(width?: number): ConfidenceBarComponent<T>;
  groupSize(size?: number): ConfidenceBarComponent<T>;
  groupWidth(width?: number): ConfidenceBarComponent<T>;
  groupSpace(space?: number): ConfidenceBarComponent<T>;
  groupScale(scale?: (d: T) => number): ConfidenceBarComponent<T>;
}

export default function confidenceBar<T = unknown>(): ConfidenceBarComponent<T> {
  return component<ConfidenceBarComponent<T>>()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("confidenceLow", fn.functor)
    .prop("confidenceHigh", fn.functor)
    .prop("width")
    .prop("groupSize")
    .prop("groupWidth")
    .prop("groupSpace")
    .groupSpace(0.05)
    .prop("groupScale", fn.functor)
    .render(function (this: Element, data: T[][]) {
      const selection = select<Element, T>(this);
      const props = selection.props<ConfidenceBarProps<T>>();

      const inGroupScale = scaleBand()
        .domain(range(props.groupSize).map(String))
        .rangeRound([0, props.groupWidth])
        .paddingInner(props.groupSpace)
        .paddingOuter(0);

      const groups = selection
        .selectAll<SVGGElement, T[]>("g.sszvis-confidence-bargroup")
        .data(data)
        .join("g")
        .classed("sszvis-confidence-bargroup", true);

      const barUnits = groups
        .selectAll<SVGGElement, T>("g.sszvis-confidence-barunit")
        .data((d) => d)
        .join("g")
        .classed("sszvis-confidence-barunit", true);

      // The bar's index within its group is recorded against the unit element rather than
      // written onto the datum, so a datum object reused across groups is not aliased: it is
      // the element that is unique per bar, not the caller's object. These datum objects are
      // the consumer's own and are shared with the bar component drawn underneath, which
      // compares them by identity, so they must come back unmodified.
      const indexByUnit = new WeakMap<Element, number>();
      barUnits.each(function (_d, i) {
        indexByUnit.set(this, i);
      });

      // The along-group centre of a bar's slot. Resolved from the element the callback is
      // running on - a line whose parent is the bar unit - because the index is no longer on
      // the datum. Every unit is in the map before any of these run, so a miss means the DOM
      // was changed underneath the component, and it throws rather than defaulting to slot 0.
      //
      // Called once per attribute rather than once per unit: groupScale is a consumer
      // accessor and a stateful one is observable, so the number and order of calls is part
      // of the existing behaviour and is left alone.
      const centreAt = function (this: Element, d: T): number {
        const index = indexByUnit.get(this.parentNode as Element);
        if (index === undefined) {
          throw new Error("[confidenceBar] a bar unit is missing its in-group index");
        }
        return (
          props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2
        );
      };
      const capLeftAt = function (this: Element, d: T): number {
        return centreAt.call(this, d) - props.width / 2;
      };
      const capRightAt = function (this: Element, d: T): number {
        return centreAt.call(this, d) + props.width / 2;
      };

      const unitsWithValue = barUnits.filter((): boolean => {
        return true;
      });

      unitsWithValue.selectAll("*").remove();

      // Vertical lines connecting confidence bounds
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", centreAt)
        .attr("y1", (d) => Number(props.confidenceHigh(d)))
        .attr("x2", centreAt)
        .attr("y2", (d) => Number(props.confidenceLow(d)))
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");

      // Horizontal top caps
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", capLeftAt)
        .attr("y1", (d) => Number(props.confidenceHigh(d)))
        .attr("x2", capRightAt)
        .attr("y2", (d) => Number(props.confidenceHigh(d)))
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");

      // Horizontal bottom caps
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", capLeftAt)
        .attr("y1", (d) => Number(props.confidenceLow(d)))
        .attr("x2", capRightAt)
        .attr("y2", (d) => Number(props.confidenceLow(d)))
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");
    });
}
