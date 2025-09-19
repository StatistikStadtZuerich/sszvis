import { select, scaleBand, range } from 'd3';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';

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
function confidenceBar () {
  return component().prop("x", functor).prop("y", functor).prop("confidenceLow", functor).prop("confidenceHigh", functor).prop("width").prop("groupSize").prop("groupWidth").prop("groupSpace").groupSpace(0.05).prop("groupScale", functor).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const inGroupScale = scaleBand().domain(range(props.groupSize).map(String)).rangeRound([0, props.groupWidth]).paddingInner(props.groupSpace).paddingOuter(0);
    const groups = selection.selectAll("g.sszvis-confidence-bargroup").data(data).join("g").classed("sszvis-confidence-bargroup", true);
    const barUnits = groups.selectAll("g.sszvis-confidence-barunit").data(d => d).join("g").classed("sszvis-confidence-barunit", true);
    barUnits.each((d, i) => {
      // necessary for the within-group scale
      d.__sszvisGroupedBarConfidenceIndex__ = i;
    });
    const unitsWithValue = barUnits.filter(() => {
      return true;
    });
    unitsWithValue.selectAll("*").remove();
    // Vertical lines connecting confidence bounds
    unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
      var _d$__sszvisGroupedBar;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar !== void 0 ? _d$__sszvisGroupedBar : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2;
    }).attr("y1", d => {
      return Number(props.confidenceHigh(d));
    }).attr("x2", d => {
      var _d$__sszvisGroupedBar2;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar2 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar2 !== void 0 ? _d$__sszvisGroupedBar2 : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2;
    }).attr("y2", d => {
      return Number(props.confidenceLow(d));
    }).attr("stroke", "#767676").attr("stroke-width", "1");
    // Horizontal top caps
    unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
      var _d$__sszvisGroupedBar3;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar3 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar3 !== void 0 ? _d$__sszvisGroupedBar3 : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 - props.width / 2;
    }).attr("y1", d => {
      return Number(props.confidenceHigh(d));
    }).attr("x2", d => {
      var _d$__sszvisGroupedBar4;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar4 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar4 !== void 0 ? _d$__sszvisGroupedBar4 : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 + props.width / 2;
    }).attr("y2", d => {
      return Number(props.confidenceHigh(d));
    }).attr("stroke", "#767676").attr("stroke-width", "1");
    // Horizontal bottom caps
    unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
      var _d$__sszvisGroupedBar5;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar5 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar5 !== void 0 ? _d$__sszvisGroupedBar5 : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 - props.width / 2;
    }).attr("y1", d => {
      return Number(props.confidenceLow(d));
    }).attr("x2", d => {
      var _d$__sszvisGroupedBar6;
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      const index = (_d$__sszvisGroupedBar6 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar6 !== void 0 ? _d$__sszvisGroupedBar6 : 0;
      return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 + props.width / 2;
    }).attr("y2", d => {
      return Number(props.confidenceLow(d));
    }).attr("stroke", "#767676").attr("stroke-width", "1");
  });
}

export { confidenceBar as default };
//# sourceMappingURL=confidenceBar.js.map
