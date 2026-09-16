import { csvFormatRows, dsvFormat } from "d3-dsv";
import { Option, Schema } from "effect";

import { escapeHtml } from "./host";
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
    .map((cells) => cells.map((cell) => cell.trim()));

/**
 * The blank lines a file carries between its rows. Dropping them is right for a file
 * being read in and wrong for the saved table, so it is done only where a file arrives
 * - and it is done to the text, because once parsed a blank line and an explicit empty
 * value (`""`) are the same single empty cell and only the text still tells them apart.
 * A quoted field may hold newlines of its own, so the scan steps over what it opens.
 */
const withoutBlankLines = (text: string): string => {
  const kept: string[] = [];
  let quoted = false;
  for (const line of text.split("\n")) {
    if (quoted || line.trim() !== "") kept.push(line);
    for (const character of line) if (character === '"') quoted = !quoted;
  }
  return kept.join("\n");
};

export const detectDelimiter = (text: string): DelimiterName => {
  const sample = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(0, 5)
    .join("\n");
  let best: DelimiterName = "comma";
  let widest = 1;
  for (const name of ["comma", "semicolon", "tab"] as const) {
    /* A row of one empty cell is a blank line or an empty value; either way it says
       nothing about the separator, and counting it would rule the right one out. */
    const rows = rowsOf(sample, name).filter((cells) => cells.length > 1 || cells[0] !== "");
    const header = rows[0];
    if (header === undefined) continue;
    if (rows.every((cells) => cells.length === header.length) && header.length > widest) {
      best = name;
      widest = header.length;
    }
  }
  return best;
};

/**
 * Every column downstream is addressed by its name alone, and the empty name is the
 * builder's "unmapped" sentinel - so a blank header cannot be picked and repeated
 * headers collapse onto one column. Both are given a distinct name as the table is
 * read in, before it is saved, so the names the user sees are the names in the CSV.
 */
/** A name for one column that is neither blank nor one another column already uses. */
export const distinctName = (
  value: string,
  taken: ReadonlySet<string>,
  index: number,
): ColumnName => {
  const base = value === "" ? `Spalte ${index + 1}` : value;
  let name = base;
  for (let n = 2; taken.has(name); n++) name = `${base} ${n}`;
  return ColumnName.make(name);
};

const named = (header: readonly string[]): ColumnName[] => {
  const taken = new Set<string>();
  return header.map((value, index) => {
    const name = distinctName(value, taken, index);
    taken.add(name);
    return name;
  });
};

const headed = (rows: readonly (readonly string[])[]): Table => {
  const [header, ...body] = rows;
  if (header === undefined) return { columns: [], rows: [] };
  /* A row may carry more fields than the header names, and the surplus is the user's
     data - so the header grows to the widest row rather than the body being clipped.
     The names given match the ones the table editor uses for a column it adds. */
  const width = Math.max(header.length, ...body.map((cells) => cells.length));
  /* A generated name steps past one the header already uses: `parse` may not rename what
     the user typed, so the only name it can move is the one it is inventing. */
  const taken = new Set(header);
  const columns = Array.from({ length: width }, (_, index) => {
    const given = header[index];
    if (given !== undefined) return ColumnName.make(given);
    let spare = `Spalte ${index + 1}`;
    for (let n = width + 1; taken.has(spare); n++) spare = `Spalte ${n}`;
    taken.add(spare);
    return ColumnName.make(spare);
  });
  return {
    columns,
    rows: body.map((cells) => columns.map((_, index) => cells[index] ?? "")),
  };
};

/** A table whose first row names the columns, read with a known separator. */
export const parseDelimited = (text: string, name: DelimiterName): Table => {
  const table = headed(rowsOf(withoutBlankLines(text), name));
  return { ...table, columns: named(table.columns) };
};

/**
 * The saved table, read back. Unlike an import this keeps the header cells exactly as
 * they stand: they are what the user last typed, and renaming one under the caret
 * would fight the editing - and name a column the saved CSV does not have. For the same
 * reason every row is kept, empty ones included: a row must not vanish under the caret.
 */
export const parse = (csv: string): Table => {
  const rows = rowsOf(csv, "comma");
  /* Past one column `serialize` writes an empty row as its bare delimiters, so a blank
     line there can only be padding. In a one-column table the two are the same text,
     and dropping it would delete the row the user just emptied or added. */
  return rows.some((cells) => cells.length > 1)
    ? headed(rowsOf(withoutBlankLines(csv), "comma"))
    : headed(rows);
};

export const parseBlock = (text: string): readonly (readonly string[])[] =>
  rowsOf(withoutBlankLines(text), detectDelimiter(text));

/**
 * A one-column table writes its empty cells as a quoted empty field. `csvFormatRows`
 * leaves such a line blank, and a blank last line is swallowed by the parser - so a row
 * the user just added would not survive the round trip the form makes on every
 * keystroke. The quoted form is ordinary CSV that `d3.csv` reads back as "".
 */
export const serialize = (table: Table): string => {
  const rows = [table.columns, ...table.rows];
  if (table.columns.length > 1) return csvFormatRows(rows.map((cells) => [...cells]));
  return rows
    .map((cells) => (cells.length === 1 && cells[0] === "" ? '""' : csvFormatRows([[...cells]])))
    .join("\n");
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

/**
 * The table's own text, made safe to draw in the preview. A chart installs its tooltip
 * and ruler labels as markup - sszvis's `modularText` interpolates without escaping -
 * which is fine for an exported chart, whose author trusts the data file it is given.
 * The preview frame is same-origin with the builder and is handed whatever was pasted
 * into the table, so its copy is escaped and the reader cannot catch themselves out.
 * Only the values: the headers are the keys the generated accessors read the rows by.
 */
export const harmlessValues = (csv: string): string => {
  const table = parse(csv);
  return serialize({ ...table, rows: table.rows.map((cells) => cells.map(escapeHtml)) });
};
