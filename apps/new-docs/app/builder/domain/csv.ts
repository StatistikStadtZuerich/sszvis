import { csvFormatRows, dsvFormat } from "d3-dsv";
import { Option, Schema } from "effect";

import { escapeHtml } from "./host";
import { ColumnName, type ColumnKind, type ColumnKinds, type RoleKind } from "./spec";

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
  const width = Math.max(header.length, ...body.map((cells) => cells.length));
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

export const parseDelimited = (text: string, name: DelimiterName): Table => {
  const table = headed(rowsOf(withoutBlankLines(text), name));
  return { ...table, columns: named(table.columns) };
};

export const parse = (csv: string): Table => {
  const rows = rowsOf(csv, "comma");
  return rows.some((cells) => cells.length > 1)
    ? headed(rowsOf(withoutBlankLines(csv), "comma"))
    : headed(rows);
};

export const parseBlock = (text: string): readonly (readonly string[])[] =>
  rowsOf(withoutBlankLines(text), detectDelimiter(text));

export const serialize = (table: Table): string => {
  const rows = [table.columns, ...table.rows];
  if (table.columns.length > 1) return csvFormatRows(rows.map((cells) => [...cells]));
  return rows
    .map((cells) => (cells.length === 1 && cells[0] === "" ? '""' : csvFormatRows([[...cells]])))
    .join("\n");
};

const NATURAL = {
  nominal: "category",
  continuous: "number",
  temporal: "date",
} satisfies Record<ColumnKind, RoleKind>;

export const REQUIRED = {
  category: "nominal",
  number: "continuous",
  date: "temporal",
} satisfies Record<RoleKind, ColumnKind>;

export const fitRank = (column: ColumnKind, role: RoleKind): number | null => {
  if (NATURAL[column] === role) return 0;
  if (role !== "category") return null;
  return column === "temporal" ? 1 : 2;
};

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

/** `dd.mm.yyyy`, which is what `sszvis.parseDate` reads. */
const SWISS_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

export const parseSwissDate = (value: string): Option.Option<Date> => {
  const match = SWISS_DATE.exec(value.trim());
  if (match === null) return Option.none();
  const [, day = "", month = "", year = ""] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isCalendarDay =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return isCalendarDay ? Option.some(date) : Option.none();
};

/* The value is already a string, so there is no unknown boundary to cross.
   `Number(...)` would admit "Infinity", whose comparator then returns NaN. */
const decodeFinite = Schema.decodeOption(Schema.FiniteFromString);

/** A column's values, blanks dropped - a blank says nothing about what a column holds. */
const valuesOf = (table: Table, index: number) =>
  table.rows.map((row) => row[index] ?? "").filter((value) => value !== "");

/**
 * Whether values could be read as a kind at all. Detection and the warning on a
 * pin are both this question - one asked of every kind, one asked of the kind the
 * user chose - so they answer it in the same place and cannot drift apart.
 */
const admits = (values: readonly string[], kind: ColumnKind): boolean => {
  /* Any value can serve as a label, so nothing ever fails to be nominal - and a
     column with nothing in it bears only that. `every` on no values is true, which
     would otherwise call an empty column a date and let a chart be built on it. */
  if (kind === "nominal") return true;
  if (values.length === 0) return false;
  return kind === "temporal"
    ? values.every((value) => Option.isSome(parseSwissDate(value)))
    : values.every((value) => Option.isSome(decodeFinite(value)));
};

/** Whether a column has anything in it to be read at all. */
export const hasValues = (table: Table, column: ColumnName): boolean =>
  valuesOf(table, table.columns.indexOf(column)).length > 0;

/** What each column looks like from its values alone, before anyone overrules it. */
export const detectedKinds = (table: Table): ReadonlyMap<string, ColumnKind> => {
  const kinds = new Map<string, ColumnKind>();
  for (const [index, column] of table.columns.entries()) {
    const values = valuesOf(table, index);
    /* The most particular reading the values bear; an empty column bears only the
       loosest, rather than being called a date on no evidence. */
    const kind: ColumnKind = admits(values, "temporal")
      ? "temporal"
      : admits(values, "continuous")
        ? "continuous"
        : "nominal";
    kinds.set(column, kind);
  }
  return kinds;
};

/**
 * The pinned columns whose values will not bear the pin - a column called a number
 * that holds words, or called a date that holds anything but `dd.mm.yyyy`.
 *
 * The pin stands: it is what the user said, and overruling it silently would fight
 * the editing. But a chart reading that column drops the rows it cannot parse, and
 * a chart that draws nothing is worth a word of warning first.
 */
export const unsupportedPins = (table: Table, kinds: ColumnKinds): ReadonlySet<string> => {
  const unsupported = new Set<string>();
  for (const [index, column] of table.columns.entries()) {
    const pinned = kinds[column];
    if (pinned !== undefined && !admits(valuesOf(table, index), pinned)) unsupported.add(column);
  }
  return unsupported;
};

export const bearsRole = (table: Table, column: ColumnName, role: RoleKind): boolean => {
  const index = table.columns.indexOf(column);
  /* Nothing is bound, so there is nothing to warn about. */
  if (index === -1) return true;
  return admits(valuesOf(table, index), REQUIRED[role]);
};

const NEXT = {
  nominal: "continuous",
  continuous: "temporal",
  temporal: "nominal",
} satisfies Record<ColumnKind, ColumnKind>;

export const nextKind = (kind: ColumnKind): ColumnKind => NEXT[kind];

export const columnKinds = (
  table: Table,
  overrides: ColumnKinds,
): ReadonlyMap<string, ColumnKind> => {
  const kinds = new Map(detectedKinds(table));
  for (const column of table.columns) {
    const pinned = overrides[column];
    if (pinned !== undefined) kinds.set(column, pinned);
  }
  return kinds;
};

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

export const harmlessValues = (csv: string): string => {
  const table = parse(csv);
  return serialize({ ...table, rows: table.rows.map((cells) => cells.map(escapeHtml)) });
};
