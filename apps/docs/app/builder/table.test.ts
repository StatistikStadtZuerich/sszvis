import { describe, expect, test } from "vitest";

import { parse } from "@sszvis/chart-builder/csv";
import { ColumnName } from "@sszvis/chart-builder/spec";
import {
  addedName,
  nextKind,
  renameKind,
  reorder,
  settleColumn,
  sortOrder,
  sortRows,
} from "./table";

const pin = (column: string, kind: "nominal" | "continuous" | "temporal") => ({
  [ColumnName.make(column)]: kind,
});

describe("sortRows", () => {
  test("should sort numbers numerically and text alphabetically, blanks last", () => {
    const table = parse("c,n\nb,10\n,2\na,9\nÄ,");
    expect(sortRows(table, 1, "asc", {}).rows.map((row) => row[1])).toEqual(["2", "9", "10", ""]);
    expect(sortRows(table, 1, "desc", {}).rows.map((row) => row[1])).toEqual(["10", "9", "2", ""]);
    expect(sortRows(table, 0, "asc", {}).rows.map((row) => row[0])).toEqual(["a", "Ä", "b", ""]);
  });

  test("should sort Swiss dates chronologically and keep ties in their original order", () => {
    const table = parse("d,x\n01.02.2021,first\n31.12.2020,second\n01.02.2021,third");
    expect(sortRows(table, 0, "asc", {}).rows.map((row) => row[1])).toEqual([
      "second",
      "first",
      "third",
    ]);
    expect(sortRows(table, 0, "desc", {}).rows.map((row) => row[1])).toEqual([
      "first",
      "third",
      "second",
    ]);
  });
});

describe("sortOrder", () => {
  const table = parse("Sektor,Anzahl\nGastgewerbe,20892\nBaugewerbe,17567\nHandel,42196");

  test("should return row indices rather than rows, so the table is untouched", () => {
    expect(sortOrder(table, 0, "asc", {})).toEqual([1, 0, 2]);
    expect(table.rows[0]?.[0]).toBe("Gastgewerbe");
  });

  test("should order an all-non-finite column deterministically, as text", () => {
    /* Numerically, `Infinity - Infinity` is NaN, which breaks the comparator. */
    expect(sortOrder(parse("v\nInfinity\n-Infinity\nInfinity"), 0, "asc", {})).toEqual([1, 0, 2]);
  });

  test("should agree with sorting the rows outright", () => {
    for (const direction of ["asc", "desc"] as const) {
      expect(reorder(table, sortOrder(table, 1, direction, {}))).toEqual(
        sortRows(table, 1, direction, {}),
      );
    }
  });

  test("should leave the table alone when reordered by its own order", () => {
    expect(reorder(table, [0, 1, 2])).toEqual(table);
  });

  test("should drop indices no row answers to, rather than emitting a hole", () => {
    expect(reorder(table, [2, 9]).rows).toEqual([["Handel", "42196"]]);
  });

  /* Dates, not digits: the numeric-aware collator already sorts plain digits like numbers. */
  test("should sort a column pinned as text by its text, not by the dates it holds", () => {
    const dates = parse("d\n01.02.2020\n10.01.2019\n05.03.2018");
    expect(sortOrder(dates, 0, "asc", {})).toEqual([2, 1, 0]);
    expect(sortOrder(dates, 0, "asc", pin("d", "nominal"))).toEqual([0, 2, 1]);
  });
});

describe("editing columns", () => {
  /* Mid-edit both headers read "Wert", so the pin must move by the edited column's previous name. */
  test("should move only the edited column's pin when its typed name collides with another", () => {
    const table = parse("Jahr,Wert\n1,2");
    const typed = { ...table, columns: [ColumnName.make("Wert"), ColumnName.make("Wert")] };
    const kinds = { ...pin("Jahr", "temporal"), ...pin("Wert", "nominal") };
    const next = settleColumn(typed, 0, ColumnName.make("Jahr"), kinds);
    expect(next.table.columns).toEqual(["Wert 2", "Wert"]);
    expect(next.kinds).toEqual({ "Wert 2": "temporal", Wert: "nominal" });
  });

  test("should name an added column distinctly from one the user has already typed", () => {
    const columns = [ColumnName.make("Spalte 2")];
    expect(addedName(columns)).toBe("Spalte 2 2");
    expect(addedName([...columns, addedName(columns)])).toBe("Spalte 3");
  });

  test("should move on by one and come back round when a column's kind is clicked", () => {
    expect(nextKind("nominal")).toBe("continuous");
    expect(nextKind("continuous")).toBe("temporal");
    expect(nextKind("temporal")).toBe("nominal");
  });

  test("should keep a pin under the column's new name when it is renamed", () => {
    const kinds = pin("Jahr", "nominal");
    expect(renameKind(kinds, ColumnName.make("Jahr"), ColumnName.make("Year"))).toEqual({
      Year: "nominal",
    });
    expect(renameKind(kinds, ColumnName.make("Anzahl"), ColumnName.make("Count"))).toEqual(kinds);
  });
});
