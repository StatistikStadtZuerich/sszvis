/**
 * What the table editor does to a table as the user works on it: naming and renaming
 * columns, cycling a column's kind, sorting rows. None of it reaches the emitted chart,
 * which reads the table through `@sszvis/chart-builder/csv`, so it stays with the editor rather than
 * with the code the builder shares.
 */
import {
  columnKinds,
  distinctName,
  type DelimiterName,
  type Table,
} from "@sszvis/chart-builder/csv";
import type { ColumnKind, ColumnKinds, ColumnName } from "@sszvis/chart-builder/spec";

export const DELIMITER_LABELS = {
  comma: "Comma",
  semicolon: "Semicolon",
  tab: "Tab",
} satisfies Record<DelimiterName, string>;

export const renameKind = (kinds: ColumnKinds, from: ColumnName, to: ColumnName): ColumnKinds => {
  const pinned = kinds[from];
  if (pinned === undefined || from === to) return kinds;
  const { [from]: _moved, ...rest } = kinds;
  return { ...rest, [to]: pinned };
};

export const settleColumn = (
  table: Table,
  column: number,
  from: ColumnName,
  kinds: ColumnKinds,
) => {
  const taken = new Set(table.columns.filter((_, index) => index !== column));
  const settled = distinctName(table.columns[column] ?? "", taken, column);
  return {
    table: {
      ...table,
      columns: table.columns.map((name, index) => (index === column ? settled : name)),
    },
    kinds: renameKind(kinds, from, settled),
  };
};

export const addedName = (columns: readonly ColumnName[]): ColumnName =>
  distinctName("", new Set(columns), columns.length);

const NEXT = {
  nominal: "continuous",
  continuous: "temporal",
  temporal: "nominal",
} satisfies Record<ColumnKind, ColumnKind>;

export const nextKind = (kind: ColumnKind): ColumnKind => NEXT[kind];

export type SortDirection = "asc" | "desc";

export const sortOrder = (
  table: Table,
  column: number,
  direction: SortDirection,
  overrides: ColumnKinds,
): readonly number[] => {
  const kind = columnKinds(table, overrides).get(table.columns[column] ?? "") ?? "nominal";
  const sign = direction === "asc" ? 1 : -1;
  const compare = (a: string, b: string) => {
    if (a === "") return b === "" ? 0 : 1;
    if (b === "") return -1;
    return sign * compareByKind(kind, a, b);
  };
  return table.rows
    .map((cells, index) => ({ cells, index }))
    .sort((a, b) => compare(a.cells[column] ?? "", b.cells[column] ?? "") || a.index - b.index)
    .map(({ index }) => index);
};

export const reorder = (table: Table, order: readonly number[]): Table => ({
  ...table,
  rows: order
    .map((index) => table.rows[index])
    .filter((cells): cells is readonly string[] => cells !== undefined),
});

export const sortRows = (
  table: Table,
  column: number,
  direction: SortDirection,
  overrides: ColumnKinds,
): Table => reorder(table, sortOrder(table, column, direction, overrides));

const collator = new Intl.Collator("de-CH", { numeric: true, sensitivity: "base" });

/** `dd.mm.yyyy` to a sortable `yyyymmdd` number. */
const dateKey = (value: string) => {
  const [day = "", month = "", year = ""] = value.split(".");
  return Number(year.padStart(4, "0") + month.padStart(2, "0") + day.padStart(2, "0"));
};

const compareByKind = (kind: ColumnKind, a: string, b: string): number => {
  switch (kind) {
    case "continuous":
      return Number(a) - Number(b);
    case "temporal":
      return dateKey(a) - dateKey(b);
    case "nominal":
      return collator.compare(a, b);
  }
};
