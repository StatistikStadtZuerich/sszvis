/**
 * Sankey component
 *
 * This component is used for making sankey diagrams, also known as parallel sets diagrams. They
 * depict individual entities as bars, and flows between those entities as thick links connecting
 * those bars. The entities can be many things associated with flows, for example organizations,
 * geographic regions, or websites, while the links between them can represent many kinds of flows,
 * for example payments of money, movements of people, or referral of browsing traffic. In this component,
 * the entities are referred to as 'nodes', and the connections between them are referred to as 'links'.
 *
 * @module sszvis/component/sankey
 *
 * @requires sszvis.component.bar
 *
 * @property {Function} sizeScale                    A scale function for the size of the nodes. The domain and the range should be configured using
 *                                                   values returned by the sszvis.layout.sankey.computeLayout function. It scales the links as well:
 *                                                   a link's thickness is sizeScale(value) and its offset within its node sizeScale(srcOffset).
 *                                                   Required, and an unset scale throws "props.sizeScale is not a function".
 * @property {Function} columnPosition               A scale function for the position of the columns of nodes. Should be configured using a value
 *                                                   returned by the sszvis.layout.sankey.computeLayout function. Required, and throws like sizeScale
 *                                                   when unset. It is called with a column index for the column labels as well as for the nodes, so
 *                                                   it is also consulted for columns that hold no node.
 * @property {Number} nodeThickness                  A number for the horizontal thickness of the node bars. Should be configured using a value
 *                                                   returned by the sszvis.layout.sankey.computeLayout function. Required, but omitting it is not
 *                                                   reported: Math.max(undefined, 1) is NaN, which bar's missing-value guard turns into zero-width
 *                                                   bars, while the column labels, the hit boxes and the tooltip anchors keep the NaN. Must be a
 *                                                   plain number - an accessor, which most other properties in this library accept, is used in
 *                                                   arithmetic and yields the same NaN. The bar's width is floored at one pixel but the link starts
 *                                                   and the column label centring read the raw value, so below a thickness of one the two disagree.
 * @property {Number} nodePadding                    A number for padding between the nodes. Should be configured using a value returned by the
 *                                                   sszvis.layout.sankey.computeLayout function. It applies between nodes only; the links stacked
 *                                                   inside a node are spaced by the size scale alone and fill it exactly. It also sets how far a
 *                                                   label hit box extends past its node, half of it above and half below. Required, must be a plain
 *                                                   number, and fails as silently as nodeThickness: every node's position becomes NaN, which bar
 *                                                   turns into 0, so the whole column collapses onto one row.
 * @property {Number, Function} columnPadding        A number, or function that takes a column index and returns a number, for padding at the top of
 *                                                   each column. Used to vertically center the columns. Required despite the functor wrapper: it has
 *                                                   no default, so leaving it unset throws "props.columnPadding is not a function". An accessor is
 *                                                   called with the column index alone, without d3's index and group arguments.
 * @property {String, Function} columnLabel          A string, or a function that returns a string, for the label at the top of each column. Defaults
 *                                                   to "", so the text elements are always in the DOM, and so are their ticks - which sszvis.css
 *                                                   gives a stroke, so an unlabelled chart still shows a short line per column pointing at nothing. A
 *                                                   function is called with the column index alone, not with the label's own datum, which is that
 *                                                   column's node count; columnLabelOffset decorates the same element but takes the datum first. One
 *                                                   label and one tick are drawn per entry in data.columnLengths, whether or not a node lives in that
 *                                                   column.
 * @property {Number, Function} columnLabelOffset    A value for offsetting the column labels in the x axis. Used to move the column labels around if
 *                                                   you don't want them to be centered on the columns. This is useful in situations where the normal
 *                                                   label would overlap outer boundaries or otherwise be inconveniently positioned. You can usually
 *                                                   forget this, except perhaps in very narrow screen layouts. Default 0. It shifts the label only -
 *                                                   the tick stays centred on the column - and horizontally only; the vertical position is fixed. A
 *                                                   function is applied by d3 rather than by the renderer, so it receives the label's datum, that
 *                                                   column's node count, followed by the column index.
 * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default
 *                                                   0.5, which puts both control points at the horizontal midpoint. Never clamped: at 1 the control
 *                                                   points swap ends, which still keeps the curve inside the column gap as a pronounced S, and above
 *                                                   1 they leave the gap altogether and the curve swings out past both columns. Must be a plain
 *                                                   number, like nodeThickness; an accessor yields NaN control points and the browser drops the path.
 * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color. Optional:
 *                                                   when unset no fill attribute is written and the bars fall back to the stylesheet.
 * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color. Optional, as
 *                                                   nodeColor: unset leaves the stroke attribute off the paths.
 * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
 *                                                   The comparator is handed to d3's selection.sort, which orders the elements ascending, so the
 *                                                   comparator's largest link is the last one in the document and paints over all the others. The
 *                                                   default comparator is ascending by value, so the thickest links paint over the thinnest, undoing
 *                                                   in the DOM the descending order sszvis.layout.sankey.prepareData put the array in for the
 *                                                   opposite reason. Reverse it to keep the thin links on top. The property is wrapped in fn.functor,
 *                                                   so a value that is not a function is silently turned into a comparator claiming every pair is
 *                                                   already ordered. The sort reorders elements only; the data array, and with it the link tooltip
 *                                                   anchors, keeps its original order.
 * @property {String, Function} labelSide            A function determining the position of labels for the nodes. Should take a column index and
 *                                                   return a side ('left' or 'right'). Default is always 'left'. A function receives the column index
 *                                                   alone, without d3's index and group arguments. The test is `=== "left"`, so any other value, a
 *                                                   typo included, silently lands the label on the right, and labelSideSwitch then maps it to 'left'.
 * @property {Boolean} labelSideSwitch               A boolean used to determine whether to switch the label side. When true, 'left' labels will be
 *                                                   shown on the right side, and 'right' labels on the left side. This is useful as a switch to be
 *                                                   flipped in very narrow screen layouts, when you want the labels to appear on the opposite side of
 *                                                   the columns they refer to. The hit boxes follow the switch as well.
 * @property {Number, Function} labelOpacity         A value for the opacity of the node labels, or a function over a node returning one. Default 1.
 *                                                   Despite what this property used to claim, it is applied to the node labels: the column labels
 *                                                   never receive an opacity at all, and no property hides them. Use it to fade the node names out
 *                                                   when they would overlap with user-triggered hover labels.
 * @property {Number} labelHitBoxSize                A number for the width of the transparent 'hit boxes' drawn over the labels. This should
 *                                                   basically be equal to the width of the widest label. For performance reasons, it doesn't make
 *                                                   sense to calculate this value at run time while the component is rendered. Far better is to
 *                                                   position the chart so that the labels are visible, find the value of the widest label, and use
 *                                                   that. Default 0, which leaves a box exactly as wide as a node. Must be a plain number: the width
 *                                                   is computed once, from labelHitBoxSize plus nodeThickness, so every box is the same width
 *                                                   whatever its own label says. The boxes are appended after the labels and so paint over them,
 *                                                   which is what lets them catch the pointer.
 * @property {Function} nameLabel                    A function which takes the id of a node and should return the label for that node. Defaults to
 *                                                   using the id directly. The only label accessor that has to be a function: it is not wrapped in
 *                                                   fn.functor, so a constant throws "props.nameLabel is not a function".
 * @property {Array} linkSourceLabels                An array containing the data for links which should have labels on their 'source' end, that is
 *                                                   the end of the link which is connected to the source node. These data values should match the
 *                                                   values returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give
 *                                                   the data values themselves here. See the examples for an implementation of the most
 *                                                   straightforward mechanism for this. Defaults to []. The array is used as given and never checked
 *                                                   against data.links, so a stale link object still renders a label, positioned from its own src and
 *                                                   tgt and so at a place where no link is drawn.
 * @property {Array} linkTargetLabels                An array containing data for links which should have labels on their 'target' end, that is the
 *                                                   end of the link which is connected to the target node. Works the same as linkSourceLabels, but
 *                                                   used for another set of possible link labels.
 * @property {String, Function} linkLabel            A string or function returning a string to use for the label of each link. Function versions
 *                                                   should accept a link datum (like the ones passed into linkSourceLabels or linkTargetLabels) and
 *                                                   return text. Optional: when unset the label elements are still created for every entry in
 *                                                   linkSourceLabels and linkTargetLabels, with no text in them.
 *
 * Note: the component always creates four sub-groups, in this order: nodes, links,
 * linklabels and nodelabels. The order is load-bearing, since it makes the links paint over
 * the node bars, and every group is created even when there is nothing to put in it. The
 * column labels and their ticks are not among them: they are selected off the same selection
 * the bars are rendered into, so they live in the nodes group alongside the rects and the
 * tooltip anchors. They can still be styled by class - .sszvis-sankey-column-label in
 * sszvis.css does exactly that - but there is no group of their own to transform, fade or
 * make click-through as a unit. Their vertical position is a hard-coded -24, above the
 * group's origin, so they depend on the chart's top padding to be visible at all.
 *
 * Note: a one pixel gap is left between a node and the links attached to it, so the curves
 * never quite touch the bars. It is a local constant, deliberately not a property, and it
 * does not scale with the chart.
 *
 * Note: only the node bars are guarded against missing values. They are drawn by bar, which
 * replaces NaN with 0, while the link paths, the labels and the hit boxes are written here
 * by hand from the same numbers. A size scale that returns NaN for one value - a d3 scale
 * fed undefined, a gap in the data - therefore gives that node a bar of zero height and its
 * links a d and a stroke-width of NaN, which the browser drops entirely: the node renders
 * and the link disappears. Nothing is logged either way.
 *
 * Note: a node's box is snapped to whole pixels, the position floored and the height ceiled,
 * so neighbouring nodes never leave a sub-pixel gap between them. The link geometry is not
 * rounded. The links do start from the same floored position as the bar, so they stay glued
 * to its top edge, but the stack of links inside a node can finish up to a pixel short of
 * the bar's bottom edge.
 *
 * Note: the nodes end up with their tooltip anchors written twice. bar renders its own
 * anchors into the group it is called on, and the component then calls a second
 * tooltipAnchor on the same group. Both join to [data-tooltip-anchor] over data.nodes, so
 * the second pass reuses the first one's rects and overwrites their transforms rather than
 * adding any. What is observable is four anchors rather than eight, centred on the nodes
 * rather than at bar's default top-centre.
 *
 * Note: the links are keyed by id, so a link keeps its path element across renders, but the
 * nodes go through bar, whose join is unkeyed, so rect identity follows the array index. A
 * reordered node array moves no element; it rewrites the attributes in place, and each rect
 * ends up bound to a different node. That matters for anything holding on to a rect, such as
 * a hover handler.
 *
 * Note: the component never sets bar's transition property, so it keeps bar's default of
 * true - and that transition does not animate anything, so the nodes jump straight to their
 * new geometry. It is not free either: a d3 transition is still created and discarded on
 * every node rect on every render. See test/component/sankey.test.ts.
 *
 * @return {sszvis.component}
 */
import { type Component, type PropertySetter, type RenderCallback } from "../d3-component.js";
/**
 * One entity in the diagram, drawn as a bar, as sszvis.layout.sankey.prepareData produces
 * it. Everything up to valueOffset is what the component reads.
 */
export type SankeyNode = {
    /** The node's unique id, also its default label. */
    id: string;
    /** Which column the node belongs to. Indexes both columnPosition and columnPadding. */
    columnIndex: number;
    /** The node's position within its column, counted in nodes. */
    nodeIndex: number;
    /** The node's total flow, which becomes its height once passed through sizeScale. */
    value: number;
    /** The total flow of all the nodes above this one in its column. */
    valueOffset: number;
    /**
     * The links leaving this node. Filled in by the layout and never read by the component,
     * but the usual handle for hover and highlight code - see the linkSourceLabels examples.
     */
    linksFrom?: SankeyLink[];
    /** The links arriving at this node. As linksFrom, the component never reads it. */
    linksTo?: SankeyLink[];
};
/**
 * One flow between two nodes, drawn as a curve. The source and target are the node objects
 * themselves rather than ids, so a link carries its own geometry.
 */
export type SankeyLink = {
    /** Identifies the link across renders; the data join is keyed on it. */
    id: number;
    /** The size of the flow, which becomes the curve's thickness once passed through sizeScale. */
    value: number;
    /** The node the link leaves. */
    src: SankeyNode;
    /** The total flow of all the links leaving the same node above this one. */
    srcOffset: number;
    /** The node the link arrives at. */
    tgt: SankeyNode;
    /** The total flow of all the links arriving at the same node above this one. */
    tgtOffset: number;
};
/**
 * The datum the component expects, i.e. the part of sszvis.layout.sankey.prepareData's
 * output that it reads. columnLengths is used for the column labels only, so it determines
 * how many labels are drawn rather than how many columns hold nodes.
 */
export type SankeyData = {
    nodes: SankeyNode[];
    /**
     * Every link is expected to be present and to point at real nodes; the layout drops the
     * invalid ones by mapping them to null, and then throws on its own sort before it can hand
     * such an array over.
     */
    links: SankeyLink[];
    columnLengths: number[];
    /**
     * The total value of each column. The component never reads it, but the layout returns it
     * alongside the rest and computeLayout needs it, so it is declared here to keep the
     * layout's output assignable to this type.
     */
    columnTotals?: number[];
};
/** Which side of its node a label is drawn on. */
export type LabelSide = "left" | "right";
/** Maps a node's or a link's value to a number of pixels. A d3 linear scale in practice. */
type SizeScale = (value: number) => number;
/** Maps a column index to that column's horizontal position. A d3 linear scale in practice. */
type ColumnScale = (columnIndex: number) => number;
/**
 * A constant or an accessor over a datum; either is accepted wherever fn.functor normalises
 * the value on set. d3 hands an accessor the datum and its index, and declaring fewer
 * parameters is fine.
 */
type SankeyValue<D, R> = R | ((datum: D, index: number) => R);
/**
 * How a functor-wrapped property reads back once it is stored. Both parameters are optional,
 * because a constant becomes a functor that ignores its arguments, and because the renderer
 * calls several of these itself with only some of the arguments d3 would pass.
 */
type StoredAccessor<D, R> = (datum?: D, index?: number) => R;
/**
 * A colour, or nothing when the property was never set - fn.functor then yields undefined,
 * which d3 treats exactly like null and removes the attribute for. The null is for d3's
 * benefit: its attr overloads accept null but not undefined. Same convention as bar's fill
 * and stroke.
 */
type ColorAccessor<D> = (datum?: D, index?: number) => string | null;
/** A label's text, or nothing when the property was never set. As ColorAccessor. */
type LabelAccessor<D> = (datum?: D, index?: number) => string | null;
/**
 * How the three column-driven properties read back. The renderer calls each of them itself,
 * with a column index and nothing else, so unlike the datum accessors above they never see
 * an index in the second position.
 */
type ColumnAccessor<R> = (columnIndex?: number) => R;
/** A constant, or that same single-argument accessor. */
type ColumnValue<R> = R | ((columnIndex: number) => R);
/**
 * Orders the links against each other, deciding which one is painted on top. Unlike the
 * accessors above, both parameters are required: the renderer never calls the comparator
 * itself, it only hands it to d3's own sort, which always passes two links. A constant is
 * still accepted on set, because fn.functor wraps it into a function that ignores its
 * arguments and declaring fewer parameters is fine.
 */
type LinkComparator = (a: SankeyLink, b: SankeyLink) => number;
/**
 * The column label offset is the one column property that is applied by d3 rather than by
 * the renderer, so it is handed the datum bound to the label - the column's node count -
 * followed by the column index. Note that columnLabel, which decorates the same element,
 * takes the index in the first position instead. The parameter names are the point of this
 * type; structurally it is the same shape as the datum accessors.
 */
type ColumnLabelOffset = (columnLength?: number, index?: number) => number;
/** What may be passed for the column label offset: a constant, or that same accessor. */
type ColumnLabelOffsetValue = number | ((columnLength: number, index: number) => number);
/**
 * `component()` hands back whatever interface it is asked for, but the two builder methods it
 * inherits are declared as returning the plain Component, so a component interface has to
 * re-declare them to survive its own construction chain. Without this the chain widens to
 * `any` at the first default and nothing in it is checked.
 */
interface SankeyBuilder extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): SankeyComponent;
    render(callback: RenderCallback): SankeyComponent;
}
/**
 * Setters take `<U = ...>` so that an accessor over a narrower datum type can be passed
 * without naming it at the call site.
 */
export interface SankeyComponent extends SankeyBuilder {
    sizeScale(): SizeScale;
    sizeScale(scale: SizeScale): SankeyComponent;
    columnPosition(): ColumnScale;
    columnPosition(scale: ColumnScale): SankeyComponent;
    nodeThickness(): number;
    nodeThickness(thickness: number): SankeyComponent;
    nodePadding(): number;
    nodePadding(padding: number): SankeyComponent;
    columnPadding(): ColumnAccessor<number>;
    columnPadding(value: ColumnValue<number>): SankeyComponent;
    columnLabel(): ColumnAccessor<string>;
    columnLabel(value: ColumnValue<string>): SankeyComponent;
    columnLabelOffset(): ColumnLabelOffset;
    columnLabelOffset(value: ColumnLabelOffsetValue): SankeyComponent;
    linkCurvature(): number;
    linkCurvature(curvature: number): SankeyComponent;
    nodeColor(): StoredAccessor<SankeyNode, string | undefined> | undefined;
    nodeColor<U = SankeyNode>(value: SankeyValue<U, string | undefined>): SankeyComponent;
    linkColor(): ColorAccessor<SankeyLink> | undefined;
    linkColor<L = SankeyLink>(value: SankeyValue<L, string | undefined>): SankeyComponent;
    linkSort(): LinkComparator;
    linkSort<L = SankeyLink>(comparator: (a: L, b: L) => number): SankeyComponent;
    labelSide(): ColumnAccessor<LabelSide>;
    labelSide(value: ColumnValue<LabelSide>): SankeyComponent;
    labelSideSwitch(): boolean | undefined;
    labelSideSwitch(value: boolean): SankeyComponent;
    labelOpacity(): StoredAccessor<SankeyNode, number>;
    labelOpacity<U = SankeyNode>(value: SankeyValue<U, number>): SankeyComponent;
    labelHitBoxSize(): number;
    labelHitBoxSize(size: number): SankeyComponent;
    nameLabel(): (id: string) => string;
    nameLabel(accessor: (id: string) => string): SankeyComponent;
    linkSourceLabels(): SankeyLink[];
    linkSourceLabels(links: SankeyLink[]): SankeyComponent;
    linkTargetLabels(): SankeyLink[];
    linkTargetLabels(links: SankeyLink[]): SankeyComponent;
    linkLabel(): LabelAccessor<SankeyLink> | undefined;
    linkLabel<L = SankeyLink>(value: SankeyValue<L, string | undefined>): SankeyComponent;
}
export default function (): SankeyComponent;
export {};
//# sourceMappingURL=sankey.d.ts.map