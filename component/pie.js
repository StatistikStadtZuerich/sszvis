import { select, arc, interpolate } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { defaultTransition } from '../transition.js';

/**
 * Pie component
 *
 * The pie component is used to draw pie charts. It uses the d3.arc() generator
 * to create pie wedges.
 *
 * The input data should be an array of data values, where each data value represents one wedge in the pie.
 *
 * @module sszvis/component/pie
 *
 * @property {number} radius                  Required. The outer radius of the pie, in px (no default). It is also
 *                                            used to translate every wedge to (radius, radius); since the arc
 *                                            then extends another radius in every direction, the pie occupies a
 *                                            box of 2 * radius by 2 * radius.
 *                                            The inner radius is hardcoded to 4px and cannot be configured. If the
 *                                            property is left unset the wedges receive an unparseable transform and
 *                                            the tooltip anchors are positioned at NaN, with no warning.
 * @property {string, function} fill          a fill color for wedges in the pie. Ideally a function which takes a
 *                                            data value. If unset, the attribute is omitted and the wedges fall back
 *                                            to the SVG default, black.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default "#FFFFFF", which
 *                                            separates touching wedges). A falsy value passed as the property, such
 *                                            as "" or null, is replaced by that default; a falsy value returned from
 *                                            an accessor is not.
 * @property {number, function} angle         Required. Specifies the angle of the wedges in radians. Theoretically
 *                                            this could be a constant, but that would make for a very strange pie.
 *                                            Ideally, this is a function which takes a data value and returns the
 *                                            angle in radians. Angles are summed as given and never clamped, and if
 *                                            the property is left unset the render throws a TypeError.
 *
 * Note: the wedge geometry is written only by the arc tween, so no `d` attribute exists until
 * the first animation frame, and there is no transition property to opt out of - a chart
 * serialised on the render tick comes out empty. Nothing else animates: transform, fill and
 * stroke are applied to the transition from the values already on the DOM. The tooltip anchors
 * are positioned from the pre-transition angles and are never repositioned when the transition
 * ends, so after an update they describe the previous layout.
 *
 * Note: the component keeps no state of its own. It writes a0/a1 (the angles currently on
 * screen) and _a0/_a1 (the destination angles of the running transition) onto every datum it
 * renders, which is what lets a transition continue from the current geometry. Consequently
 * the data must be mutable - frozen data throws - two entries sharing one object collapse into
 * a single wedge, and a single NaN angle poisons the running total and every wedge after it.
 * See test/component/pie.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Turns a colour property into an accessor. A constant and an accessor returning that
 * constant are equivalent to d3, and so are an unset property and one returning null:
 * either way d3 removes the attribute.
 */
function toColorAccessor(value) {
  // An accessor is handed to d3 untouched. Its result is narrowed from
  // `string | null | undefined` to `string | null` only because d3's own attr typings omit
  // undefined; d3 removes the attribute for either one, so the two are interchangeable here.
  return typeof value === "function" ? value : () => value !== null && value !== void 0 ? value : null;
}
function pie () {
  // The chain is built on the component rather than returned from it: .prop() and .render()
  // are declared to return the generic Component type, since the accessors they install
  // only exist at runtime, so the typed instance has to come from the factory itself.
  const pieComponent = component();
  pieComponent.prop("radius").prop("fill").prop("stroke").prop("angle", functor).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const stroke = props.stroke || "#FFFFFF";
    let angle = 0;
    for (const value of data) {
      // In order for an angle transition to work correctly in d3, the transition must be done in data space.
      // The computed arc path itself cannot be interpolated without error.
      // see http://bl.ocks.org/mbostock/5100636 for a straightforward example.
      // However, due to the structure of sszvis and the way d3 data joining works, this poses a bit of a challenge,
      // since old and new data values could be on different objects, and they need to be merged.
      // In the code that follows, value._a0 and value._a1 are the destination angles for the transition.
      // value.a0 and value.a1 are the current values in the transition (either the initial value, some intermediate value, or the final angle value).
      value._a0 = angle;
      // These a0 and a1 values may be overwritten later if there is already data bound at this data index. (see the .each function further down).
      // `== null` and Number.isNaN(Number(...)) reproduce the original `== undefined ||
      // isNaN(...)` checks exactly: both catch null, undefined and NaN.
      if (value.a0 == null || Number.isNaN(Number(value.a0))) value.a0 = angle;
      angle += props.angle(value);
      value._a1 = angle;
      // data values which don't already have angles set start out at the complete value.
      if (value.a1 == null || Number.isNaN(Number(value.a1))) value.a1 = angle;
    }
    // Every angle read below goes through Number(), which is the coercion d3 used to
    // apply on its own when these values were passed to it untyped: undefined becomes
    // NaN and null becomes 0. Both are reachable, since the handover further down can
    // put a foreign value back on a0/a1 after the loop has normalised it.
    const arcGen = arc().innerRadius(4).outerRadius(props.radius).startAngle(d => Number(d.a0)).endAngle(d => Number(d.a1));
    const segments = selection.selectAll(".sszvis-path").each((d, i) => {
      // This matches the data values iteratively in the same way d3 will when it does the data join.
      // This is kind of a hack, but it's the only way to get any existing angle values from the already-bound data
      if (data[i]) {
        data[i].a0 = d.a0;
        data[i].a1 = d.a1;
      }
    }).data(data).join("path").classed("sszvis-path", true).attr("transform", "translate(".concat(props.radius, ",").concat(props.radius, ")")).attr("fill", toColorAccessor(props.fill)).attr("stroke", toColorAccessor(stroke));
    segments.transition(defaultTransition()).attr("transform", "translate(".concat(props.radius, ",").concat(props.radius, ")")).attrTween("d", d => {
      const angle0Interp = interpolate(Number(d.a0), Number(d._a0));
      const angle1Interp = interpolate(Number(d.a1), Number(d._a1));
      return t => {
        var _arcGen;
        d.a0 = angle0Interp(t);
        d.a1 = angle1Interp(t);
        // arc only returns null when it renders into a canvas context, which this one
        // never does.
        return (_arcGen = arcGen(d)) !== null && _arcGen !== void 0 ? _arcGen : "";
      };
    }).attr("fill", toColorAccessor(props.fill)).attr("stroke", toColorAccessor(stroke));
    const ta = tooltipAnchor().position(d => {
      const a0 = Number(d.a0);
      const a1 = Number(d.a1);
      // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
      // makes the same correction to svg.arc() angles :o
      const a = a0 + Math.abs(a1 - a0) / 2 - Math.PI / 2;
      const r = props.radius * 2 / 3;
      return [props.radius + Math.cos(a) * r, props.radius + Math.sin(a) * r];
    });
    selection.datum(data).call(ta);
  });
  return pieComponent;
}

export { pie as default };
//# sourceMappingURL=pie.js.map
