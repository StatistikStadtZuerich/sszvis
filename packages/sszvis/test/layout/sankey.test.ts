import { describe, expect, test, vi } from "vitest";
import { computeLayout, prepareData } from "../../src/layout/sankey.js";

type Row = { from: string; to: string; value: number };

const LINKS: Row[] = [
  { from: "a", to: "c", value: 10 },
  { from: "a", to: "d", value: 5 },
  { from: "b", to: "c", value: 3 },
];

const COLUMNS = [
  ["a", "b"],
  ["c", "d"],
];

const prepare = (data: Row[] = LINKS, columns: string[][] = COLUMNS) =>
  prepareData<Row>()
    .source((d: Row) => d.from)
    .target((d: Row) => d.to)
    .value((d: Row) => d.value)
    .idLists(columns)
    .apply(data);

const byId = <N extends { id: string }>(nodes: N[], id: string) => nodes.find((n) => n.id === id);

describe("layout/sankey", () => {
  describe("prepareData", () => {
    test("creates one node per id in the column lists", () => {
      const { nodes } = prepare();
      expect(nodes.map((n) => n.id).sort()).toEqual(["a", "b", "c", "d"]);
    });

    test("gives each node the value of its heavier side", () => {
      const { nodes } = prepare();
      // a sources 10 + 5 and targets nothing
      expect(byId(nodes, "a")?.value).toBe(15);
      expect(byId(nodes, "b")?.value).toBe(3);
      expect(byId(nodes, "c")?.value).toBe(13);
      expect(byId(nodes, "d")?.value).toBe(5);
    });

    test("records the column each node belongs to", () => {
      const { nodes } = prepare();
      expect(byId(nodes, "a")?.columnIndex).toBe(0);
      expect(byId(nodes, "d")?.columnIndex).toBe(1);
    });

    test("totals the values and counts the nodes of each column", () => {
      const { columnTotals, columnLengths } = prepare();
      expect(columnTotals).toEqual([18, 18]);
      expect(columnLengths).toEqual([2, 2]);
    });

    test("sorts the nodes by descending value across all columns", () => {
      const { nodes } = prepare();
      expect(nodes.map((n) => n.id)).toEqual(["a", "c", "d", "b"]);
    });

    test("sorts the nodes ascending when asked", () => {
      const data = prepareData<Row>()
        .source((d: Row) => d.from)
        .target((d: Row) => d.to)
        .value((d: Row) => d.value)
        .ascendingSort()
        .idLists(COLUMNS)
        .apply(LINKS);
      expect(data.nodes.map((n) => n.id)).toEqual(["b", "d", "c", "a"]);
    });

    test("stacks the nodes within their own column", () => {
      const { nodes } = prepare();
      // a is first in column 0, b second; c is first in column 1, d second
      expect(byId(nodes, "a")).toMatchObject({ nodeIndex: 0, valueOffset: 0 });
      expect(byId(nodes, "b")).toMatchObject({ nodeIndex: 1, valueOffset: 15 });
      expect(byId(nodes, "c")).toMatchObject({ nodeIndex: 0, valueOffset: 0 });
      expect(byId(nodes, "d")).toMatchObject({ nodeIndex: 1, valueOffset: 13 });
    });

    test("sorts the links by descending value so small ones paint last", () => {
      const links = prepare().links;
      expect(links.map((l) => l.value)).toEqual([10, 5, 3]);
    });

    test("links point at the node objects, not at ids", () => {
      const { nodes, links } = prepare();
      expect(links[0]?.src).toBe(byId(nodes, "a"));
      expect(links[0]?.tgt).toBe(byId(nodes, "c"));
    });

    test("stacks the links within each node, ordered by the node they attach to", () => {
      const links = prepare().links;
      const ac = links.find((l) => l.src.id === "a" && l.tgt.id === "c");
      const ad = links.find((l) => l.src.id === "a" && l.tgt.id === "d");
      const bc = links.find((l) => l.src.id === "b" && l.tgt.id === "c");
      // a's outgoing links stack in target order: c (nodeIndex 0) then d (nodeIndex 1)
      expect(ac?.srcOffset).toBe(0);
      expect(ad?.srcOffset).toBe(10);
      // c's incoming links stack in source order: a (nodeIndex 0) then b (nodeIndex 1)
      expect(ac?.tgtOffset).toBe(0);
      expect(bc?.tgtOffset).toBe(10);
    });

    test("gives the same links the same ids on every render", () => {
      // the component keys its link join on the id, so an id that changed between renders
      // would remove and re-add every path instead of transitioning it
      expect(prepare().links.map((l) => l.id)).toEqual(prepare().links.map((l) => l.id));
    });

    test("gives every link a unique id", () => {
      const links = prepare().links;
      expect(new Set(links.map((l) => l.id)).size).toBe(links.length);
    });

    test("warns about a link to an unknown id and drops it", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { links } = prepare([{ from: "a", to: "nowhere", value: 1 }], COLUMNS);
      expect(links).toEqual([]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("drops several invalid links without crashing the value sort", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const prepared = prepare(
        [
          { from: "a", to: "nowhere", value: 1 },
          { from: "b", to: "nowhere", value: 2 },
          { from: "a", to: "c", value: 3 },
        ],
        COLUMNS
      );
      expect(prepared.links.map((l) => l.value)).toEqual([3]);
      warn.mockRestore();
    });

    test("requires the source, target and value accessors", () => {
      const bare = prepareData().idLists(COLUMNS);
      expect(() =>
        (bare as unknown as { apply: (d: Row[]) => unknown }).apply([LINKS[0] as Row])
      ).toThrow(/source, target, value/);
    });

    test("warns about a value that is not a number and drops the link", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { links, nodes } = prepare(
        [{ from: "a", to: "c", value: "not a number" as unknown as number }],
        COLUMNS
      );
      expect(links).toEqual([]);
      expect(byId(nodes, "a")?.value).toBe(0);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("warns about a negative value and drops the link", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const prepared = prepare(
        [
          { from: "a", to: "c", value: -5 },
          { from: "a", to: "d", value: 2 },
        ],
        COLUMNS
      );
      // the surviving link fills its node exactly, rather than stacking outside a node whose
      // own value the negative link had already clamped to zero
      expect(prepared.links.map((l) => l.value)).toEqual([2]);
      expect(byId(prepared.nodes, "a")?.value).toBe(2);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("warns about a link within one column and drops it", () => {
      // a sankey link runs between columns; one that does not is drawn as a chord that goes
      // nowhere
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { links } = prepare([{ from: "a", to: "b", value: 4 }], COLUMNS);
      expect(links).toEqual([]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("coerces the link value to a number", () => {
      const { nodes } = prepare([{ from: "a", to: "c", value: "7" as unknown as number }], COLUMNS);
      expect(byId(nodes, "a")?.value).toBe(7);
    });
  });

  describe("computeLayout", () => {
    const layout = () => computeLayout([2, 2], [18, 18], 400, 600);

    test("pads the nodes by a sixth of the height, capped at 50px", () => {
      expect(layout().nodePadding).toBe(50);
    });

    test("keeps the padding within [12, 50]", () => {
      // a tall column of many nodes: 400 * 0.15 / 19 = 3.2, floored at 12
      expect(computeLayout([20, 20], [18, 18], 400, 600).nodePadding).toBe(12);
      // a short chart with two nodes: 100 * 0.15 / 1 = 15
      expect(computeLayout([2, 2], [18, 18], 100, 600).nodePadding).toBe(15);
    });

    test("scales the values to the space left over after padding", () => {
      const { valueRange, valueDomain } = layout();
      // 400 - 50 padding pixels = 350 for 18 units
      expect(valueDomain).toEqual([0, 18]);
      expect(valueRange).toEqual([0, 350]);
    });

    test("reports the padding in value units as well as pixels", () => {
      const { valuePadding, nodePadding } = layout();
      expect(nodePadding).toBe(50);
      expect(valuePadding).toBeCloseTo(50 / (350 / 18), 9);
    });

    test("centres the shorter columns vertically", () => {
      // column 1 carries half the value of column 0
      const { columnPaddings } = computeLayout([2, 2], [18, 9], 400, 600);
      expect(columnPaddings[0]).toBe(0);
      expect(columnPaddings[1]).toBeGreaterThan(0);
    });

    test("gives equal columns no vertical padding", () => {
      expect(layout().columnPaddings).toEqual([0, 0]);
    });

    test("spreads the columns across the width, leaving room for the last node", () => {
      const { columnRange, columnDomain, nodeThickness } = layout();
      expect(nodeThickness).toBe(20);
      expect(columnDomain).toEqual([0, 1]);
      expect(columnRange).toEqual([0, 600 - 20]);
    });

    test("the column range is per column step, not the total width", () => {
      const three = computeLayout([2, 2, 2], [18, 18, 18], 400, 600);
      expect(three.columnRange).toEqual([0, (600 - 20) / 2]);
    });

    test("a single column has no step at all", () => {
      // there is nothing to space out, so the column offset is 0 rather than a division by zero
      const single = computeLayout([2], [18], 400, 600);
      expect(single.columnRange).toEqual([0, 0]);
    });

    test("columns of one node draw no gaps, so they report no padding", () => {
      const one = computeLayout([1, 1], [18, 18], 400, 600);
      expect(one.nodePadding).toBe(0);
      expect(one.valueRange[1]).toBe(400);
    });

    test("a one-node column is left out of the padding minimum", () => {
      // it has no gap of its own, so it must not charge one to the columns that do
      const mixed = computeLayout([1, 2], [18, 18], 400, 600);
      const alone = computeLayout([2, 2], [18, 18], 400, 600);
      expect(mixed.nodePadding).toBe(alone.nodePadding);
      expect(mixed.valueRange).toEqual(alone.valueRange);
      // and a column that computes a smaller padding still wins it
      expect(computeLayout([1, 20], [18, 18], 400, 600).nodePadding).toBe(12);
    });

    test("a single node in a column still spreads the columns normally", () => {
      const oneNode = computeLayout([1, 1], [18, 18], 400, 600);
      expect(oneNode.columnRange).toEqual([0, 600 - 20]);
    });
  });

  describe("degenerate layouts", () => {
    test("a diagram with no values at all is zeroed", () => {
      const empty = computeLayout([2, 2], [0, 0], 400, 600);
      expect(empty.valueDomain).toEqual([0, 0]);
      expect(empty.valueRange).toEqual([0, 0]);
      expect(empty.nodePadding).toBe(0);
      expect(empty.valuePadding).toBe(0);
      expect(empty.columnPaddings).toEqual([0, 0]);
    });

    test("one empty column among populated ones changes nothing", () => {
      const partial = computeLayout([2, 2], [18, 0], 400, 600);
      expect(partial.valueRange).toEqual(computeLayout([2, 2], [18, 18], 400, 600).valueRange);
    });

    test("a diagram with no columns is zeroed", () => {
      expect(computeLayout([], [], 400, 600)).toEqual({
        valuePadding: 0,
        nodePadding: 0,
        columnPaddings: [],
        valueDomain: [0, 0],
        valueRange: [0, 0],
        nodeThickness: 20,
        columnDomain: [0, 1],
        columnRange: [0, 0],
      });
    });

    test("a diagram with no room is zeroed", () => {
      expect(computeLayout([2, 2], [18, 18], 0, 600).valueRange).toEqual([0, 0]);
      expect(computeLayout([2, 2], [18, 18], 400, 0).valueRange).toEqual([0, 0]);
    });

    test("a zeroed diagram zeroes its column range too", () => {
      // The multiplier is (columnWidth - nodeThickness) / (numColumns - 1), so a zero
      // columnWidth used to yield -20 here and place the second column to the left of a
      // container that has no room for either.
      expect(computeLayout([2, 2], [18, 18], 400, 0).columnRange).toEqual([0, 0]);
      expect(computeLayout([2, 2], [18, 18], 0, 600).columnRange).toEqual([0, 0]);
    });

    test("rejects a negative height or width", () => {
      expect(() => computeLayout([2, 2], [18, 18], -400, 600)).toThrow(/columnHeight/);
      expect(() => computeLayout([2, 2], [18, 18], 400, -600)).toThrow(/columnWidth/);
    });

    test("rejects a column length that is not a whole number of nodes", () => {
      expect(() => computeLayout([2, 2.5], [18, 18], 400, 600)).toThrow(/columnLengths/);
      expect(() => computeLayout([2, -1], [18, 18], 400, 600)).toThrow(/columnLengths/);
    });

    test("rejects a totals list that does not match the columns", () => {
      expect(() => computeLayout([2, 2], [18], 400, 600)).toThrow(/columnTotals/);
    });
  });

  describe("known quirks", () => {
    test("a duplicate id across columns overwrites the first node", () => {
      // NOTE: warned about, and documented as a requirement - all ids must be unique. The
      // node keeps only the later column, so its links appear in the wrong column.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { nodes } = prepare(LINKS, [
        ["a", "b"],
        ["c", "d", "a"],
      ]);
      expect(warn).toHaveBeenCalled();
      expect(nodes.filter((n) => n.id === "a")).toHaveLength(1);
      expect(byId(nodes, "a")?.columnIndex).toBe(1);
      warn.mockRestore();
    });

    test("prepareData overrides Function.prototype.apply", () => {
      // BUG: the builder exposes its own `apply(data)`, shadowing the built-in
      // Function.prototype.apply. Calling it the standard way silently misbehaves: the
      // first argument is treated as the dataset.
      // got: prepared.apply(null, [data]) prepares `null` and throws
      // want: a differently named method, e.g. calculate().
      const builder = prepareData<Row>()
        .source((d: Row) => d.from)
        .target((d: Row) => d.to)
        .value((d: Row) => d.value)
        .idLists(COLUMNS);
      expect(() => (builder.apply as (a: unknown, b: unknown) => unknown)(null, [LINKS])).toThrow();
    });
  });
});
