import { select, ascending, scaleLinear } from 'd3';
import { axisX } from '../axis.js';
import move from '../behavior/move.js';
import { component } from '../d3-component.js';
import { functor, identity, set } from '../fn.js';
import { rangeExtent } from '../scale.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';

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
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 *                                                      Use "horizontal" to reset to a horizontal slant.
 * @property {number|Date} value             The current value of the slider. Should be set whenever slider interaction causes the state to change.
 *                                            Required: rendering without it throws before any element is created. Values outside the
 *                                            scale's domain are clamped to it.
 * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
 * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
 *                                            Note that this component will not change its own state. The callback function must affect some state change
 *                                            in order for this component's display to be updated.
 *
 * Note: the handle, the track fill, the axis and the interaction layer all work through one copy
 * of the scale whose range is inset by half the handle width at each end, so that the handle stays
 * inside the track and pointing at the pixel where a value's handle is drawn reports that value.
 * That copy is clamped, so a `value` outside the domain pins the handle to the end of the track
 * rather than drawing it past the end. The inset is applied to each end of the configured range in
 * turn, so a descending range keeps its direction.
 *
 * Note: ticks are drawn in track order, not in the order they were configured, so the outermost
 * major labels are anchored inwards whatever order `majorTicks` is given in.
 *
 * Note: the move behaviour's y-scale is given a range but no domain, so the second argument passed
 * to `onchange` is a meaningless fraction and should be ignored.
 *
 * See test/control/slider.test.ts.
 *
 * @returns {sszvis.component}
 */
const AXIS_OFFSET = 28; // vertical offset for the axis
const MAJOR_TICK_SIZE = 12;
const MINOR_TICK_SIZE = 4;
const BACKGROUND_OFFSET = halfPixel(18); // vertical offset for the middle of the background
const HANDLE_WIDTH = 10; // the width of the handle
const HANDLE_HEIGHT = 23; // the height of the handle
const BG_WIDTH = 6; // the width of the background
const LINE_END_OFFSET = BG_WIDTH / 2; // the amount by which to offset the ends of the background line
const HANDLE_SIDE_OFFSET = HANDLE_WIDTH / 2 + 0.5; // the amount by which to offset the position of the handle
/** The amount by which to offset the small handle line within the handle. */
const HANDLE_LINE_DIMENSION = HANDLE_HEIGHT / 2 - 4;
/** Vertical extent of the interaction layer: from the label top (text is 11px tall) to the axis. */
const INTERACTION_TOP = -11;
function contains(x, a) {
  return a.includes(x);
}
function slider() {
  return component().prop("scale").prop("value").prop("onchange").prop("minorTicks").minorTicks([]).prop("majorTicks").majorTicks([]).prop("tickLabels", functor).prop("slant")
  // fn.identity is the documented "no formatting" default. It returns its argument, so it
  // cannot satisfy a formatter type that promises a string - d3 stringifies the value at
  // render time, which its own types do not model.
  .tickLabels(identity).prop("label", functor).label(identity).render(function () {
    const selection = select(this);
    const props = selection.props();
    // `value` is only dereferenced further down, once the handle is being labelled, so
    // without this guard a slider rendered before its state exists would leave a
    // half-built control on screen. Thrown before anything is appended, and named, so
    // the caller is not left reading a TypeError out of fn.stringEqual.
    if (props.value == null) {
      throw new Error("[sszvis.control.slider] the `value` property is required");
    }
    const scaleRange = rangeExtent(props.scale);
    // Inset each end of the configured range towards the middle rather than rebuilding
    // it from the sorted extent, so that a descending range keeps its direction.
    const [rangeStart, rangeEnd] = props.scale.range();
    const rangeSign = rangeStart <= rangeEnd ? 1 : -1;
    // Clamped so that a value outside the domain pins the handle to the end of the
    // track, and so that a drag past either end reports that end of the domain.
    const alteredScale = props.scale.copy().range([rangeStart + rangeSign * HANDLE_SIDE_OFFSET, rangeEnd - rangeSign * HANDLE_SIDE_OFFSET]).clamp(true);
    // the mostly unchanging bits
    const bg = selection.selectAll("g.sszvis-control-slider__backgroundgroup").data([1]).join("g").classed("sszvis-control-slider__backgroundgroup", true);
    // Sorted by position along the track, so that the outer-label anchoring below can
    // read the leftmost and rightmost labels off the ends of the selection.
    const tickValues = set([...props.majorTicks, ...props.minorTicks]);
    tickValues.sort((a, b) => ascending(alteredScale(a), alteredScale(b)));
    // create the axis
    const axis = axisX().scale(alteredScale).orient("bottom").slant(props.slant).hideBorderTickThreshold(0).tickSize(MAJOR_TICK_SIZE).tickPadding(6).tickValues(tickValues).tickFormat(d => contains(d, props.majorTicks) ? props.tickLabels(d) : "");
    const axisSelection = bg.selectAll("g.sszvis-axisGroup").data([1]).join("g").classed("sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slider", true);
    axisSelection.attr("transform", translateString(0, AXIS_OFFSET)).call(axis);
    // adjust visual aspects of the axis to fit the design
    axisSelection.selectAll(".tick line").filter(d => !contains(d, props.majorTicks)).attr("y2", MINOR_TICK_SIZE);
    const majorAxisText = axisSelection.selectAll(".tick text").filter(d => contains(d, props.majorTicks));
    if (!props.slant || props.slant === "horizontal") {
      // The selection is in track order, so the first and last entries are the labels
      // at the ends of the track. A lone label needs no inward nudge.
      const numTicks = majorAxisText.size();
      majorAxisText.style("text-anchor", (_d, i) => {
        if (numTicks === 1) return "middle";
        return i === 0 ? "start" : i === numTicks - 1 ? "end" : "middle";
      });
    }
    if (props.slant === "vertical") {
      majorAxisText.attr("dx", "-1.8em");
      majorAxisText.attr("dy", "-1.5em");
    }
    if (props.slant === "diagonal") {
      majorAxisText.attr("dx", "-1.6em");
      majorAxisText.attr("dy", "0.2em");
    }
    // create the slider background
    const backgroundSelection = bg.selectAll("g.sszvis-slider__background").data([1]).join("g").classed("sszvis-slider__background", true).attr("transform", translateString(0, BACKGROUND_OFFSET));
    backgroundSelection.selectAll(".sszvis-slider__background__bg1").data([1]).join("line").classed("sszvis-slider__background__bg1", true).style("stroke-width", BG_WIDTH).style("stroke", "#888").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + LINE_END_OFFSET)).attr("x2", Math.floor(scaleRange[1] - LINE_END_OFFSET));
    backgroundSelection.selectAll(".sszvis-slider__background__bg2").data([1]).join("line").classed("sszvis-slider__background__bg2", true).style("stroke-width", BG_WIDTH - 1).style("stroke", "#fff").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + LINE_END_OFFSET)).attr("x2", Math.floor(scaleRange[1] - LINE_END_OFFSET));
    backgroundSelection.selectAll(".sszvis-slider__backgroundshadow").data([props.value]).join("line").attr("class", "sszvis-slider__backgroundshadow").attr("stroke-width", BG_WIDTH - 1).style("stroke", "#E0E0E0").style("stroke-linecap", "round")
    // The fill runs from the end of the track the domain minimum sits at, which is
    // the right-hand end for a descending range.
    .attr("x1", rangeSign === 1 ? Math.ceil(rangeStart + LINE_END_OFFSET) : Math.floor(rangeStart - LINE_END_OFFSET)).attr("x2", d => rangeSign === 1 ? Math.floor(alteredScale(d)) : Math.ceil(alteredScale(d)));
    // draw the handle and the label
    /**
     * Which end of the track the handle sits at: -1 at the low-pixel end, 1 at the
     * high-pixel end, 0 anywhere in between. Compared with a sub-pixel tolerance,
     * since the drawn position is a rounded copy of the inset range.
     */
    const handleSide = d => {
      const x = alteredScale(d);
      const [insetStart, insetEnd] = alteredScale.range();
      const low = Math.min(insetStart, insetEnd);
      const high = Math.max(insetStart, insetEnd);
      if (x <= low + 1) return -1;
      if (x >= high - 1) return 1;
      return 0;
    };
    const handle = selection.selectAll("g.sszvis-control-slider__handle").data([props.value]).join("g").classed("sszvis-control-slider__handle", true).attr("transform", d => translateString(halfPixel(alteredScale(d)), 0.5));
    handle.selectAll(".sszvis-control-slider--label").data(d => [d]).join("text").classed("sszvis-control-slider--label", true).text(props.label)
    // Anchored from the pixel the handle is drawn at, not from the value's position
    // in the domain. A descending range draws the domain's first value at the right-hand end,
    // where a domain-keyed "start" anchor sends a long label - a date, typically -
    // off the track instead of tucking it inside; and a value outside the domain is
    // clamped to an end without equalling either bound, so it would be centred over
    // an edge. Both fall out of asking which end of the track the handle is at.
    .style("text-anchor", d => {
      const side = handleSide(d);
      return side === 0 ? "middle" : side < 0 ? "start" : "end";
    }).attr("dx", d => handleSide(d) * (HANDLE_WIDTH / 2));
    handle.selectAll(".sszvis-control-slider__handlebox").data([1]).join("rect").classed("sszvis-control-slider__handlebox", true).attr("x", -5).attr("y", BACKGROUND_OFFSET - HANDLE_HEIGHT / 2).attr("width", HANDLE_WIDTH).attr("height", HANDLE_HEIGHT).attr("rx", 2).attr("ry", 2);
    handle.selectAll(".sszvis-control-slider__handleline").data([1]).join("line").classed("sszvis-control-slider__handleline", true).attr("y1", BACKGROUND_OFFSET - HANDLE_LINE_DIMENSION).attr("y2", BACKGROUND_OFFSET + HANDLE_LINE_DIMENSION);
    // The original always called .on("drag", props.onchange), including with undefined,
    // which d3-dispatch treats as removing the listener. The guard is equivalent.
    const sliderInteraction = move()
    // The same inset scale the handle is drawn with, so that pointing at a handle's
    // pixel reports that handle's value. The padding is a hit-area widening, not a
    // coordinate correction: the handle overhangs each end of the inset track by
    // HANDLE_SIDE_OFFSET, so without it the outer half-handle - including the pixel the
    // domain's own minimum is drawn at - falls outside the interaction layer and can
    // never be dragged to.
    .xScale(alteredScale).padding({
      left: HANDLE_SIDE_OFFSET,
      right: HANDLE_SIDE_OFFSET
    })
    // range goes from the text top (text is 11px tall) to the bottom of the axis
    .yScale(scaleLinear().range([INTERACTION_TOP, AXIS_OFFSET + MAJOR_TICK_SIZE])).draggable(true);
    if (props.onchange) {
      sliderInteraction.on("drag", props.onchange);
    }
    selection.selectGroup("sliderInteraction").classed("sszvis-control-slider--interactionLayer", true).attr("transform", translateString(0, 4)).call(sliderInteraction);
  });
}

export { slider as default };
//# sourceMappingURL=slider.js.map
