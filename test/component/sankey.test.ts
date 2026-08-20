import { afterEach, beforeEach, describe, expect, test } from "vitest";
import sankey from "../../src/component/sankey.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";
import {
  computeLayout as untypedComputeLayout,
  prepareData as untypedPrepareData,
} from "../../src/layout/sankey.js";

/** The shape of a node as produced by sszvis.layout.sankey.prepareData. */
type Node = {
  id: string;
  columnIndex: number;
  nodeIndex: number;
  value: number;
  valueOffset: number;
};

/** The shape of a link as produced by sszvis.layout.sankey.prepareData. */
type Link = {
  id: number;
  value: number;
  src: Node;
  srcOffset: number;
  tgt: Node;
  tgtOffset: number;
};

type SankeyData = { nodes: Node[]; links: Link[]; columnLengths: number[] };

/**
 * src/layout/sankey.js is still plain JavaScript, so its two exports carry no useful types.
 * They are described here as narrowly as the integration test at the bottom of this file
 * needs them; the declarations can go away once the layout module is ported too.
 */
type Row = { from: string; to: string; value: number };
type PreparedData = SankeyData & { columnTotals: number[] };
type PrepareData = {
  source(accessor: (d: Row) => string): PrepareData;
  target(accessor: (d: Row) => string): PrepareData;
  value(accessor: (d: Row) => number): PrepareData;
  idLists(lists: string[][]): PrepareData;
  apply(data: Row[]): PreparedData;
};
type Layout = { nodeThickness: number; nodePadding: number; columnPaddings: number[] };

const prepareData = untypedPrepareData as unknown as () => PrepareData;
const computeLayout = untypedComputeLayout as unknown as (
  columnLengths: number[],
  columnTotals: number[],
  columnHeight: number,
  columnWidth: number
) => Layout;

describe("component/sankey", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `sankey-${++layerKey}`,
    }).selectGroup("sankey");

  const render = (component: unknown, data: unknown) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  /**
   * Two columns of two nodes each, with a link between every pair. The links hold direct
   * references to their node objects, exactly as layout.sankey.prepareData builds them, so
   * a test that mutates a value must build its own copy - hence the factory. The shared
   * `testData` below is for the majority of tests, which only read it.
   *
   * Values are chosen so that the identity sizeScale below turns them into round pixel
   * numbers:
   *
   *   column 0            column 1
   *   A value 30  --20--> C value 25
   *               --10--> D value 15
   *   B value 10  ---5--> C
   *               ---5--> D
   */
  const makeData = (): SankeyData => {
    const a: Node = { id: "A", columnIndex: 0, nodeIndex: 0, value: 30, valueOffset: 0 };
    const b: Node = { id: "B", columnIndex: 0, nodeIndex: 1, value: 10, valueOffset: 30 };
    const c: Node = { id: "C", columnIndex: 1, nodeIndex: 0, value: 25, valueOffset: 0 };
    const d: Node = { id: "D", columnIndex: 1, nodeIndex: 1, value: 15, valueOffset: 25 };
    return {
      nodes: [a, b, c, d],
      links: [
        { id: 1, value: 20, src: a, srcOffset: 0, tgt: c, tgtOffset: 0 },
        { id: 2, value: 10, src: a, srcOffset: 20, tgt: d, tgtOffset: 0 },
        { id: 3, value: 5, src: b, srcOffset: 0, tgt: c, tgtOffset: 20 },
        { id: 4, value: 5, src: b, srcOffset: 5, tgt: d, tgtOffset: 10 },
      ],
      columnLengths: [2, 2],
    };
  };

  const testData = makeData();

  /**
   * A sankey wired with an identity size scale and columns 100px apart, so every rendered
   * coordinate can be read straight off the fixture's values.
   */
  const sankeyOf = () =>
    sankey()
      .sizeScale((v: number) => v)
      .columnPosition((i: number) => i * 100)
      .nodeThickness(20)
      .nodePadding(10)
      .columnPadding(0);

  const grp = (node: Element, key: string) =>
    node.querySelector(`[data-d3-selectgroup="${key}"]`) as SVGGElement | null;
  const all = <E extends Element = Element>(node: Element, key: string, selector: string): E[] => [
    ...(grp(node, key)?.querySelectorAll<E>(selector) ?? []),
  ];
  const attrs = (node: Element, key: string, selector: string, attr: string) =>
    all(node, key, selector).map((el) => el.getAttribute(attr));
  const texts = (node: Element, key: string, selector: string) =>
    all(node, key, selector).map((el) => el.textContent);
  const bars = (node: Element) => attrs(node, "nodes", "rect.sszvis-bar", "x");
  const anchors = (node: Element, key: string) =>
    attrs(node, key, "[data-tooltip-anchor]", "transform");

  describe("groups", () => {
    test("should render the four groups in a fixed order", () => {
      const node = render(sankeyOf(), testData);
      const keys = [...node.querySelectorAll("[data-d3-selectgroup]")].map((g) =>
        g.getAttribute("data-d3-selectgroup")
      );
      expect(keys).toEqual(["nodes", "links", "linklabels", "nodelabels"]);
    });

    test("should create every group even when there is nothing to put in it", () => {
      const node = render(sankeyOf(), { nodes: [], links: [], columnLengths: [] });
      expect(grp(node, "nodes")).not.toBeNull();
      expect(grp(node, "links")).not.toBeNull();
      expect(grp(node, "linklabels")).not.toBeNull();
      expect(grp(node, "nodelabels")).not.toBeNull();
      expect(grp(node, "linklabels")?.childElementCount).toBe(0);
    });

    test("should keep the column labels in the nodes group, not in a group of their own", () => {
      // NOTE: the column labels and their ticks are appended to the "nodes" group, because
      // they are selected off the same selection the bars are rendered into. The group
      // therefore holds rects, tooltip anchors, texts and lines together. They can still be
      // styled by class - .sszvis-sankey-column-label in sszvis.css does exactly that - but
      // there is no wrapping group to transform, fade or make click-through as a unit.
      const node = render(sankeyOf().columnLabel("x"), testData);
      expect(all(node, "nodes", "text.sszvis-sankey-column-label").length).toBe(2);
      expect(all(node, "nodes", "line.sszvis-sankey-column-label-tick").length).toBe(2);
    });
  });

  describe("nodes", () => {
    test("should render one bar per node", () => {
      const node = render(sankeyOf(), testData);
      expect(all(node, "nodes", "rect.sszvis-bar").length).toBe(4);
    });

    test("should position the bars by column and stack them within the column", () => {
      const node = render(sankeyOf(), testData);
      // x is columnPosition(columnIndex)
      expect(bars(node)).toEqual(["0", "0", "100", "100"]);
      // y is columnPadding + sizeScale(valueOffset) + nodePadding * nodeIndex
      expect(attrs(node, "nodes", "rect.sszvis-bar", "y")).toEqual(["0", "40", "0", "35"]);
    });

    test("should take the bar width from nodeThickness and the height from the size scale", () => {
      const node = render(sankeyOf(), testData);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "width")).toEqual(["20", "20", "20", "20"]);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")).toEqual(["30", "10", "25", "15"]);
    });

    test("should offset every column by its columnPadding", () => {
      const node = render(
        sankeyOf().columnPadding((i: number) => i * 7),
        testData
      );
      expect(attrs(node, "nodes", "rect.sszvis-bar", "y")).toEqual(["0", "40", "7", "42"]);
    });

    test("should accept a constant columnPadding", () => {
      const node = render(sankeyOf().columnPadding(5), testData);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "y")).toEqual(["5", "45", "5", "40"]);
    });

    test("should floor the vertical position and ceil the height", () => {
      // Positions are floored and heights ceiled so that neighbouring nodes never leave a
      // sub-pixel gap between them.
      const node = render(
        sankeyOf()
          .sizeScale((v: number) => v * 1.5)
          .columnPadding(0.7),
        testData
      );
      // A: floor(0.7 + 0) = 0, height ceil(45) = 45
      // B: floor(0.7 + 45 + 10) = 55, height ceil(15) = 15
      expect(attrs(node, "nodes", "rect.sszvis-bar", "y").slice(0, 2)).toEqual(["0", "55"]);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height").slice(0, 2)).toEqual(["45", "15"]);
    });

    test("should give a zero-value node one pixel of height", () => {
      // NOTE: deliberate - Math.max(sizeScale(value), 1) keeps a node with no flow visible
      // as a hairline rather than letting it disappear.
      const data = makeData();
      data.nodes[1].value = 0;
      const node = render(sankeyOf(), data);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")[1]).toBe("1");
    });

    test("should give the bars at least one pixel of width", () => {
      const node = render(sankeyOf().nodeThickness(0), testData);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "width")).toEqual(["1", "1", "1", "1"]);
    });

    test("should apply nodeColor as a constant or an accessor", () => {
      const constant = render(sankeyOf().nodeColor("#f00"), testData);
      expect(attrs(constant, "nodes", "rect.sszvis-bar", "fill")).toEqual([
        "#f00",
        "#f00",
        "#f00",
        "#f00",
      ]);
      const accessor = render(
        sankeyOf().nodeColor((n: Node) => (n.columnIndex === 0 ? "#f00" : "#00f")),
        testData
      );
      expect(attrs(accessor, "nodes", "rect.sszvis-bar", "fill")).toEqual([
        "#f00",
        "#f00",
        "#00f",
        "#00f",
      ]);
    });

    test("should leave the fill unset when no nodeColor is given", () => {
      const node = render(sankeyOf(), testData);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "fill")).toEqual([null, null, null, null]);
    });
  });

  describe("column labels", () => {
    test("should render one label and one tick per column", () => {
      const node = render(sankeyOf(), testData);
      expect(all(node, "nodes", "text.sszvis-sankey-column-label").length).toBe(2);
      expect(all(node, "nodes", "line.sszvis-sankey-column-label-tick").length).toBe(2);
    });

    test("should centre the labels on the columns, 24px above the origin", () => {
      // NOTE: the vertical offset is a hard-coded -24, so the labels are drawn above the
      // group's origin and depend on the chart's top padding to be visible at all. There is
      // no property to move them down; columnLabelOffset only shifts them horizontally.
      const node = render(sankeyOf(), testData);
      // columnPosition(i) + nodeThickness / 2
      expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")).toEqual([
        "translate(10,-24)",
        "translate(110,-24)",
      ]);
    });

    test("should snap the ticks to the half-pixel grid", () => {
      const node = render(sankeyOf(), testData);
      const ticks = all(node, "nodes", "line.sszvis-sankey-column-label-tick");
      expect(ticks.map((t) => t.getAttribute("x1"))).toEqual(["10.5", "110.5"]);
      expect(ticks.map((t) => t.getAttribute("x2"))).toEqual(["10.5", "110.5"]);
      // The tick runs from 8 to 12 below the label's baseline
      expect(ticks.map((t) => t.getAttribute("y1"))).toEqual(["-15.5", "-15.5"]);
      expect(ticks.map((t) => t.getAttribute("y2"))).toEqual(["-11.5", "-11.5"]);
    });

    test("should render an empty label by default", () => {
      // NOTE: columnLabel defaults to "", so the text elements are always in the DOM, and so
      // are their ticks - which sszvis.css gives a stroke, so an unlabelled chart still
      // shows two short lines pointing at nothing.
      const node = render(sankeyOf(), testData);
      expect(texts(node, "nodes", "text.sszvis-sankey-column-label")).toEqual(["", ""]);
      expect(all(node, "nodes", "line.sszvis-sankey-column-label-tick").length).toBe(2);
    });

    test("should accept a constant columnLabel for every column", () => {
      const node = render(sankeyOf().columnLabel("Total"), testData);
      expect(texts(node, "nodes", "text.sszvis-sankey-column-label")).toEqual(["Total", "Total"]);
    });

    test("should hand the column index to a columnLabel function", () => {
      // NOTE: columnLabel is called with the column index alone - `props.columnLabel(i)` -
      // and so is the only accessor bound to an element that never sees that element's own
      // datum, which here is the column's node count. columnLabelOffset decorates the same
      // text element but is called with (columnLength, index), so the two props disagree
      // about their arguments. labelSide is also handed a bare column index, but it is not
      // bound to an element at all.
      const node = render(
        sankeyOf().columnLabel((i: number) => `col ${i}`),
        testData
      );
      expect(texts(node, "nodes", "text.sszvis-sankey-column-label")).toEqual(["col 0", "col 1"]);
    });

    test("should shift the labels by columnLabelOffset without moving the ticks", () => {
      // NOTE: the offset applies to the label only. The tick stays centred on the column,
      // which is the point of the prop - it moves a label out of the way of a boundary
      // while leaving the pointer to the column in place.
      const node = render(sankeyOf().columnLabelOffset(30), testData);
      expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")).toEqual([
        "translate(40,-24)",
        "translate(140,-24)",
      ]);
      expect(attrs(node, "nodes", "line.sszvis-sankey-column-label-tick", "x1")).toEqual([
        "10.5",
        "110.5",
      ]);
    });

    test("should hand the column length and index to a columnLabelOffset function", () => {
      const seen: [number, number][] = [];
      const node = render(
        sankeyOf().columnLabelOffset((length: number, i: number) => {
          seen.push([length, i]);
          return i * 10;
        }),
        testData
      );
      expect(seen).toEqual([
        [2, 0],
        [2, 1],
      ]);
      expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")).toEqual([
        "translate(10,-24)",
        "translate(120,-24)",
      ]);
    });

    test("should render a label per entry in columnLengths, not per column of nodes", () => {
      // NOTE: the labels are joined to data.columnLengths, so the number of labels follows
      // that array rather than the nodes. A third entry produces a third label and tick
      // positioned by columnPosition(2), even though no node lives there.
      const node = render(
        sankeyOf().columnLabel((i: number) => `col ${i}`),
        {
          ...testData,
          columnLengths: [2, 2, 0],
        }
      );
      expect(texts(node, "nodes", "text.sszvis-sankey-column-label")).toEqual([
        "col 0",
        "col 1",
        "col 2",
      ]);
      expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")[2]).toBe(
        "translate(210,-24)"
      );
    });
  });

  describe("links", () => {
    const linkAttrs = (node: Element, attr: string) =>
      attrs(node, "links", "path.sszvis-link", attr);

    test("should render one path per link", () => {
      const node = render(sankeyOf(), testData);
      expect(all(node, "links", "path.sszvis-link").length).toBe(4);
    });

    test("should draw a cubic curve from the source's right edge to the target's left edge", () => {
      const node = render(sankeyOf(), testData);
      // A one pixel gap is left between a node and its links; that padding is a constant
      // and cannot be configured. The curve starts at 0 + 20 + 1 and ends at 100 - 1.
      // The vertical level is the node's position plus the link's offset within the node
      // plus half the link's own thickness.
      expect(linkAttrs(node, "d")).toEqual([
        "M21,42.5C60,42.5 60,22.5 99,22.5",
        "M21,47.5C60,47.5 60,47.5 99,47.5",
        "M21,25C60,25 60,40 99,40",
        "M21,10C60,10 60,10 99,10",
      ]);
    });

    test("should take the stroke width from the link's value", () => {
      const node = render(sankeyOf(), testData);
      // Asserted as a multiset, because document order is the sort's business - see below
      const widths = linkAttrs(node, "stroke-width").map(Number);
      expect(widths.sort((a, b) => a - b)).toEqual([5, 5, 10, 20]);
    });

    test("should give a zero-value link one pixel of thickness", () => {
      // NOTE: a Math.max(..., 1) floor keeps a link with no flow visible as a hairline. The
      // nodes apply the same floor but also ceil the result, Math.ceil(Math.max(..., 1));
      // link thicknesses are never rounded, which is the subject of the rounding note at
      // the bottom of this file.
      const data = makeData();
      data.links[0].value = 0;
      const node = render(sankeyOf(), data);
      // The zeroed link sorts first, since the default sort is by ascending value
      expect(attrs(node, "links", "path.sszvis-link", "stroke-width")[0]).toBe("1");
    });

    test("should never fill the paths", () => {
      const node = render(sankeyOf(), testData);
      expect(linkAttrs(node, "fill")).toEqual(["none", "none", "none", "none"]);
    });

    test("should apply linkColor as a constant or an accessor", () => {
      const constant = render(sankeyOf().linkColor("#0f0"), testData);
      expect(attrs(constant, "links", "path.sszvis-link", "stroke")).toEqual([
        "#0f0",
        "#0f0",
        "#0f0",
        "#0f0",
      ]);
      const accessor = render(
        sankeyOf().linkColor((l: Link) => (l.value > 5 ? "#f00" : "#00f")),
        testData
      );
      // DOM order after the default sort is by ascending value: 5, 5, 10, 20
      expect(attrs(accessor, "links", "path.sszvis-link", "stroke")).toEqual([
        "#00f",
        "#00f",
        "#f00",
        "#f00",
      ]);
    });

    test("should leave the stroke unset when no linkColor is given", () => {
      const node = render(sankeyOf(), testData);
      expect(linkAttrs(node, "stroke")).toEqual([null, null, null, null]);
    });

    test("should flatten the curve as linkCurvature approaches zero", () => {
      const node = render(sankeyOf().linkCurvature(0), testData);
      // Both control points collapse onto the end points, giving a straight-ish diagonal
      expect(linkAttrs(node, "d")[2]).toBe("M21,25C21,25 99,40 99,40");
    });

    test("should place the control points symmetrically for the default curvature", () => {
      const node = render(sankeyOf(), testData);
      // 0.5 puts both control points at the horizontal midpoint
      expect(linkAttrs(node, "d")[2]).toBe("M21,25C60,25 60,40 99,40");
    });

    test("should key the links by id, so a changed link list keeps matching elements", () => {
      const component = sankeyOf();
      const g = group("link-key");
      const data = makeData();
      g.datum(data).call(component as never);
      const node = g.node() as SVGGElement;
      const first = all(node, "links", "path.sszvis-link")[3];

      // Drop the two smallest links; the largest keeps its element because the join is keyed
      g.datum({ ...data, links: [data.links[0], data.links[1]] }).call(component as never);
      expect(all(node, "links", "path.sszvis-link").length).toBe(2);
      expect(all(node, "links", "path.sszvis-link")).toContain(first);
    });

    test("should sort the paths by ascending value, so the thickest link is drawn last", () => {
      // BUG: the default linkSort is (a, b) => a.value - b.value, which d3's
      // selection.sort applies as an ascending sort. The thickest link therefore ends up
      // last in document order and paints over all the thinner ones - the opposite of what
      // the component claims in two places: the JSDoc for linkSort ("larger, thicker links
      // are below smaller, thinner ones") and the inline comment on the default itself
      // ("Default sorts in descending order of value"). It also undoes, in the DOM, the
      // descending sort layout.sankey.prepareData applied for exactly this reason ("smaller
      // links will render on top of larger links"). selection.sort reorders the elements
      // only; the data array stays descending, which is why the link tooltip anchors below
      // end up in a different order from the paths.
      // current: ascending, thick links on top. expected: thin links on top, per the docs.
      const node = render(sankeyOf(), testData);
      expect(linkAttrs(node, "stroke-width")).toEqual(["5", "5", "10", "20"]);
    });

    test("should sort the paths with a custom linkSort", () => {
      const node = render(
        sankeyOf().linkSort((a: Link, b: Link) => b.value - a.value),
        testData
      );
      expect(linkAttrs(node, "stroke-width")).toEqual(["20", "10", "5", "5"]);
    });

    test("should accept a linkSort that is not a comparator at all", () => {
      // NOTE: linkSort is wrapped in fn.functor, which is meaningless for a comparator: a
      // number is turned into a function returning that number, so d3 is handed a
      // "comparator" that claims every pair is already in order. Nothing warns, and the
      // paths simply end up in whatever order the sort algorithm settles on.
      const node = render(sankeyOf().linkSort(1), testData);
      expect(all(node, "links", "path.sszvis-link").length).toBe(4);
    });

    test("should remove a link's path when the link goes away", () => {
      const component = sankeyOf();
      const g = group("link-exit");
      const data = makeData();
      g.datum(data).call(component as never);
      g.datum({ ...data, links: [data.links[0]] }).call(component as never);
      const node = g.node() as SVGGElement;
      expect(all(node, "links", "path.sszvis-link").length).toBe(1);
    });
  });

  describe("tooltip anchors", () => {
    test("should centre one anchor on every node", () => {
      const node = render(sankeyOf(), testData);
      // x + nodeThickness / 2, y + height / 2
      expect(anchors(node, "nodes")).toEqual([
        "translate(10,15)",
        "translate(10,45)",
        "translate(110,12.5)",
        "translate(110,42.5)",
      ]);
    });

    test("should centre one anchor on every link's bounding box", () => {
      const node = render(sankeyOf(), testData);
      // The midpoint of the curve's start and end points, in data.links order
      expect(anchors(node, "links")).toEqual([
        "translate(60,10)",
        "translate(60,32.5)",
        "translate(60,32.5)",
        "translate(60,47.5)",
      ]);
    });

    test("should hand the node anchors to two components in a row", () => {
      // NOTE: bar renders its own tooltip anchors into the group it is called on, and the
      // sankey then calls a second tooltipAnchor component on the same group. Both join to
      // `[data-tooltip-anchor]` over data.nodes, so the second one reuses the first one's
      // rects and overwrites their transforms rather than adding any. Only the final
      // position is observable from here; what the DOM shows is that there are four
      // anchors, not eight, and that the sankey's centred position is the one that wins
      // over bar's default top-centre.
      const node = render(sankeyOf(), testData);
      expect(all(node, "nodes", "[data-tooltip-anchor]").length).toBe(4);
      // bar's own default would be translate(10,0) for the first node
      expect(anchors(node, "nodes")[0]).toBe("translate(10,15)");
    });

    test("should keep the link anchors in data order while the paths are sorted", () => {
      // NOTE: the anchors are joined after the paths have been reordered, and against the
      // unsorted data.links array, so anchor order and path order diverge. Nothing reads
      // the anchors positionally, so this is only surprising when debugging the DOM.
      const node = render(sankeyOf(), testData);
      expect(attrs(node, "links", "path.sszvis-link", "stroke-width")).toEqual([
        "5",
        "5",
        "10",
        "20",
      ]);
      expect(anchors(node, "links")[0]).toBe("translate(60,10)");
    });
  });

  describe("node labels", () => {
    const labels = (node: Element) => all(node, "nodelabels", "text.sszvis-sankey-node-label");

    test("should render one label per node, using the id by default", () => {
      const node = render(sankeyOf(), testData);
      expect(labels(node).map((l) => l.textContent)).toEqual(["A", "B", "C", "D"]);
    });

    test("should map the id through nameLabel", () => {
      const node = render(
        sankeyOf().nameLabel((id: string) => id.toLowerCase()),
        testData
      );
      expect(labels(node).map((l) => l.textContent)).toEqual(["a", "b", "c", "d"]);
    });

    test("should place the labels left of the nodes by default", () => {
      const node = render(sankeyOf(), testData);
      expect(labels(node).map((l) => l.getAttribute("text-anchor"))).toEqual([
        "end",
        "end",
        "end",
        "end",
      ]);
      // xPosition - 6
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["-6", "-6", "94", "94"]);
    });

    test("should centre the labels vertically on their node", () => {
      const node = render(sankeyOf(), testData);
      // yPosition + height / 2
      expect(labels(node).map((l) => l.getAttribute("y"))).toEqual(["15", "45", "12.5", "42.5"]);
    });

    test("should place right-side labels beyond the far edge of the node", () => {
      const node = render(sankeyOf().labelSide("right"), testData);
      expect(labels(node).map((l) => l.getAttribute("text-anchor"))).toEqual([
        "start",
        "start",
        "start",
        "start",
      ]);
      // xPosition + nodeThickness + 6
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["26", "26", "126", "126"]);
    });

    test("should choose the side per column", () => {
      const node = render(
        sankeyOf().labelSide((i: number) => (i === 0 ? "left" : "right")),
        testData
      );
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["-6", "-6", "126", "126"]);
    });

    test("should swap both sides when labelSideSwitch is set", () => {
      const node = render(
        sankeyOf()
          .labelSide((i: number) => (i === 0 ? "left" : "right"))
          .labelSideSwitch(true),
        testData
      );
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["26", "26", "94", "94"]);
    });

    test("should treat any side other than 'left' as 'right'", () => {
      // NOTE: the check is `=== "left"`, so a typo or an unexpected value silently lands the
      // label on the right rather than raising anything.
      const node = render(sankeyOf().labelSide("outside"), testData);
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["26", "26", "126", "126"]);
    });

    test("should invert an unrecognised side too, turning it into 'left'", () => {
      // NOTE: labelSideSwitch maps anything that is not "left" to "left", so the switch
      // makes an unrecognised value behave like the left side.
      const node = render(sankeyOf().labelSide("outside").labelSideSwitch(true), testData);
      expect(labels(node).map((l) => l.getAttribute("x"))).toEqual(["-6", "-6", "94", "94"]);
    });

    test("should default labelOpacity to 1 and accept a constant or an accessor", () => {
      const dflt = render(sankeyOf(), testData);
      expect(
        all<SVGTextElement>(dflt, "nodelabels", "text.sszvis-sankey-node-label")[0].style.opacity
      ).toBe("1");

      const constant = render(sankeyOf().labelOpacity(0), testData);
      expect(
        all<SVGTextElement>(constant, "nodelabels", "text.sszvis-sankey-node-label").map(
          (l) => l.style.opacity
        )
      ).toEqual(["0", "0", "0", "0"]);

      const accessor = render(
        sankeyOf().labelOpacity((n: Node) => (n.columnIndex === 0 ? 1 : 0.5)),
        testData
      );
      expect(
        all<SVGTextElement>(accessor, "nodelabels", "text.sszvis-sankey-node-label").map(
          (l) => l.style.opacity
        )
      ).toEqual(["1", "1", "0.5", "0.5"]);
    });

    test("should apply labelOpacity to the node labels, not to the column labels", () => {
      // BUG: labelOpacity is documented as "the opacity of the column labels ... to hide
      // them when they would overlap with user-triggered hover labels", but it is applied to
      // the node labels and the column labels never receive an opacity at all. Anyone
      // following the documentation to fade the column headers out on hover fades the node
      // names instead, and cannot touch the headers.
      // current: the node labels carry the opacity. expected: the column labels do, per the
      // documentation - or the documentation says "node labels".
      const node = render(sankeyOf().columnLabel("Total").labelOpacity(0.25), testData);
      expect(
        all<SVGTextElement>(node, "nodelabels", "text.sszvis-sankey-node-label").map(
          (l) => l.style.opacity
        )
      ).toEqual(["0.25", "0.25", "0.25", "0.25"]);
      expect(
        all<SVGTextElement>(node, "nodes", "text.sszvis-sankey-column-label").map(
          (l) => l.style.opacity
        )
      ).toEqual(["", ""]);
    });

    test("should set an inert text-align attribute on every label", () => {
      // NOTE: `text-align` is a CSS property for flow content and has no meaning as an SVG
      // attribute; SVG uses `text-anchor`, which the component sets on the next line. The
      // attribute is written on every label and does nothing.
      const node = render(sankeyOf(), testData);
      expect(labels(node).map((l) => l.getAttribute("text-align"))).toEqual([
        "middle",
        "middle",
        "middle",
        "middle",
      ]);
    });
  });

  describe("label hit boxes", () => {
    const boxes = (node: Element) => all(node, "nodelabels", "rect.sszvis-sankey-hitbox");

    test("should render one transparent box per node", () => {
      const node = render(sankeyOf(), testData);
      expect(boxes(node).length).toBe(4);
      expect(boxes(node).map((b) => b.getAttribute("fill"))).toEqual([
        "transparent",
        "transparent",
        "transparent",
        "transparent",
      ]);
    });

    test("should cover the node and the gap to its neighbours by default", () => {
      const node = render(sankeyOf(), testData);
      // y - nodePadding / 2, height + nodePadding: adjacent boxes tile exactly
      expect(boxes(node).map((b) => b.getAttribute("y"))).toEqual(["-5", "35", "-5", "30"]);
      expect(boxes(node).map((b) => b.getAttribute("height"))).toEqual(["40", "20", "35", "25"]);
      // labelHitBoxSize defaults to 0, so the box is only as wide as the node
      expect(boxes(node).map((b) => b.getAttribute("width"))).toEqual(["20", "20", "20", "20"]);
      expect(boxes(node).map((b) => b.getAttribute("x"))).toEqual(["0", "0", "100", "100"]);
    });

    test("should extend the box towards the label's side", () => {
      const left = render(sankeyOf().labelHitBoxSize(50), testData);
      expect(boxes(left).map((b) => b.getAttribute("x"))).toEqual(["-50", "-50", "50", "50"]);
      expect(boxes(left).map((b) => b.getAttribute("width"))).toEqual(["70", "70", "70", "70"]);

      const right = render(sankeyOf().labelHitBoxSize(50).labelSide("right"), testData);
      expect(boxes(right).map((b) => b.getAttribute("x"))).toEqual(["0", "0", "100", "100"]);
      expect(boxes(right).map((b) => b.getAttribute("width"))).toEqual(["70", "70", "70", "70"]);
    });

    test("should follow labelSideSwitch", () => {
      const node = render(sankeyOf().labelHitBoxSize(50).labelSideSwitch(true), testData);
      expect(boxes(node).map((b) => b.getAttribute("x"))).toEqual(["0", "0", "100", "100"]);
    });

    test("should give every box the same width, whatever its node's value", () => {
      // NOTE: the width is a plain number, labelHitBoxSize + nodeThickness, not an accessor.
      // Every hit box is the same width regardless of the label it covers, which is why the
      // property is documented as "the width of the widest label".
      const node = render(sankeyOf().labelHitBoxSize(33), testData);
      expect(new Set(boxes(node).map((b) => b.getAttribute("width")))).toEqual(new Set(["53"]));
    });
  });

  describe("link labels", () => {
    const sourceLabels = (node: Element) =>
      all(node, "linklabels", "text.sszvis-sankey-link-source-label");
    const targetLabels = (node: Element) =>
      all(node, "linklabels", "text.sszvis-sankey-link-target-label");

    test("should render nothing when no link label data is given", () => {
      const node = render(sankeyOf(), testData);
      expect(sourceLabels(node).length).toBe(0);
      expect(targetLabels(node).length).toBe(0);
    });

    test("should render one source label per entry in linkSourceLabels", () => {
      const data = makeData();
      const node = render(
        sankeyOf()
          .linkSourceLabels([data.links[0], data.links[1]])
          .linkLabel((l: Link) => String(l.value)),
        data
      );
      expect(sourceLabels(node).map((l) => l.textContent)).toEqual(["20", "10"]);
    });

    test("should place source labels just right of the curve's start", () => {
      const data = makeData();
      const node = render(sankeyOf().linkSourceLabels([data.links[0]]).linkLabel("x"), data);
      // curveStart + 6, startLevel
      expect(sourceLabels(node)[0].getAttribute("transform")).toBe("translate(27,10)");
    });

    test("should place target labels just left of the curve's end", () => {
      const data = makeData();
      const node = render(sankeyOf().linkTargetLabels([data.links[1]]).linkLabel("x"), data);
      // curveEnd - 6, endLevel
      expect(targetLabels(node)[0].getAttribute("transform")).toBe("translate(93,40)");
    });

    test("should accept a constant linkLabel", () => {
      const data = makeData();
      const node = render(sankeyOf().linkSourceLabels(data.links).linkLabel("flow"), data);
      expect(sourceLabels(node).map((l) => l.textContent)).toEqual([
        "flow",
        "flow",
        "flow",
        "flow",
      ]);
    });

    test("should render both ends of the same link", () => {
      const data = makeData();
      const node = render(
        sankeyOf()
          .linkSourceLabels([data.links[0]])
          .linkTargetLabels([data.links[0]])
          .linkLabel((l: Link) => String(l.value)),
        data
      );
      expect(sourceLabels(node).map((l) => l.textContent)).toEqual(["20"]);
      expect(targetLabels(node).map((l) => l.textContent)).toEqual(["20"]);
    });

    test("should leave the text unset when no linkLabel is given", () => {
      const data = makeData();
      const node = render(sankeyOf().linkSourceLabels([data.links[0]]), data);
      expect(sourceLabels(node)[0].textContent).toBe("");
    });

    test("should label a link that is not part of data.links", () => {
      // NOTE: the label data is used as given and never checked against data.links, so a
      // stale link object still renders a label - positioned from its own src and tgt, and
      // so at a place where no link is drawn at all.
      const data = makeData();
      const orphan = data.links[0];
      const node = render(sankeyOf().linkSourceLabels([orphan]).linkLabel("orphan"), {
        ...data,
        links: [data.links[1]],
      });
      expect(all(node, "links", "path.sszvis-link").length).toBe(1);
      expect(sourceLabels(node).map((l) => l.textContent)).toEqual(["orphan"]);
    });
  });

  describe("re-rendering", () => {
    test("should render in place rather than appending duplicates", () => {
      const component = sankeyOf();
      const g = group("rerender");
      g.datum(testData).call(component as never);
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="nodes"]').length).toBe(1);
      expect(all(node, "nodes", "rect.sszvis-bar").length).toBe(4);
      expect(all(node, "links", "path.sszvis-link").length).toBe(4);
      expect(all(node, "nodes", "[data-tooltip-anchor]").length).toBe(4);
      expect(all(node, "nodelabels", "text.sszvis-sankey-node-label").length).toBe(4);
    });

    test("should update the geometry when the data changes", () => {
      const component = sankeyOf();
      const g = group("update");
      g.datum(makeData()).call(component as never);
      const next = makeData();
      next.nodes[0].value = 60;
      g.datum(next).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")[0]).toBe("60");
    });

    test("should remove elements when the data shrinks", () => {
      const component = sankeyOf();
      const g = group("shrink");
      const data = makeData();
      g.datum(data).call(component as never);
      g.datum({
        nodes: [data.nodes[0]],
        links: [data.links[0]],
        columnLengths: [1],
      }).call(component as never);
      const node = g.node() as SVGGElement;
      expect(all(node, "nodes", "rect.sszvis-bar").length).toBe(1);
      expect(all(node, "links", "path.sszvis-link").length).toBe(1);
      expect(all(node, "nodes", "text.sszvis-sankey-column-label").length).toBe(1);
      expect(all(node, "nodelabels", "text.sszvis-sankey-node-label").length).toBe(1);
      expect(all(node, "nodelabels", "rect.sszvis-sankey-hitbox").length).toBe(1);
    });

    test("should move the nodes to their new geometry without animating", () => {
      // NOTE: the sankey never sets bar's transition property, so it keeps bar's default of
      // true - and that transition does not animate anything (see test/component/bar.test.ts
      // and the note in bar.ts). The new geometry is on the rects on the same tick as the
      // re-render. It is not free either: a d3 transition is still created and discarded on
      // every node rect on every render.
      const component = sankeyOf();
      const g = group("no-animation");
      g.datum(makeData()).call(component as never);
      const next = makeData();
      next.nodes[0].value = 90;
      g.datum(next).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")[0]).toBe("90");
    });

    test("should match nodes by index, not by id", () => {
      // NOTE: the nodes are handed to bar, whose join is unkeyed, so rect identity follows
      // the array index: a reordered node array does not move any element, it rewrites the
      // attributes in place and each rect ends up bound to a different node. That matters
      // for anything holding on to a rect - a transition, a hover handler - and it goes
      // unnoticed here only because bar's transition does not actually animate. The links,
      // which are keyed by id, do not behave this way.
      const component = sankeyOf();
      const g = group("node-reorder");
      const data = makeData();
      g.datum(data).call(component as never);
      const node = g.node() as SVGGElement;
      const first = all(node, "nodes", "rect.sszvis-bar")[0];

      g.datum({ ...data, nodes: [...data.nodes].reverse() }).call(component as never);
      expect(all(node, "nodes", "rect.sszvis-bar")[0]).toBe(first);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")).toEqual(["15", "25", "10", "30"]);
    });
  });

  describe("required props", () => {
    test("should throw when sizeScale is missing", () => {
      expect(() =>
        render(
          sankey()
            .columnPosition((i: number) => i * 100)
            .nodeThickness(20)
            .nodePadding(10)
            .columnPadding(0),
          testData
        )
      ).toThrow(TypeError);
    });

    test("should throw when columnPosition is missing", () => {
      expect(() =>
        render(
          sankey()
            .sizeScale((v: number) => v)
            .nodeThickness(20)
            .nodePadding(10)
            .columnPadding(0),
          testData
        )
      ).toThrow(TypeError);
    });

    test("should throw when columnPadding is missing", () => {
      // columnPadding has no default even though it is wrapped in fn.functor, so the
      // renderer calls undefined as a function.
      expect(() =>
        render(
          sankey()
            .sizeScale((v: number) => v)
            .columnPosition((i: number) => i * 100)
            .nodeThickness(20)
            .nodePadding(10),
          testData
        )
      ).toThrow(TypeError);
    });

    test("should throw when the data has no columnLengths", () => {
      // NOTE: the error comes out of d3's data join, so it names neither the property nor
      // the component: "undefined is not iterable".
      expect(() => render(sankeyOf(), { nodes: [], links: [] })).toThrow(TypeError);
    });

    test("should throw when the data has no nodes", () => {
      expect(() => render(sankeyOf(), { links: [], columnLengths: [] })).toThrow(TypeError);
    });

    describe("known quirks", () => {
      test("silently renders invisible nodes when nodeThickness is missing", () => {
        // BUG: nodeThickness is required but unguarded. Math.max(undefined, 1) is NaN, which
        // bar's missing-value guard turns into 0, so every node bar is zero-width. The
        // column labels and hit boxes are not guarded and end up with NaN coordinates in the
        // DOM instead. Nothing warns.
        // current: bars width="0", label transform="translate(NaN,-24)", hit box
        // width="NaN", and every node's tooltip anchor at translate(NaN,...) - so the
        // tooltips lose their position too. expected: an error naming the missing prop.
        const node = render(
          sankey()
            .sizeScale((v: number) => v)
            .columnPosition((i: number) => i * 100)
            .nodePadding(10)
            .columnPadding(0),
          testData
        );
        expect(attrs(node, "nodes", "rect.sszvis-bar", "width")).toEqual(["0", "0", "0", "0"]);
        expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")[0]).toBe(
          "translate(NaN,-24)"
        );
        expect(attrs(node, "nodelabels", "rect.sszvis-sankey-hitbox", "width")[0]).toBe("NaN");
        expect(anchors(node, "nodes")[0]).toBe("translate(NaN,15)");
      });

      test("silently stacks every node at the top when nodePadding is missing", () => {
        // BUG: same shape as nodeThickness. undefined * nodeIndex is NaN, so every node's
        // position floors to NaN and bar's guard turns it into 0: the whole column collapses
        // onto one row. The hit boxes, which are not guarded, get y="NaN" instead.
        // current: every bar at y="0". expected: an error naming the missing prop.
        const node = render(
          sankey()
            .sizeScale((v: number) => v)
            .columnPosition((i: number) => i * 100)
            .nodeThickness(20)
            .columnPadding(0),
          testData
        );
        expect(attrs(node, "nodes", "rect.sszvis-bar", "y")).toEqual(["0", "0", "0", "0"]);
        expect(attrs(node, "nodelabels", "rect.sszvis-sankey-hitbox", "y")[0]).toBe("NaN");
      });

      test("throws when nameLabel is given a constant", () => {
        // NOTE: nameLabel is the only label accessor that must be a function - it is not
        // wrapped in fn.functor, so a string throws "props.nameLabel is not a function".
        // Its JSDoc does document it as {Function} where columnLabel and linkLabel are
        // {String, Function}, so the code matches its own documentation; it is the odd one
        // out against the library's idiom rather than a defect.
        expect(() => render(sankeyOf().nameLabel("Total"), testData)).toThrow(TypeError);
      });

      test("silently collapses the nodes when nodeThickness is given a function", () => {
        // BUG: the mirror image of nameLabel. nodeThickness, nodePadding, labelHitBoxSize
        // and linkCurvature are plain numbers, so an accessor - the shape most other
        // properties in this library accept - is used in arithmetic and yields NaN, which
        // bar's guard turns into a zero-width bar and the unguarded paths turn into NaN
        // geometry.
        // current: bars width="0" and no warning. expected: either support the accessor or
        // report the type.
        const node = render(
          sankeyOf().nodeThickness(() => 20),
          testData
        );
        expect(attrs(node, "nodes", "rect.sszvis-bar", "width")).toEqual(["0", "0", "0", "0"]);

        const curved = render(
          sankeyOf().linkCurvature(() => 0.5),
          testData
        );
        expect(attrs(curved, "links", "path.sszvis-link", "d")[3]).toBe(
          "M21,10CNaN,10 NaN,10 99,10"
        );
      });

      test("does not guard the link paths against missing values", () => {
        // BUG: the nodes go through bar, which guards every geometry value against NaN,
        // while the link path string is assembled here by hand from the size scale's
        // output. A scale that returns NaN for one value - a d3 scale fed undefined, a gap
        // in the data - poisons both the path string and the stroke width, and the browser
        // silently drops that link while its node still renders.
        // current: d="M21,NaNC60,NaN 60,NaN 99,NaN" and stroke-width="NaN", nothing logged.
        // expected: the bad link is reported, since coercing it to 0 would draw a link that
        // is merely wrong instead of one that is missing.
        const node = render(
          sankeyOf().sizeScale((v: number) => (v === 20 ? Number.NaN : v)),
          testData
        );
        expect(attrs(node, "links", "path.sszvis-link", "d")[3]).toContain("NaN");
        expect(attrs(node, "links", "path.sszvis-link", "stroke-width")[3]).toBe("NaN");
      });

      test("throws when a link has no src or tgt reference", () => {
        // NOTE: a link's geometry is read off the node objects it points at, not off
        // data.nodes, so a node missing from data.nodes changes nothing about its links -
        // see "should remove elements when the data shrinks" above, where a link keeps
        // pointing at a dropped node and still renders. What does throw is a link whose src
        // or tgt reference is itself missing, and the message names neither the link nor
        // the component: "Cannot read properties of undefined (reading 'columnIndex')".
        const data = makeData();
        const broken = { ...data.links[0], src: undefined } as unknown as Link;
        expect(() => render(sankeyOf(), { ...data, links: [broken] })).toThrow(TypeError);
      });
    });
  });

  describe("known quirks", () => {
    test("does not clamp linkCurvature", () => {
      // NOTE: the curvature is documented as "should be between 0 and 1" but is never
      // checked. At 1 the control points swap ends - the source's control point sits at the
      // target's x and vice versa - which still keeps the curve inside the column gap, just
      // as a pronounced S. Above 1 the control points leave the gap altogether and the
      // curve swings out past both columns.
      const node = render(sankeyOf().linkCurvature(1), testData);
      expect(attrs(node, "links", "path.sszvis-link", "d")[2]).toBe("M21,25C99,25 21,40 99,40");
      const beyond = render(sankeyOf().linkCurvature(2), testData);
      expect(attrs(beyond, "links", "path.sszvis-link", "d")[2]).toBe("M21,25C177,25 -57,40 99,40");
    });

    test("keeps a one pixel gap between nodes and links that cannot be configured", () => {
      // NOTE: linkPadding is a local constant, deliberately so per its comment. It means
      // the links never quite touch the nodes, and the gap does not scale with the chart.
      const node = render(sankeyOf(), testData);
      const d = attrs(node, "links", "path.sszvis-link", "d")[3] ?? "";
      // The source node's right edge is at 0 + 20, the curve starts at 21
      expect(d.startsWith("M21,")).toBe(true);
      // The target node's left edge is at 100, the curve ends at 99
      expect(d.endsWith("99,10")).toBe(true);
    });

    test("draws the links from nodeThickness, not from the rendered bar width", () => {
      // NOTE: the node bars are floored at one pixel wide by Math.max(nodeThickness, 1),
      // but the link start is computed from the raw nodeThickness. At nodeThickness 0 the
      // bar spans 0 to 1 and the link starts at 1, so the intended one pixel gap is
      // swallowed by the floored bar; a negative thickness pulls the link's start inside
      // the bar and further left with every unit. Only reachable below a thickness of one,
      // and computeLayout always returns 20, so this is a note rather than a bug.
      const node = render(sankeyOf().nodeThickness(0), testData);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "width")[0]).toBe("1");
      expect(attrs(node, "links", "path.sszvis-link", "d")[3]?.startsWith("M1,")).toBe(true);
    });

    test("centres the column labels on nodeThickness rather than on the drawn bar", () => {
      // NOTE: the same guarded/unguarded split as above, on the label side. columnLabelX uses
      // nodeThickness / 2, so with a nodeThickness of 0 the label sits on the column's left
      // edge while the bar is drawn one pixel wide.
      const node = render(sankeyOf().nodeThickness(0), testData);
      expect(attrs(node, "nodes", "text.sszvis-sankey-column-label", "transform")[0]).toBe(
        "translate(0,-24)"
      );
    });

    test("ignores nodePadding when spacing links inside a node", () => {
      // NOTE: a node's own height is sizeScale(value), and its links are stacked inside it
      // using sizeScale(offset), so the links exactly fill the node. nodePadding applies
      // only between nodes. Worth knowing when reading the link levels: they are relative
      // to the node's floored top edge, and so inherit its rounding.
      const node = render(sankeyOf(), testData);
      const widths = attrs(node, "links", "path.sszvis-link", "stroke-width");
      expect(widths.reduce((sum, w) => sum + Number(w), 0)).toBe(40);
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height").slice(0, 2)).toEqual(["30", "10"]);
    });

    test("glues the links to the floored node position but not to the ceiled node height", () => {
      // NOTE: a node's box is snapped to whole pixels - the position floored, the height
      // ceiled - while the links stacked inside it keep the size scale's raw output. The
      // links do start from the same floored position as the bar, so they stay glued to its
      // top edge, but the stack can finish up to a pixel short of the bar's bottom edge.
      const node = render(
        sankeyOf().sizeScale((v: number) => v * 1.05),
        makeData()
      );
      // Node A: y = floor(0) = 0, height = ceil(31.5) = 32, so the bar's bottom edge is 32
      expect(attrs(node, "nodes", "rect.sszvis-bar", "y")[0]).toBe("0");
      expect(attrs(node, "nodes", "rect.sszvis-bar", "height")[0]).toBe("32");
      // Its second link is centred at 26.25 and 10.5 thick, so it ends at 31.5 - half a
      // pixel above the bar it hangs off
      expect(attrs(node, "links", "path.sszvis-link", "d")[2]).toBe(
        "M21,26.25C60,26.25 60,41.25 99,41.25"
      );
      expect(attrs(node, "links", "path.sszvis-link", "stroke-width")[2]).toBe("10.5");
    });

    test("works with the data and layout the layout module computes", () => {
      // An integration check that the component's expectations still match what
      // layout.sankey produces, since neither module validates the other's output.
      const prepared = prepareData()
        .source((d: { from: string }) => d.from)
        .target((d: { to: string }) => d.to)
        .value((d: { value: number }) => d.value)
        .idLists([
          ["A", "B"],
          ["C", "D"],
        ])
        .apply([
          { from: "A", to: "C", value: 20 },
          { from: "A", to: "D", value: 10 },
          { from: "B", to: "C", value: 5 },
        ]);

      const layout = computeLayout(prepared.columnLengths, prepared.columnTotals, 300, 400);
      const node = render(
        sankey()
          .sizeScale((v: number) => v * 2)
          .columnPosition((i: number) => i * 100)
          .nodeThickness(layout.nodeThickness)
          .nodePadding(layout.nodePadding)
          .columnPadding((i: number) => layout.columnPaddings[i]),
        prepared
      );
      expect(all(node, "nodes", "rect.sszvis-bar").length).toBe(4);
      expect(all(node, "links", "path.sszvis-link").length).toBe(3);
      expect(all(node, "nodes", "text.sszvis-sankey-column-label").length).toBe(2);
      expect(
        all(node, "nodelabels", "text.sszvis-sankey-node-label").map((l) => l.textContent)
      ).toEqual(["A", "C", "D", "B"]);
    });
  });
});
