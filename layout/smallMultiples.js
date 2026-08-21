import { select } from 'd3';
import { component } from '../d3-component.js';

/**
 * Small Multiples layout
 *
 * Used to generate group elements which contain small multiples charts.
 *
 * This component lays out rectangular groups in a grid according to the number of rows
 * and the number of columns provided. It is possible to specify paddingX and paddingY
 * values, pixel amounts which will be left as empty space between the columns and the
 * rows, respectively.
 *
 * Data should be passed to this component in a special way: it should be an array of
 * data values, where each data value represents a single group. IMPORTANT: each data
 * value must also have a property called 'values' which represents the values corresponding
 * to that group.
 *
 * In the multiple pie charts example, an array of "groups" data is bound to the chart before
 * the multiples component is called. Each element in the "groups" data has a values property
 * which contains the data for a single pie chart.
 *
 * The multiples component creates the groups and lays them out, attaching the following new properties
 * to each group object:
 *
 * gx - the x-position of the group
 * gy - the y-position of the group
 * gw - the width of the group (without padding)
 * gh - the height of the group (without padding)
 * cx - the horizontal center point of the group
 * cy - the vertical center point of the group
 *
 * Generally, you should not use source data objects as group objects, but should instead
 * create new objects which are used to store group information. This creates a data hierarchy
 * which matches the representation hierarchy, which is very much a d3 pattern.
 *
 * Once the groups have been created, the user must still do something with them. The pattern
 * for creating charts within each group should look something like:
 *
 * chart.selectAll('.sszvis-multiple')
 *   .each(function(d) {
 *     var groupSelection = select(this);
 *
 *     ... do something which creates a chart using groupSelection ...
 *   });
 *
 * @module sszvis/layout/smallMultiples
 *
 * @property {number} width           the total width of the collection of multiples
 * @property {number} height          the total height of the collection of multiples
 * @property {number} paddingX        x-padding to put between columns
 * @property {number} paddingY        y-padding to put between rows
 * @property {number} rows            the number of rows to generate
 * @property {number} cols            the number of columns to generate
 * @property {boolean} showTitle      whether to show a title above each multiple (default: false)
 * @property {function} titleLabel    accessor function to get the title text from the data
 * @property {string} titleAnchor     text-anchor for the title: "start", "middle", or "end" (default: "middle")
 * @property {number} titleY          y-position offset for the title (default: 0)
 *
 * Behaviour notes:
 * - Groups are laid out left-to-right, then top-to-bottom, one group per datum.
 * - gx/gy are grid-absolute; cx/cy are unit-relative and identical for every multiple,
 *   since each group is translated to its own gx/gy.
 * - The layout writes gx/gy/gw/gh/cx/cy back onto the bound data objects.
 * - width, height, rows, cols, paddingX and paddingY have no defaults; omitting any of
 *   them silently produces NaN geometry. Only the four title properties (showTitle,
 *   titleLabel, titleAnchor, titleY) have defaults.
 * - More data than rows * cols overflows the declared height rather than erroring.
 * - A datum without a `values` property binds `undefined` to its inner chart group.
 * - titleLabel is called after the layout fields have been attached to the datum, so it
 *   sees gx/gy/gw/gh/cx/cy alongside the caller's own fields.
 * - A titleAnchor other than "start"/"end" is positioned as "middle" but is still written
 *   to the text-anchor attribute verbatim.
 *
 * @return {sszvis.component}
 */
function smallMultiples () {
  return component().prop("width").prop("height").prop("paddingX").prop("paddingY").prop("rows").prop("cols").prop("showTitle").showTitle(false).prop("titleLabel").titleLabel(() => "").prop("titleAnchor").titleAnchor("middle").prop("titleY").titleY(0).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const unitWidth = (props.width - props.paddingX * (props.cols - 1)) / props.cols;
    const unitHeight = (props.height - props.paddingY * (props.rows - 1)) / props.rows;
    const horizontalCenter = unitWidth / 2;
    const verticalCenter = unitHeight / 2;
    const multiples = selection.selectAll("g.sszvis-multiple").data(data).join("g").classed("sszvis-g sszvis-multiple", true);
    multiples.selectAll("g.sszvis-multiple-chart").data(d => [d.values]).join("g").classed("sszvis-multiple-chart", true);
    multiples.datum((d, i) => {
      d.gx = i % props.cols * (unitWidth + props.paddingX);
      d.gw = unitWidth;
      d.cx = horizontalCenter;
      d.gy = Math.floor(i / props.cols) * (unitHeight + props.paddingY);
      d.gh = unitHeight;
      d.cy = verticalCenter;
      return d;
    }).attr("transform", d => "translate(".concat(d.gx, ",").concat(d.gy, ")"));
    // Render titles if showTitle is enabled
    if (props.showTitle) {
      const titleX = props.titleAnchor === "start" ? 0 : props.titleAnchor === "end" ? unitWidth : horizontalCenter;
      multiples.selectAll(".sszvis-multiple-title").data(d => [d]).join("text").classed("sszvis-multiple-title", true).attr("x", titleX).attr("y", props.titleY).attr("text-anchor", props.titleAnchor).text(props.titleLabel);
    } else {
      multiples.selectAll(".sszvis-multiple-title").remove();
    }
  });
}

export { smallMultiples as default };
//# sourceMappingURL=smallMultiples.js.map
