import { Schema } from "effect";

import type { Fragments, Scalars } from "./emit";

/** What a recipe needs of a column; also what kind of value positions an annotation. */
export const RoleKind = Schema.Literals(["category", "number", "date"]);

export type RoleKind = typeof RoleKind.Type;

/*
 * What the data in a column is, which is a different question from what a chart
 * wants of it - and the one the user may overrule. The two vocabularies are
 * deliberately separate: a recipe asks for a `category`, never for `nominal`
 * specifically, so a finer measurement level added here later costs no recipe an
 * opinion. `fitRank` maps one to the other.
 *
 * The names are measurement levels rather than the shapes they happen to take
 * today, which leaves `ordinal` beside `nominal` and `discrete` beside
 * `continuous` as additions rather than migrations. `continuous` covers whole
 * numbers too until `discrete` earns its place by changing something.
 */
export const ColumnKind = Schema.Literals(["nominal", "continuous", "temporal"]);

export type ColumnKind = typeof ColumnKind.Type;

/*
 * The kinds in the words the person building the chart uses, named once so the
 * table editor and the chart-type picker cannot come to say them differently. The
 * `ColumnKind` names are measurement levels, which belong in the types rather than
 * on a button or in a sentence about what a chart needs.
 */
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

export const Spec = Schema.Struct({
  recipe: RecipeKey,
  csv: Schema.String,
  fields: Fields,
  options: Schema.Record(OptionKey, Schema.String),
  features: Schema.Array(FeatureKey),
  tooltip: Tooltip,
  annotations: Schema.Array(Annotation),
  kinds: ColumnKinds,
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
});

export type Choice = typeof Choice.Type;

const Option = Schema.Struct({
  key: OptionKey,
  label: Schema.String,
  fallback: Schema.String,
  choices: Schema.optional(Schema.Array(Choice)),
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
    kind: (column: ColumnName) => ColumnKind,
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
