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
import { type Component, component } from "../d3-component";
import * as fn from "../fn";

// Type definitions for confidence bar component
type Datum<T = unknown> = T & {
  __sszvisGroupedBarConfidenceIndex__?: number;
};

interface ConfidenceBarProps<T = unknown> {
  x?: (d: Datum<T>) => NumberValue;
  y?: (d: Datum<T>) => NumberValue;
  confidenceLow: (d: Datum<T>) => NumberValue;
  confidenceHigh: (d: Datum<T>) => NumberValue;
  width: number;
  groupSize: number;
  groupWidth: number;
  groupSpace: number;
  groupScale: (d: Datum<T>) => number;
}

interface ConfidenceBarComponent<T = unknown> extends Component {
  x(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
  y(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
  confidenceLow(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
  confidenceHigh(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
  width(width?: number): ConfidenceBarComponent<T>;
  groupSize(size?: number): ConfidenceBarComponent<T>;
  groupWidth(width?: number): ConfidenceBarComponent<T>;
  groupSpace(space?: number): ConfidenceBarComponent<T>;
  groupScale(scale?: (d: Datum<T>) => number): ConfidenceBarComponent<T>;
}

export default function <T = unknown>(): ConfidenceBarComponent<T> {
  return component()
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
    .render(function (this: Element, data: Datum<T>[][]) {
      const selection = select(this);
      const props = selection.props<ConfidenceBarProps<T>>();

      const inGroupScale = scaleBand()
        .domain(range(props.groupSize).map(String))
        .rangeRound([0, props.groupWidth])
        .paddingInner(props.groupSpace)
        .paddingOuter(0);

      const groups = selection
        .selectAll("g.sszvis-confidence-bargroup")
        .data(data)
        .join("g")
        .classed("sszvis-confidence-bargroup", true);

      const barUnits = groups
        .selectAll("g.sszvis-confidence-barunit")
        .data((d: Datum<T>[]) => d)
        .join("g")
        .classed("sszvis-confidence-barunit", true);

      barUnits.each((d: Datum<T>, i: number) => {
        // necessary for the within-group scale
        d.__sszvisGroupedBarConfidenceIndex__ = i;
      });

      const unitsWithValue = barUnits.filter((): boolean => {
        return true;
      });

      unitsWithValue.selectAll("*").remove();

      // Vertical lines connecting confidence bounds
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2
          );
        })
        .attr("y1", (d: Datum<T>): number => {
          return Number(props.confidenceHigh(d));
        })
        .attr("x2", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2
          );
        })
        .attr("y2", (d: Datum<T>): number => {
          return Number(props.confidenceLow(d));
        })
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");

      // Horizontal top caps
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) +
            (inGroupScale(String(index)) || 0) +
            inGroupScale.bandwidth() / 2 -
            props.width / 2
          );
        })
        .attr("y1", (d: Datum<T>): number => {
          return Number(props.confidenceHigh(d));
        })
        .attr("x2", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) +
            (inGroupScale(String(index)) || 0) +
            inGroupScale.bandwidth() / 2 +
            props.width / 2
          );
        })
        .attr("y2", (d: Datum<T>): number => {
          return Number(props.confidenceHigh(d));
        })
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");

      // Horizontal bottom caps
      unitsWithValue
        .append("line")
        .classed("sszvis-confidence-bar", true)
        .attr("x1", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) +
            (inGroupScale(String(index)) || 0) +
            inGroupScale.bandwidth() / 2 -
            props.width / 2
          );
        })
        .attr("y1", (d: Datum<T>): number => {
          return Number(props.confidenceLow(d));
        })
        .attr("x2", (d: Datum<T>): number => {
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = d.__sszvisGroupedBarConfidenceIndex__ ?? 0;
          return (
            props.groupScale(d) +
            (inGroupScale(String(index)) || 0) +
            inGroupScale.bandwidth() / 2 +
            props.width / 2
          );
        })
        .attr("y2", (d: Datum<T>): number => {
          return Number(props.confidenceLow(d));
        })
        .attr("stroke", "#767676")
        .attr("stroke-width", "1");
    });
}
