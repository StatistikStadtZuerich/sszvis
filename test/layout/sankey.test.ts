import { describe, expect, test, vi } from "vitest";
import type { SankeyLink } from "../../src/component/sankey.js";
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

/** The links of a prepared dataset, with the nulls invalid rows leave behind filtered out. */
const validLinks = (links: (SankeyLink | null)[]): SankeyLink[] =>
  links.filter((l): l is SankeyLink => l !== null);

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
      const links = validLinks(prepare().links);
      expect(links.map((l) => l.value)).toEqual([10, 5, 3]);
    });

    test("links point at the node objects, not at ids", () => {
      const { nodes, links } = prepare();
      expect(links[0]?.src).toBe(byId(nodes, "a"));
      expect(links[0]?.tgt).toBe(byId(nodes, "c"));
    });

    test("stacks the links within each node, ordered by the node they attach to", () => {
      const links = validLinks(prepare().links);
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

    test("gives every link a unique id", () => {
      const links = validLinks(prepare().links);
      expect(new Set(links.map((l) => l.id)).size).toBe(links.length);
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
  });

  describe("known quirks", () => {
    test("a link to an unknown id becomes a null entry in the links array", () => {
      // BUG: an unmatched source or target is warned about and the link is replaced by null,
      // but the null stays in the returned array. Any consumer iterating the links hits it.
      // got: links [null]
      // want: the invalid link dropped from the array.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { links } = prepare([{ from: "a", to: "nowhere", value: 1 }], COLUMNS);
      expect(links).toEqual([null]);
      warn.mockRestore();
    });

    test("two invalid links crash the value sort", () => {
      // BUG: the same nulls are then sorted by a comparator that reads `.value` off them, so
      // two or more invalid links throw a TypeError from inside prepareData. One invalid
      // link is survivable only because a one-element array is never compared.
      // got: TypeError: Cannot read properties of null
      // want: the invalid links dropped before the sort.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      expect(() =>
        prepare(
          [
            { from: "a", to: "nowhere", value: 1 },
            { from: "b", to: "nowhere", value: 2 },
          ],
          COLUMNS
        )
      ).toThrow(TypeError);
      warn.mockRestore();
    });

    test("link ids are handed out from a module-level counter", () => {
      // BUG: undocumented. The counter is shared by every prepareData instance in the page and never
      // resets, so link ids are unique but not stable between renders. Anything keying a
      // d3 join on a link id therefore sees a completely new set of keys on every update.
      const first = validLinks(prepare().links).map((l) => l.id);
      const second = validLinks(prepare().links).map((l) => l.id);
      expect(Math.min(...second)).toBeGreaterThan(Math.max(...first));
    });

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

    test("a non-numeric value silently becomes 0", () => {
      // BUG: `+value || 0` turns NaN into 0, so a malformed row is drawn as a zero-width
      // link rather than reported.
      // got: node value 0
      // want: a warning naming the row.
      const { nodes } = prepare(
        [{ from: "a", to: "c", value: "not a number" as unknown as number }],
        COLUMNS
      );
      expect(byId(nodes, "a")?.value).toBe(0);
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

    test("a single column gives an infinite column offset", () => {
      // BUG: columnXMultiplier divides by (numColumns - 1), so a one-column diagram gets an
      // Infinity range. Already reported as issue #120.
      // got: columnRange [0, Infinity]
      // want: [0, 0] for a single column.
      const single = computeLayout([2], [18], 400, 600);
      expect(single.columnRange).toEqual([0, Number.POSITIVE_INFINITY]);
    });

    test("a column of one node reports a padding it has no gap for", () => {
      // NOTE: harmless, though it reads alarmingly. A single-node column divides the padding
      // budget by zero gaps, giving Infinity, which the 50px cap turns into a normal-looking
      // 50px padding candidate. It cannot distort anything: 50 is the maximum the clamp
      // allows, so this candidate never wins the minimum unless every other column is at 50
      // already. The column keeps all its pixels either way, since (colLength - 1) is 0.
      const one = computeLayout([1, 1], [18, 18], 400, 600);
      expect(one.nodePadding).toBe(50);
      expect(one.valueRange[1]).toBe(400);

      // adding a one-node column beside a two-node one changes nothing about the two-node
      // column: it loses 50px to the gap it actually draws, exactly as it would alone
      const mixed = computeLayout([1, 2], [18, 18], 400, 600);
      const alone = computeLayout([2, 2], [18, 18], 400, 600);
      expect(mixed.nodePadding).toBe(alone.nodePadding);
      expect(mixed.valueRange).toEqual(alone.valueRange);

      // and a column that would compute a smaller padding still wins it
      expect(computeLayout([1, 20], [18, 18], 400, 600).nodePadding).toBe(12);
    });

    test("a layout with nothing in it at all poisons the value range", () => {
      // BUG: pixels-per-unit divides by the column total, so an empty column contributes
      // Infinity. Only when EVERY column is empty does that become the minimum, and the
      // value range is then [0, 0 * Infinity] = [0, NaN].
      // got: valueRange [0, NaN]
      // want: a zero-height layout.
      const empty = computeLayout([2, 2], [0, 0], 400, 600);
      expect(empty.valueRange[1]).toBeNaN();
      expect(empty.valueDomain).toEqual([0, 0]);

      // one empty column among populated ones is harmless: min ignores the Infinity
      const partial = computeLayout([2, 2], [18, 0], 400, 600);
      expect(partial.valueRange).toEqual(computeLayout([2, 2], [18, 18], 400, 600).valueRange);
    });

    test("the default accessors turn a row of objects into a null link", () => {
      // BUG: source, target and value all default to fn.identity, so without accessors the
      // raw row is looked up as a node id. For the object rows this layout is built around
      // that never matches, and every link is warned about and nulled; a second row then
      // crashes the sort. (Identity does work for a dataset of bare id strings, which is the
      // only reason this default is not immediately fatal.)
      // got: a silent all-null link list (or a TypeError once a second link exists)
      // want: the three required accessors validated up front.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const bare = prepareData().idLists(COLUMNS);
      expect(
        (bare as unknown as { apply: (d: Row[]) => { links: unknown[] } }).apply([LINKS[0] as Row])
          .links
      ).toEqual([null]);
      warn.mockRestore();
    });

    test("a link within one column is accepted and stacked normally", () => {
      // BUG: the JSDoc requires that no id is both a source and a target, but nothing checks
      // that the two ends of a link are in different columns. A same-column link is laid
      // out like any other and drawn as a chord that goes nowhere.
      // got: a link from a to b, both in column 0
      // want: a warning naming the link.
      const { links } = prepare([{ from: "a", to: "b", value: 4 }], COLUMNS);
      expect(links[0]?.src.columnIndex).toBe(0);
      expect(links[0]?.tgt.columnIndex).toBe(0);
    });

    test("a negative value is clamped away at the node but not at the link", () => {
      // BUG: node.value is Math.max(0, ...), so a negative flow disappears from the node,
      // but the link keeps its negative value and stacks the links after it backwards.
      // got: node value 0 with a link of value -5
      // want: negative values rejected.
      const prepared = prepare(
        [
          { from: "a", to: "c", value: -5 },
          { from: "a", to: "d", value: 2 },
        ],
        COLUMNS
      );
      const nodes = prepared.nodes;
      const links = validLinks(prepared.links);
      expect(byId(nodes, "a")?.value).toBe(0);
      expect(links.find((l) => l.tgt.id === "c")?.value).toBe(-5);
      // a is a zero-height node, yet its two links are stacked at 0 and 2 and the stack
      // ends at -3, so the links are drawn outside the node they belong to
      expect(links.find((l) => l.tgt.id === "d")?.srcOffset).toBe(0);
      expect(links.find((l) => l.tgt.id === "c")?.srcOffset).toBe(2);
    });

    test("no columns at all yields NaN everywhere", () => {
      // BUG: d3.min of an empty array is undefined, so every derived value is NaN, and the
      // column multiplier divides by -1.
      // got: { nodePadding: undefined, valueRange: [0, NaN] }
      // want: an explicit error, or an empty layout.
      const none = computeLayout([], [], 400, 600);
      expect(none.nodePadding).toBeUndefined();
      expect(none.valueRange[1]).toBeNaN();
      expect(none.columnRange[1]).toBe(-(600 - 20));
    });
  });
});
