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
 * @property {Function} sizeScale                    A scale function for the size of the nodes. The domain and the range should
 *                                                   be configured using values returned by the sszvis.layout.sankey.computeLayout
 *                                                   function.
 * @property {Function} columnPosition               A scale function for the position of the columns of nodes.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number} nodeThickness                  A number for the horizontal thickness of the node bars.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number} nodePadding                    A number for padding between the nodes.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number, Function} columnPadding        A number, or function that takes a column index and returns a number,
 *                                                   for padding at the top of each column. Used to vertically center the columns.
 * @property {String, Function} columnLabel          A string, or a function that returns a string, for the label at the top of each column.
 * @property {Number} columnLabelOffset              A value for offsetting the column labels in the x axis. Used to move the column labels around if you
 *                                                   don't want them to be centered on the columns. This is useful in situations where the normal label would
 *                                                   overlap outer boundaries or otherwise be inconveniently positioned. You can usually forget this, except
 *                                                   perhaps in very narrow screen layouts.
 * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default 0.5.
 * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color.
 * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color.
 * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
 *                                                   The default implementation stacks links in decresing order of value, i.e. larger, thicker links
 *                                                   are below smaller, thinner ones.
 * @property {String, Function} labelSide            A function determining the position of labels for the nodes. Should take a column index and
 *                                                   return a side ('left' or 'right'). Default is always 'left'.
 * @property {Boolean} labelSideSwitch               A boolean used to determine whether to switch the label side. When true, 'left' labels will be shown on
 *                                                   the right side, and 'right' labels on the left side. This is useful as a switch to be flipped in very
 *                                                   narrow screen layouts, when you want the labels to appear on the opposite side of the columns they refer to.
 * @property {Number} labelOpacity                   A value for the opacity of the column labels. You can change this to affect the visibility of the column
 *                                                   labels, for instance to hide them when they would overlap with user-triggered hover labels.
 * @property {Number} labelHitBoxSize                A number for the width of 'hit boxes' added underneath the labels. This should basically be
 *                                                   equal to the width of the widest label. For performance reasons, it doesn't make sense to calculate
 *                                                   this value at run time while the component is rendered. Far better is to position the chart so that the
 *                                                   labels are visible, find the value of the widest label, and use that.
 * @property {Function} nameLabel                    A function which takes the id of a node and should return the label for that node. Defaults tousing
 *                                                   the id directly.
 * @property {Array} linkSourceLabels                An array containing the data for links which should have labels on their 'source' end, that is the
 *                                                   end of the link which is connected to the source node. These data values should match the values
 *                                                   returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give the data
 *                                                   values themselves here. See the examples for an implementation of the most straightforward
 *                                                   mechanism for this.
 * @property {Array} linkTargetLabels                An array containing data for links which should have labels on their 'target' end, that is the
 *                                                   end of the link which is connected to the target node. Works the same as linkSourceLabels, but used
 *                                                   for another set of possible link labels.
 * @property {String, Function} linkLabel            A string or function returning a string to use for the label of each link. Function
 *                                                   versions should accept a link datum (like the ones passed into linkSourceLabels or linkTargetLabels)
 *                                                   and return text.
 *
 * @return {sszvis.component}
 */

import { interpolateNumber, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import {
  type Component,
  component,
  type PropertySetter,
  type RenderCallback,
} from "../d3-component.js";
import * as fn from "../fn.js";
import { halfPixel } from "../svgUtils/crisp.js";
import translateString from "../svgUtils/translateString.js";
import bar from "./bar.js";

/* Types
----------------------------------------------- */

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

type SankeyProps = {
  sizeScale: SizeScale;
  columnPosition: ColumnScale;
  nodeThickness: number;
  nodePadding: number;
  columnPadding: ColumnAccessor<number>;
  columnLabel: ColumnAccessor<string>;
  columnLabelOffset: ColumnLabelOffset;
  linkCurvature: number;
  /**
   * Handed to bar, whose fill accepts an accessor returning undefined, so this one keeps the
   * undefined that fn.functor actually yields where linkColor has to claim null.
   */
  nodeColor?: StoredAccessor<SankeyNode, string | undefined>;
  linkColor?: ColorAccessor<SankeyLink>;
  linkSort: LinkComparator;
  labelSide: ColumnAccessor<LabelSide>;
  labelSideSwitch?: boolean;
  labelOpacity: StoredAccessor<SankeyNode, number>;
  labelHitBoxSize: number;
  nameLabel: (id: string) => string;
  linkSourceLabels: SankeyLink[];
  linkTargetLabels: SankeyLink[];
  linkLabel?: LabelAccessor<SankeyLink>;
};

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

/* Constants
----------------------------------------------- */

/** Padding between the nodes and the links attached to them. Deliberately not a property. */
const LINK_PADDING = 1;

/** How far above the columns the column labels and their ticks are drawn. */
const COLUMN_LABEL_Y = -24;

/* Helper functions
----------------------------------------------- */

const linkPathString = (
  x0: number,
  x1: number,
  x2: number,
  x3: number,
  y0: number,
  y1: number
): string => `M${x0},${y0}C${x1},${y0} ${x2},${y1} ${x3},${y1}`;
const linkBounds = (
  x0: number,
  x1: number,
  y0: number,
  y1: number
): [number, number, number, number] => [x0, x1, y0, y1];

/** The links are keyed on their id, so a redrawn link keeps its path element. */
const idAcc = (link: SankeyLink) => link.id;

/* Module
----------------------------------------------- */
export default function (): SankeyComponent {
  return component<SankeyComponent>()
    .prop("sizeScale")
    .prop("columnPosition")
    .prop("nodeThickness")
    .prop("nodePadding")
    .prop("columnPadding", fn.functor)
    .prop("columnLabel", fn.functor)
    .columnLabel("")
    .prop("columnLabelOffset", fn.functor)
    .columnLabelOffset(0)
    .prop("linkCurvature")
    .linkCurvature(0.5)
    .prop("nodeColor", fn.functor)
    .prop("linkColor", fn.functor)
    .prop("linkSort", fn.functor)
    .linkSort((a: SankeyLink, b: SankeyLink) => a.value - b.value) // Default sorts in descending order of value
    .prop("labelSide", fn.functor)
    .labelSide("left")
    .prop("labelSideSwitch")
    .prop("labelOpacity", fn.functor)
    .labelOpacity(1)
    .prop("labelHitBoxSize")
    .labelHitBoxSize(0)
    .prop("nameLabel")
    .nameLabel(fn.identity)
    .prop("linkSourceLabels")
    .linkSourceLabels([])
    .prop("linkTargetLabels")
    .linkTargetLabels([])
    .prop("linkLabel", fn.functor)
    .render(function (this: Element, data: SankeyData) {
      const selection = select(this);
      const props = selection.props<SankeyProps>();

      const getNodePosition = (node: SankeyNode): number =>
        Math.floor(
          props.columnPadding(node.columnIndex) +
            props.sizeScale(node.valueOffset) +
            props.nodePadding * node.nodeIndex
        );
      const xPosition = (node: SankeyNode): number => props.columnPosition(node.columnIndex);
      const yPosition = (node: SankeyNode): number => getNodePosition(node);
      const xExtent = (): number => Math.max(props.nodeThickness, 1);
      const yExtent = (node: SankeyNode): number =>
        Math.ceil(Math.max(props.sizeScale(node.value), 1));

      // Draw the nodes
      const barGen = bar<SankeyNode>()
        .x(xPosition)
        .y(yPosition)
        .width(xExtent)
        .height(yExtent)
        .fill(props.nodeColor);

      const barGroup = selection.selectGroup("nodes").datum(data.nodes);

      barGroup.call(barGen);

      const barTooltipAnchor = tooltipAnchor<SankeyNode>().position((node): [number, number] => [
        xPosition(node) + xExtent() / 2,
        yPosition(node) + yExtent(node) / 2,
      ]);

      barGroup.call(barTooltipAnchor);

      // Draw the column labels
      const columnLabelX = (colIndex: number): number =>
        props.columnPosition(colIndex) + props.nodeThickness / 2;
      const columnLabels = barGroup
        .selectAll<SVGTextElement, number>(".sszvis-sankey-column-label")
        // One number for each column
        .data(data.columnLengths)
        .join("text")
        .attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-column-label");

      columnLabels
        .attr("transform", (d, i) =>
          translateString(columnLabelX(i) + props.columnLabelOffset(d, i), COLUMN_LABEL_Y)
        )
        .text((_d, i) => props.columnLabel(i));

      const columnLabelTicks = barGroup
        .selectAll<SVGLineElement, number>(".sszvis-sankey-column-label-tick")
        .data(data.columnLengths)
        .join("line")
        .attr("class", "sszvis-sankey-column-label-tick");

      columnLabelTicks
        .attr("x1", (_d, i) => halfPixel(columnLabelX(i)))
        .attr("x2", (_d, i) => halfPixel(columnLabelX(i)))
        .attr("y1", halfPixel(COLUMN_LABEL_Y + 8))
        .attr("y2", halfPixel(COLUMN_LABEL_Y + 12));

      // Draw the links
      const linkPoints = (link: SankeyLink): [number, number, number, number] => {
        const curveStart =
            props.columnPosition(link.src.columnIndex) + props.nodeThickness + LINK_PADDING,
          curveEnd = props.columnPosition(link.tgt.columnIndex) - LINK_PADDING,
          startLevel =
            getNodePosition(link.src) +
            props.sizeScale(link.srcOffset) +
            props.sizeScale(link.value) / 2,
          endLevel =
            getNodePosition(link.tgt) +
            props.sizeScale(link.tgtOffset) +
            props.sizeScale(link.value) / 2;

        return [curveStart, curveEnd, startLevel, endLevel];
      };

      const linkPath = (link: SankeyLink): string => {
        const points = linkPoints(link),
          curveInterp = interpolateNumber(points[0], points[1]),
          curveControlPtA = curveInterp(props.linkCurvature),
          curveControlPtB = curveInterp(1 - props.linkCurvature);

        return linkPathString(
          points[0],
          curveControlPtA,
          curveControlPtB,
          points[1],
          points[2],
          points[3]
        );
      };

      const linkBoundingBox = (link: SankeyLink): [number, number, number, number] => {
        const points = linkPoints(link);

        return linkBounds(points[0], points[1], points[2], points[3]);
      };

      const linkThickness = (link: SankeyLink): number => Math.max(props.sizeScale(link.value), 1);

      // Render the links
      const linksGroup = selection.selectGroup("links");

      const linksElems = linksGroup
        .selectAll<SVGPathElement, SankeyLink>(".sszvis-link")
        .data(data.links, idAcc)
        .join("path")
        .attr("class", "sszvis-link");

      linksElems
        .attr("fill", "none")
        .attr("d", linkPath)
        .attr("stroke-width", linkThickness)
        .attr("stroke", props.linkColor ?? null)
        .sort(props.linkSort);

      linksGroup.datum(data.links);

      const linkTooltipAnchor = tooltipAnchor<SankeyLink>().position((link): [number, number] => {
        const bbox = linkBoundingBox(link);
        return [(bbox[0] + bbox[1]) / 2, (bbox[2] + bbox[3]) / 2];
      });

      linksGroup.call(linkTooltipAnchor);

      // Render the link labels
      const linkLabelsGroup = selection.selectGroup("linklabels");

      // If no props.linkSourceLabels are provided, most of this rendering is no-op
      const linkSourceLabels = linkLabelsGroup
        .selectAll<SVGTextElement, SankeyLink>(".sszvis-sankey-link-source-label")
        .data(props.linkSourceLabels)
        .join("text")
        .attr(
          "class",
          "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-source-label"
        );

      linkSourceLabels
        .attr("transform", (link) => {
          const bbox = linkBoundingBox(link);
          return translateString(bbox[0] + 6, bbox[2]);
        })
        .text(props.linkLabel ?? null);

      // If no props.linkTargetLabels are provided, most of this rendering is no-op
      const linkTargetLabels = linkLabelsGroup
        .selectAll<SVGTextElement, SankeyLink>(".sszvis-sankey-link-target-label")
        .data(props.linkTargetLabels)
        .join("text")
        .attr(
          "class",
          "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-target-label"
        );

      linkTargetLabels
        .attr("transform", (link) => {
          const bbox = linkBoundingBox(link);
          return translateString(bbox[1] - 6, bbox[3]);
        })
        .text(props.linkLabel ?? null);

      // Render the node labels and their hit boxes
      const getLabelSide = (colIndex: number): LabelSide => {
        let side = props.labelSide(colIndex);
        if (props.labelSideSwitch) {
          side = side === "left" ? "right" : "left";
        }
        return side;
      };

      const nodeLabelsGroup = selection.selectGroup("nodelabels");

      const barLabels = nodeLabelsGroup
        .selectAll<SVGTextElement, SankeyNode>(".sszvis-sankey-node-label")
        .data(data.nodes)
        .join("text")
        .attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-node-label");

      barLabels
        .text((node) => props.nameLabel(node.id))
        .attr("text-align", "middle")
        .attr("text-anchor", (node) =>
          getLabelSide(node.columnIndex) === "left" ? "end" : "start"
        )
        .attr("x", (node) =>
          getLabelSide(node.columnIndex) === "left"
            ? xPosition(node) - 6
            : xPosition(node) + props.nodeThickness + 6
        )
        .attr("y", (node) => yPosition(node) + yExtent(node) / 2)
        .style("opacity", props.labelOpacity);

      const barLabelHitBoxes = nodeLabelsGroup
        .selectAll<SVGRectElement, SankeyNode>(".sszvis-sankey-hitbox")
        .data(data.nodes)
        .join("rect")
        .attr("class", "sszvis-sankey-hitbox");

      barLabelHitBoxes
        .attr("fill", "transparent")
        .attr(
          "x",
          (node) =>
            xPosition(node) +
            (getLabelSide(node.columnIndex) === "left" ? -props.labelHitBoxSize : 0)
        )
        .attr("y", (node) => yPosition(node) - props.nodePadding / 2)
        .attr("width", props.labelHitBoxSize + props.nodeThickness)
        .attr("height", (node) => yExtent(node) + props.nodePadding);
    });
}
