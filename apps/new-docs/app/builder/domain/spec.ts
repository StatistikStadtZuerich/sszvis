import { Schema } from "effect";

import type { Fragments, Scalars } from "./emit";

/** What a recipe needs of a column; also what kind of value positions an annotation. */
export const RoleKind = Schema.Literals(["category", "number", "date"]);

export type RoleKind = typeof RoleKind.Type;

export const ColumnKind = Schema.Literals(["nominal", "continuous", "temporal"]);

export type ColumnKind = typeof ColumnKind.Type;

export const DateFormat = Schema.Literals(["swiss", "year"]);

export type DateFormat = typeof DateFormat.Type;

/** What a recipe may ask about one of its columns as it emits. */
export type ColumnFacts = {
  readonly kind: ColumnKind;
  /** Absent unless the column is read as dates. */
  readonly dateFormat: DateFormat | undefined;
};

export const KIND_LABEL = {
  nominal: "text",
  continuous: "number",
  temporal: "date",
} satisfies Record<ColumnKind, string>;

export const RoleKey = Schema.String.pipe(Schema.brand("RoleKey"));

export type RoleKey = typeof RoleKey.Type;

export const ColumnName = Schema.String.pipe(Schema.brand("ColumnName"));

export type ColumnName = typeof ColumnName.Type;

export const FeatureKey = Schema.String.pipe(Schema.brand("FeatureKey"));

export type FeatureKey = typeof FeatureKey.Type;

export const RecipeKey = Schema.String.pipe(Schema.brand("RecipeKey"));

export type RecipeKey = typeof RecipeKey.Type;

export const OptionKey = Schema.String.pipe(Schema.brand("OptionKey"));

export type OptionKey = typeof OptionKey.Type;

export const TITLE = OptionKey.make("title");
export const DESCRIPTION = OptionKey.make("description");

export const CATEGORY = RoleKey.make("category");
export const VALUE = RoleKey.make("value");
export const DATE = RoleKey.make("date");
export const SERIES = RoleKey.make("series");
export const GEO = RoleKey.make("geo");
export const GEO_LABEL = RoleKey.make("geoLabel");

export const Fields = Schema.Record(RoleKey, ColumnName);

export type Fields = typeof Fields.Type;

export const ColumnKinds = Schema.Record(ColumnName, ColumnKind);

export type ColumnKinds = typeof ColumnKinds.Type;

export const Tooltip = Schema.Struct({
  header: RoleKey,
  body: Schema.Array(RoleKey),
});

export type Tooltip = typeof Tooltip.Type;

export const Axis = Schema.Literals(["x", "y"]);

export type Axis = typeof Axis.Type;

export const Position = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("value"), value: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("mean") }),
]);

export type Position = typeof Position.Type;

export const ReferenceLine = Schema.Struct({
  kind: Schema.Literal("reference-line"),
  role: RoleKey,
  at: Position,
  label: Schema.String,
});

export type ReferenceLine = typeof ReferenceLine.Type;

export const Annotation = Schema.Union([ReferenceLine]);

export type Annotation = typeof Annotation.Type;

/*
 * A control the reader drives the chart with. It names a COLUMN rather than a role: a role
 * would be bound by the search that fills the others, which would switch a control on for
 * a table that never asked for one.
 */
export const FilterControl = Schema.Struct({
  kind: Schema.Literal("filter"),
  column: ColumnName,
  label: Schema.String,
});

export type FilterControl = typeof FilterControl.Type;

export const Control = Schema.Union([FilterControl]);

export type Control = typeof Control.Type;

export const Spec = Schema.Struct({
  recipe: RecipeKey,
  csv: Schema.String,
  fields: Fields,
  options: Schema.Record(OptionKey, Schema.String),
  features: Schema.Array(FeatureKey),
  tooltip: Tooltip,
  annotations: Schema.Array(Annotation),
  /*
   * `null` rather than an absent key, so that the spec literals which build a chart from
   * scratch have to say what they mean about it, and so that a test comparing whole specs
   * sees the difference.
   */
  control: Schema.NullOr(Control),
  kinds: ColumnKinds,
  /*
   * The roles whose column the user picked themselves, as against the ones the
   * search guessed. Only these are carried when the chart type changes: a guess is
   * about the chart it was made for, and carrying one lets it take a column the new
   * chart wants for something else - a map whose area code is a number and whose
   * value is a number will hand the geometry the measure and draw nothing.
   */
  chosen: Schema.Array(RoleKey),
});

export type Spec = typeof Spec.Type;

const Role = Schema.Struct({
  key: RoleKey,
  label: Schema.String,
  kind: RoleKind,
  hint: Schema.String,
  optional: Schema.optional(Schema.Boolean),
});

const Choice = Schema.Struct({
  value: Schema.String,
  label: Schema.String,
  /*
   * Two things a choice can carry for the menu that shows it, both optional because most
   * options need neither: the name of the family it belongs to, which the menu groups by,
   * and the colours it stands for, which the menu draws as a swatch beside the name.
   */
  group: Schema.optional(Schema.String),
  swatch: Schema.optional(Schema.Array(Schema.String)),
});

export type Choice = typeof Choice.Type;

const Option = Schema.Struct({
  key: OptionKey,
  label: Schema.String,
  fallback: Schema.String,
  choices: Schema.optional(Schema.Array(Choice)),
  /*
   * A feature that does this option's job instead while it is on. The map's bubbles are
   * the one case: they move the value out of the areas and into the circles, and draw the
   * areas in a flat grey, so whichever colours were chosen stop reaching the chart. The
   * option keeps its value - it is the author's, and it comes back when the feature goes
   * off - but the panel has to say that nothing is coming of it.
   */
  supersededBy: Schema.optional(FeatureKey),
});

export type Option = typeof Option.Type;

const FeatureSummary = Schema.Struct({
  key: FeatureKey,
  label: Schema.String,
  hint: Schema.String,
  hidden: Schema.optional(Schema.Boolean),
});

export type FeatureSummary = typeof FeatureSummary.Type;

const AnnotationAxis = Schema.Struct({
  role: RoleKey,
  axis: Axis,
  kind: RoleKind,
  label: Schema.String,
});

export type AnnotationAxis = typeof AnnotationAxis.Type;

export const Asset = Schema.Struct({
  key: Schema.String,
  path: Schema.String,
  source: Schema.String,
});

export type Asset = typeof Asset.Type;

export const RecipeSummary = Schema.Struct({
  key: RecipeKey,
  label: Schema.String,
  roles: Schema.Array(Role),
  options: Schema.Array(Option),
  features: Schema.Array(FeatureSummary),
  sample: Schema.String,
  tooltipFeature: FeatureKey,
  tooltipRoles: Schema.optional(Schema.Array(RoleKey)),
  defaultTooltip: Tooltip,
  annotationAxes: Schema.Array(AnnotationAxis),
  scripts: Schema.optional(Schema.Array(Schema.String)),
});

export type RecipeSummary = typeof RecipeSummary.Type;

export type Feature = FeatureSummary & {
  readonly fragments: Fragments;
  readonly scalars?: Scalars;
};

export type RecipeDef = Omit<RecipeSummary, "features"> & {
  readonly features: readonly FeatureKey[];
  readonly assets?: (spec: Spec, option: (key: OptionKey) => string) => readonly Asset[];
  readonly scalars: (
    spec: Spec,
    option: (key: OptionKey) => string,
    column: (name: ColumnName) => ColumnFacts,
  ) => Scalars;
  readonly implied: (spec: Spec) => readonly FeatureKey[];
};

export type Recipe = Omit<RecipeDef, "features"> & {
  readonly template: string;
  readonly features: readonly Feature[];
};

export const optionValue = (options: readonly Option[], spec: Spec, key: OptionKey): string => {
  const chosen = spec.options[key];
  if (chosen !== undefined && chosen.trim() !== "") return chosen;
  return options.find((candidate) => candidate.key === key)?.fallback ?? "";
};

export const summarize: (recipe: Recipe) => RecipeSummary = Schema.decodeSync(RecipeSummary);
