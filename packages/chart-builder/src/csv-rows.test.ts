import { csvParse } from "d3-dsv";
import { describe, expect, test } from "vitest";

import { ColumnName } from "./spec";
import { detectDelimiter, parse, parseBlock, parseDelimited, serialize, type Table } from "./csv";

/* The builder holds the table as a CSV string in the form, so every keystroke goes
   through serialize -> parse. A row lost here is a row lost under the user's caret. */
const roundTrip = (table: Table): Table => parse(serialize(table));

describe("a one-column table", () => {
  test("should keep an emptied cell as a row rather than deleting the row", () => {
    const table: Table = { columns: [ColumnName.make("Sektor")], rows: [["a"], [""], ["b"]] };
    expect(roundTrip(table)).toEqual(table);
  });

  test("should keep a row appended at the end, which is what 'Add row' does", () => {
    const table: Table = { columns: [ColumnName.make("Sektor")], rows: [["a"], [""]] };
    expect(roundTrip(table)).toEqual(table);
  });

  test("should keep every row when the whole table is emptied", () => {
    const table: Table = { columns: [ColumnName.make("Sektor")], rows: [[""], [""], [""]] };
    expect(roundTrip(table)).toEqual(table);
  });

  test("should export a data.csv that d3 reads back cell for cell", () => {
    const csv = serialize({ columns: [ColumnName.make("Sektor")], rows: [["a"], [""], ["b"]] });
    expect(csvParse(csv).map((row) => row["Sektor"])).toEqual(["a", "", "b"]);
  });
});

describe("a multi-column table", () => {
  test("should round-trip an empty row unchanged", () => {
    const table: Table = {
      columns: [ColumnName.make("a"), ColumnName.make("b")],
      rows: [
        ["1", "2"],
        ["", ""],
      ],
    };
    expect(roundTrip(table)).toEqual(table);
    expect(serialize(table)).toBe("a,b\n1,2\n,");
  });

  test("should not quote empty cells, leaving the export as it was", () => {
    expect(
      serialize({ columns: [ColumnName.make("a"), ColumnName.make("b")], rows: [["", "z"]] }),
    ).not.toContain('""');
  });

  /* A wider table's empty row is written as its bare delimiters, so a blank line in the
     saved CSV is padding from somewhere else and stays droppable. */
  test("should drop a blank line in the saved CSV", () => {
    expect(parse("a,b\n\n1,2").rows).toEqual([["1", "2"]]);
  });

  test("should still quote a field carrying the delimiter", () => {
    const table: Table = {
      columns: [ColumnName.make("a"), ColumnName.make("b")],
      rows: [["x,y", "z"]],
    };
    expect(serialize(table)).toContain('"x,y"');
    expect(roundTrip(table)).toEqual(table);
  });
});

describe("reading a file in", () => {
  test("should drop blank lines, which are layout and not rows", () => {
    expect(parseDelimited("a,b\n1,2\n\n3,4\n", "comma").rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
    expect(parseBlock("1\n\n2")).toEqual([["1"], ["2"]]);
  });

  test("should widen the header to the widest row instead of dropping the surplus", () => {
    const table = parseDelimited("a,b,c\n1,2,3,4\n5,6,7", "comma");
    expect(table.columns).toEqual(["a", "b", "c", "Spalte 4"]);
    expect(table.rows).toEqual([
      ["1", "2", "3", "4"],
      ["5", "6", "7", ""],
    ]);
  });

  /* The empty name is the builder's "unmapped" sentinel and duplicates collapse onto
     one column, so a widened name has to stay clear of the ones the file already uses. */
  test("should keep a widened name clear of one the file already uses", () => {
    expect(parseDelimited("a,Spalte 2\n1,2,3", "comma").columns).toEqual([
      "a",
      "Spalte 2",
      "Spalte 3",
    ]);
  });
});

describe("reading the saved table back", () => {
  test("should widen the header without renaming the columns the user typed", () => {
    const table = parse("a,,c\n1,2,3,4");
    expect(table.columns).toEqual(["a", "", "c", "Spalte 4"]);
    expect(table.rows).toEqual([["1", "2", "3", "4"]]);
  });

  test("should round-trip a widened table so the surplus column survives editing", () => {
    expect(roundTrip(parse("a,b,c\n1,2,3,4"))).toEqual(parse("a,b,c\n1,2,3,4"));
  });
});

/* A blank line and an explicit empty value both parse to one empty cell, so only the
   text tells them apart - everything below turns on that distinction. */
describe("blank lines against empty values", () => {
  test("should read an explicit empty value as a row on every way in", () => {
    const text = serialize({ columns: [ColumnName.make("Sektor")], rows: [["a"], [""], ["b"]] });
    expect(parseDelimited(text, "comma").rows).toEqual([["a"], [""], ["b"]]);
    expect(parse(text).rows).toEqual([["a"], [""], ["b"]]);
    expect(parseBlock('a\n""\nb')).toEqual([["a"], [""], ["b"]]);
  });

  test("should still drop the blank lines a file carries between its rows", () => {
    expect(parseDelimited("a,b\n\n1,2", "comma").rows).toEqual([["1", "2"]]);
  });

  test("should leave a blank line that belongs to a quoted field alone", () => {
    expect(parseDelimited('a,b\n"x\n\ny",2', "comma").rows).toEqual([["x\n\ny", "2"]]);
  });

  test("should judge the separator without counting a blank-ish row", () => {
    expect(detectDelimiter('Jahr;Art;Anzahl\n2018;Zuzug;265\n""\n2019;Zuzug;268')).toBe(
      "semicolon",
    );
  });
});

describe("surplus columns", () => {
  test("should step a widened name past one the header already uses", () => {
    /* `parse` may not rename what the user typed, so it moves the name it invents. */
    expect(parse("a,Spalte 3\n1,2,3").columns).toEqual(["a", "Spalte 3", "Spalte 4"]);
  });

  test("should keep every cell of a row wider than its one-column header", () => {
    expect(serialize({ columns: [ColumnName.make("a")], rows: [["", "keepme"]] })).toContain(
      "keepme",
    );
  });
});
