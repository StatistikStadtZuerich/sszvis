import { Option } from "effect";

import { columnKinds, distinctValues, parse, type Table } from "./csv";
import { str, type Scalars } from "./emit";
import { FeatureKey, type ColumnName, type Spec } from "./spec";

/** The hidden feature a resolving control switches on. */
export const CONTROLS_FEATURE = FeatureKey.make("controls");

/**
 * Where a button group stops reading as a row of buttons. Advisory: past this the chart is
 * crowded, not broken, and the reader is told rather than stopped. The library's own
 * `long-labels` example sits exactly here, at seven.
 */
export const CROWDED = 7;

/** A control that will actually be drawn, with the choices it will offer. */
export type ResolvedControl = {
  readonly column: ColumnName;
  readonly label: string;
  readonly values: readonly string[];
};

/**
 * The control this spec emits, if it emits one.
 *
 * A control survives in the spec after the column it names has been renamed away or the
 * table replaced, and one value is not a choice. Neither is worth failing a compile over -
 * the chart is still a chart without its control - so both resolve to nothing here and the
 * feature never switches on.
 */
export const resolveControl = (
  spec: Spec,
  table: Table = parse(spec.csv),
): Option.Option<ResolvedControl> => {
  const control = spec.control;
  if (control === null) return Option.none();

  /* A column renamed away or replaced with the table yields no values at all, which lands
     in the same place as one holding a single value: neither is a choice to offer. */
  const values = distinctValues(table, control.column);
  if (values.length < 2) return Option.none();

  const label = control.label.trim();
  return Option.some({
    column: control.column,
    /* The column names the dimension well enough to be the control's accessible name. */
    label: label === "" ? control.column : label,
    values,
  });
};

export const hasControl = (spec: Spec): boolean => Option.isSome(resolveControl(spec));

/**
 * The columns this table can be filtered on.
 *
 * A column already carrying a role is excluded: filtering by the axis a chart is drawn
 * along leaves one bar. Dates are excluded because their values reach the buttons as the
 * table wrote them, and `01.01.2018` is not a caption. A column with fewer than two
 * distinct values offers no choice.
 */
export const filterCandidates = (spec: Spec, table: Table): readonly ColumnName[] => {
  const bound = new Set(Object.values(spec.fields).filter((column) => column !== ""));
  const kinds = columnKinds(table, spec.kinds);
  return table.columns.filter(
    (column) =>
      !bound.has(column) &&
      kinds.get(column) !== "temporal" &&
      distinctValues(table, column).length >= 2,
  );
};

/**
 * The column and caption the emitted control reads, as source.
 *
 * Both are the reader's own text and both go through `str`, which is what keeps a column
 * named `"); alert(1); ("` a column name rather than a statement.
 */
export const controlFields = (spec: Spec): Scalars =>
  Option.match(resolveControl(spec), {
    onNone: () => ({ FILTER_FIELD: str(""), FILTER_LABEL: str("") }),
    onSome: (control) => ({
      FILTER_FIELD: str(control.column),
      FILTER_LABEL: str(control.label),
    }),
  });

/**
 * The control after a column has been renamed under it.
 *
 * A rename is the one edit that moves a column without replacing the table, so the control
 * follows it rather than being stranded - the same courtesy `renameKind` does for a pinned
 * kind. A label the author typed is theirs and stays; one left empty keeps naming the
 * column, so it follows the new name.
 */
export const renameControl = (
  control: Spec["control"],
  from: ColumnName,
  to: ColumnName,
): Spec["control"] =>
  control === null || control.column !== from || from === to ? control : { ...control, column: to };
