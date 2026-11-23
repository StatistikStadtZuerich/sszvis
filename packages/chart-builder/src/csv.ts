import { csvFormatRows, dsvFormat } from "d3-dsv";
import { Option, Schema } from "effect";

import {
  ColumnName,
  type ColumnKind,
  type ColumnKinds,
  type DateFormat,
  type RoleKind,
} from "./spec";

export type Table = {
  readonly columns: readonly ColumnName[];
  readonly rows: readonly (readonly string[])[];
};

const DELIMITERS = { comma: ",", semicolon: ";", tab: "\t" } as const;

export type DelimiterName = keyof typeof DELIMITERS;

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
  /* A loop, not a spread: a long table is more arguments than Math.max can take. */
  let width = header.length;
  for (const cells of body) width = Math.max(width, cells.length);
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

const SWISS_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{1,4})$/;
const YEAR = /^\d{1,4}$/;

/* A year under 100 is that year, not the 1900s the `Date` constructor assumes. */
const at = (year: number, month: number, day: number): Date => {
  const date = new Date(year, month, day);
  date.setFullYear(year);
  return date;
};

export const parseAs = (format: DateFormat, value: string): Option.Option<Date> => {
  if (format === "year") {
    return YEAR.test(value) ? Option.some(at(Number(value), 0, 1)) : Option.none();
  }
  const match = SWISS_DATE.exec(value);
  if (match === null) return Option.none();
  const [, day = "", month = "", year = ""] = match;
  return Option.some(at(Number(year), Number(month) - 1, Number(day)));
};

/** The notation a set of values shares, if they share one. */
export const dateFormatOf = (values: readonly string[]): DateFormat | undefined => {
  if (values.length === 0) return undefined;
  if (values.every((value) => Option.isSome(parseAs("swiss", value)))) return "swiss";
  if (values.every((value) => Option.isSome(parseAs("year", value)))) return "year";
  return undefined;
};

export const rolledOver = (
  table: Table,
  column: ColumnName,
): readonly { readonly value: string; readonly on: Date }[] => {
  const index = table.columns.indexOf(column);
  if (index === -1) return [];
  return valuesOf(table, index).flatMap((value) => {
    const match = SWISS_DATE.exec(value);
    const on = Option.getOrNull(parseAs("swiss", value));
    if (match === null || on === null) return [];
    const [, day = "", month = ""] = match;
    const moved = on.getDate() !== Number(day) || on.getMonth() !== Number(month) - 1;
    return moved ? [{ value, on }] : [];
  });
};

const decodeFinite = Schema.decodeOption(Schema.FiniteFromString);

const valuesOf = (table: Table, index: number) =>
  table.rows.map((row) => row[index] ?? "").filter((value) => value !== "");

const admits = (values: readonly string[], kind: ColumnKind): boolean => {
  if (kind === "nominal") return true;
  if (values.length === 0) return false;
  return kind === "temporal"
    ? dateFormatOf(values) !== undefined
    : values.every((value) => Option.isSome(decodeFinite(value)));
};

export const valuesIn = (table: Table, column: ColumnName): readonly string[] =>
  valuesOf(table, table.columns.indexOf(column));

export const hasValues = (table: Table, column: ColumnName): boolean =>
  valuesIn(table, column).length > 0;

/*
 * The values a column offers as a choice, deduplicated, in the order they first appear.
 *
 * Order is the column's own, because that is the order the chart will show: a control's
 * options come from `sszvis.set`, which does not sort, so sorting here would describe a
 * chart nobody is going to see. Blanks are dropped, as they are everywhere else in this
 * file - a row with no value in this column is not a choice, and the emitted chart filters
 * it out for the same reason.
 */
export const distinctValues = (table: Table, column: ColumnName): readonly string[] => [
  ...new Set(valuesIn(table, column)),
];

export const detectedKinds = (table: Table): ReadonlyMap<string, ColumnKind> => {
  const kinds = new Map<string, ColumnKind>();
  for (const [index, column] of table.columns.entries()) {
    const values = valuesOf(table, index);
    const kind: ColumnKind =
      dateFormatOf(values) === "swiss"
        ? "temporal"
        : admits(values, "continuous")
          ? "continuous"
          : "nominal";
    kinds.set(column, kind);
  }
  return kinds;
};

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
