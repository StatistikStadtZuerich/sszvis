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
import { type Component } from "../d3-component.js";
/**
 * One group of the grid. `values` carries the data for the chart drawn inside the group;
 * the layout writes its geometry back onto the same object.
 */
export type SmallMultipleGroup<V = unknown> = {
    values: V;
    /** x-position of the group within the grid */
    gx?: number;
    /** y-position of the group within the grid */
    gy?: number;
    /** width of the group, without padding */
    gw?: number;
    /** height of the group, without padding */
    gh?: number;
    /** horizontal centre of the group, in the group's own frame */
    cx?: number;
    /** vertical centre of the group, in the group's own frame */
    cy?: number;
};
export interface SmallMultiplesComponent<G extends SmallMultipleGroup = SmallMultipleGroup> extends Component {
    /**
     * The six geometry properties have no defaults, so their getters report undefined until the
     * corresponding setter has been called. Reading one before then is what produces the NaN
     * geometry described in the module's behaviour notes.
     */
    width(): number | undefined;
    width(width: number): SmallMultiplesComponent<G>;
    height(): number | undefined;
    height(height: number): SmallMultiplesComponent<G>;
    paddingX(): number | undefined;
    paddingX(padding: number): SmallMultiplesComponent<G>;
    paddingY(): number | undefined;
    paddingY(padding: number): SmallMultiplesComponent<G>;
    rows(): number | undefined;
    rows(rows: number): SmallMultiplesComponent<G>;
    cols(): number | undefined;
    cols(cols: number): SmallMultiplesComponent<G>;
    showTitle(): boolean;
    showTitle(show: boolean): SmallMultiplesComponent<G>;
    titleLabel(): (d: G, i: number) => string;
    titleLabel(accessor: (d: G, i: number) => string): SmallMultiplesComponent<G>;
    /** "start", "middle" or "end"; any other value is positioned as "middle" but written to
     * the text-anchor attribute verbatim. */
    titleAnchor(): string;
    titleAnchor(anchor: string): SmallMultiplesComponent<G>;
    titleY(): number;
    titleY(y: number): SmallMultiplesComponent<G>;
}
export default function <G extends SmallMultipleGroup = SmallMultipleGroup>(): SmallMultiplesComponent<G>;
//# sourceMappingURL=smallMultiples.d.ts.map