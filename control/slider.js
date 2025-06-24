import { select, scaleLinear } from 'd3';
import { functor, identity, set, compose, stringEqual } from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';
import { range } from '../scale.js';
import move from '../behavior/move.js';
import { axisX } from '../axis.js';
import { component } from '../d3-component.js';

/**
 * Slider control
 *
 * Control for use in filtering. Works very much like an interactive axis.
 * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
 * select values on that scale. Ticks created using an sszvis.axis show the user where
 * data values lie.
 *
 * @module  sszvis/control/slider
 *
 * @property {function} scale                 A scale function which this slider represents. The values in the scale's domain
 *                                            are used as the possible values of the slider.
 * @property {array} minorTicks               An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis
 * @property {array} majorTicks               An array of ticks which become major (larger and labeled) ticks on the slider's axis
 * @property {function} tickLabels            A function to use to format the major tick labels.
 * @property {any} value                      The current value of the slider. Should be set whenever slider interaction causes the state to change.
 * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
 * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
 *                                            Note that this component will not change its own state. The callback function must affect some state change
 *                                            in order for this component's display to be updated.
 *
 * @returns {sszvis.component}
 */

function contains(x, a) {
  return a.includes(x);
}
function slider () {
  return component().prop("scale").prop("value").prop("onchange").prop("minorTicks").minorTicks([]).prop("majorTicks").majorTicks([]).prop("tickLabels", functor).tickLabels(identity).prop("label", functor).label(identity).render(function () {
    const selection = select(this);
    const props = selection.props();
    const axisOffset = 28; // vertical offset for the axis
    const majorTickSize = 12;
    const backgroundOffset = halfPixel(18); // vertical offset for the middle of the background
    const handleWidth = 10; // the width of the handle
    const handleHeight = 23; // the height of the handle
    const bgWidth = 6; // the width of the background
    const lineEndOffset = bgWidth / 2; // the amount by which to offset the ends of the background line
    const handleSideOffset = handleWidth / 2 + 0.5; // the amount by which to offset the position of the handle

    const scaleDomain = props.scale.domain();
    const scaleRange = range(props.scale);
    const alteredScale = props.scale.copy().range([scaleRange[0] + handleSideOffset, scaleRange[1] - handleSideOffset]);

    // the mostly unchanging bits
    const bg = selection.selectAll("g.sszvis-control-slider__backgroundgroup").data([1]).join("g").classed("sszvis-control-slider__backgroundgroup", true);

    // create the axis
    const axis = axisX().scale(alteredScale).orient("bottom").hideBorderTickThreshold(0).tickSize(majorTickSize).tickPadding(6).tickValues(set([...props.majorTicks, ...props.minorTicks])).tickFormat(d => contains(d, props.majorTicks) ? props.tickLabels(d) : "");
    const axisSelection = bg.selectAll("g.sszvis-axisGroup").data([1]).join("g").classed("sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slider", true);
    axisSelection.attr("transform", translateString(0, axisOffset)).call(axis);

    // adjust visual aspects of the axis to fit the design
    axisSelection.selectAll(".tick line").filter(d => !contains(d, props.majorTicks)).attr("y2", 4);
    const majorAxisText = axisSelection.selectAll(".tick text").filter(d => contains(d, props.majorTicks));
    const numTicks = majorAxisText.size();
    majorAxisText.style("text-anchor", (d, i) => i === 0 ? "start" : i === numTicks - 1 ? "end" : "middle");

    // create the slider background
    const backgroundSelection = bg.selectAll("g.sszvis-slider__background").data([1]).join("g").classed("sszvis-slider__background", true).attr("transform", translateString(0, backgroundOffset));
    backgroundSelection.selectAll(".sszvis-slider__background__bg1").data([1]).join("line").classed("sszvis-slider__background__bg1", true).style("stroke-width", bgWidth).style("stroke", "#888").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", Math.floor(scaleRange[1] - lineEndOffset));
    backgroundSelection.selectAll(".sszvis-slider__background__bg2").data([1]).join("line").classed("sszvis-slider__background__bg2", true).style("stroke-width", bgWidth - 1).style("stroke", "#fff").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", Math.floor(scaleRange[1] - lineEndOffset));
    backgroundSelection.selectAll(".sszvis-slider__backgroundshadow").data([props.value]).join("line").attr("class", "sszvis-slider__backgroundshadow").attr("stroke-width", bgWidth - 1).style("stroke", "#E0E0E0").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", compose(Math.floor, alteredScale));

    // draw the handle and the label
    const handle = selection.selectAll("g.sszvis-control-slider__handle").data([props.value]).join("g").classed("sszvis-control-slider__handle", true).attr("transform", d => translateString(halfPixel(alteredScale(d)), 0.5));
    handle.append("text").classed("sszvis-control-slider--label", true);
    handle.selectAll(".sszvis-control-slider--label").data(d => [d]).text(props.label).style("text-anchor", d => stringEqual(d, scaleDomain[0]) ? "start" : stringEqual(d, scaleDomain[1]) ? "end" : "middle").attr("dx", d => stringEqual(d, scaleDomain[0]) ? -5 : stringEqual(d, scaleDomain[1]) ? handleWidth / 2 : 0);
    handle.selectAll(".sszvis-control-slider__handlebox").data([1]).join("rect").classed("sszvis-control-slider__handlebox", true).attr("x", -5).attr("y", backgroundOffset - handleHeight / 2).attr("width", handleWidth).attr("height", handleHeight).attr("rx", 2).attr("ry", 2);
    const handleLineDimension = handleHeight / 2 - 4; // the amount by which to offset the small handle line within the handle

    handle.selectAll(".sszvis-control-slider__handleline").data([1]).join("line").classed("sszvis-control-slider__handleline", true).attr("y1", backgroundOffset - handleLineDimension).attr("y2", backgroundOffset + handleLineDimension);
    const sliderInteraction = move().xScale(props.scale)
    // range goes from the text top (text is 11px tall) to the bottom of the axis
    .yScale(scaleLinear().range([-11, axisOffset + majorTickSize])).draggable(true).on("drag", props.onchange);
    selection.selectGroup("sliderInteraction").classed("sszvis-control-slider--interactionLayer", true).attr("transform", translateString(0, 4)).call(sliderInteraction);
  });
}

export { slider as default };
//# sourceMappingURL=slider.js.map
