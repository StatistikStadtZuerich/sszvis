import { csvFormatRows, dsvFormat } from "d3-dsv";
import { Option, Schema } from "effect";

import { ColumnName, RoleKind } from "./spec";

export type Table = {
  readonly columns: readonly ColumnName[];
  readonly rows: readonly (readonly string[])[];
};

const DELIMITERS = { comma: ",", semicolon: ";", tab: "\t" } as const;

export type DelimiterName = keyof typeof DELIMITERS;

export const DELIMITER_LABELS = {
  comma: "Comma",
  semicolon: "Semicolon",
  tab: "Tab",
} satisfies Record<DelimiterName, string>;

const rowsOf = (text: string, name: DelimiterName): readonly (readonly string[])[] =>
  dsvFormat(DELIMITERS[name])
    .parseRows(text.replace(/^\ufeff/, ""))
    .map((cells) => cells.map((cell) => cell.trim()))
    .filter((cells) => cells.length > 1 || cells[0] !== "");

export const detectDelimiter = (text: string): DelimiterName => {
  const sample = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(0, 5)
    .join("\n");
  let best: DelimiterName = "comma";
  let widest = 1;
  for (const name of ["comma", "semicolon", "tab"] as const) {
    const rows = rowsOf(sample, name);
    const header = rows[0];
    if (header === undefined) continue;
    if (rows.every((cells) => cells.length === header.length) && header.length > widest) {
      best = name;
      widest = header.length;
    }
  }
  return best;
};

const headed = (rows: readonly (readonly string[])[]): Table => {
  const [header, ...body] = rows;
  if (header === undefined) return { columns: [], rows: [] };
  return {
    columns: header.map((value) => ColumnName.make(value)),
    rows: body.map((cells) => header.map((_, index) => cells[index] ?? "")),
  };
};

/** A table whose first row names the columns, read with a known separator. */
export const parseDelimited = (text: string, name: DelimiterName): Table =>
  headed(rowsOf(text, name));

export const parse = (csv: string): Table => parseDelimited(csv, "comma");

export const parseBlock = (text: string): readonly (readonly string[])[] =>
  rowsOf(text, detectDelimiter(text));

export const serialize = (table: Table): string => {
  return csvFormatRows([table.columns, ...table.rows].map((cells) => [...cells]));
};

export type ColumnKind = typeof RoleKind.Type;

export const fitRank = (column: ColumnKind, role: ColumnKind): number | null => {
  if (column === role) return 0;
  if (role !== "category") return null;
  return column === "date" ? 1 : 2;
};

/** `dd.mm.yyyy`, which is what `sszvis.parseDate` reads. */
const SWISS_DATE = /^\d{1,2}\.\d{1,2}\.\d{4}$/;

/* `Number(...)` would admit "Infinity", whose comparator then returns NaN. */
const decodeFinite = Schema.decodeUnknownOption(Schema.FiniteFromString);

export const columnKinds = (table: Table): ReadonlyMap<string, ColumnKind> => {
  const kinds = new Map<string, ColumnKind>();
  for (const [index, column] of table.columns.entries()) {
    const values = table.rows.map((row) => row[index] ?? "").filter((value) => value !== "");
    if (values.length === 0) {
      kinds.set(column, "category");
    } else if (values.every((value) => SWISS_DATE.test(value))) {
      kinds.set(column, "date");
    } else if (values.every((value) => Option.isSome(decodeFinite(value)))) {
      kinds.set(column, "number");
    } else {
      kinds.set(column, "category");
    }
  }
  return kinds;
};

export type SortDirection = "asc" | "desc";

export const sortOrder = (
  table: Table,
  column: number,
  direction: SortDirection,
): readonly number[] => {
  const kind = columnKinds(table).get(table.columns[column] ?? "") ?? "category";
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

export const sortRows = (table: Table, column: number, direction: SortDirection): Table =>
  reorder(table, sortOrder(table, column, direction));

const collator = new Intl.Collator("de-CH", { numeric: true, sensitivity: "base" });

/** `dd.mm.yyyy` to a sortable `yyyymmdd` number. */
const dateKey = (value: string) => {
  const [day = "", month = "", year = ""] = value.split(".");
  return Number(year.padStart(4, "0") + month.padStart(2, "0") + day.padStart(2, "0"));
};

const compareByKind = (kind: ColumnKind, a: string, b: string): number => {
  switch (kind) {
    case "number":
      return Number(a) - Number(b);
    case "date":
      return dateKey(a) - dateKey(b);
    case "category":
      return collator.compare(a, b);
  }
};
