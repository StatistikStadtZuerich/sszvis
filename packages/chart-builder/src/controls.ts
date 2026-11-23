import { Option } from "effect";

import { columnKinds, distinctValues, parse, type Table } from "./csv";
import { code, str, type Scalars } from "./emit";
import { FeatureKey, type ColumnName, type Spec } from "./spec";

/** The hidden feature a resolving control switches on. */
export const CONTROLS_FEATURE = FeatureKey.make("controls");

/**
 * How many options a row of buttons can hold.
 *
 * Past this the chart takes a menu at every width instead. A button group divides its width
 * evenly but will not shrink a button below its own label, so a long list does not compress -
 * it runs off the side of the chart. The library's own `long-labels` example sits exactly
 * here, at seven, which is the most any example asks a row of buttons to carry.
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
 * A control survives in the spec after the column it names has stopped being one the panel
 * would offer: renamed away, the table replaced, left with one value, taken by a role or
 * pinned as a date. None of these is worth failing a compile over - the chart is still a
 * chart without its control - so all of them resolve to nothing here and the feature never
 * switches on. The test is `filterCandidates` itself, so the chart cannot filter on a
 * column the panel would refuse.
 */
export const resolveControl = (
  spec: Spec,
  table: Table = parse(spec.csv),
): Option.Option<ResolvedControl> => {
  const control = spec.control;
  if (control === null) return Option.none();
  if (!filterCandidates(spec, table).includes(control.column)) return Option.none();

  const values = distinctValues(table, control.column);

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

/** Which control the chart reaches for, as the breakpoint object `responsiveProps` wants. */
const RESPONSIVE = code(
  "{ palm: () => sszvis.selectMenu<string>, _: () => sszvis.buttonGroup<string> }",
);

/** A menu at every width, for a list no row of buttons can hold. */
const MENU_ONLY = code("{ _: () => sszvis.selectMenu<string> }");

/**
 * What the emitted control reads: its column, its caption, and which control to be.
 *
 * The column and the caption are the reader's own text and both go through `str`, which is
 * what keeps a column named `"); alert(1); ("` a column name rather than a statement.
 *
 * Which control to be is decided here rather than asked, because the count decides it. Up to
 * `CROWDED` values the chart shows buttons and falls back to a menu on a phone, where they
 * stop fitting side by side. Past that no width fits them, so it shows a menu everywhere.
 */
export const controlFields = (spec: Spec): Scalars =>
  Option.match(resolveControl(spec), {
    onNone: () => ({
      FILTER_FIELD: str(""),
      FILTER_LABEL: str(""),
      CONTROL_BREAKPOINTS: RESPONSIVE,
    }),
    onSome: (control) => ({
      FILTER_FIELD: str(control.column),
      FILTER_LABEL: str(control.label),
      CONTROL_BREAKPOINTS: control.values.length > CROWDED ? MENU_ONLY : RESPONSIVE,
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
