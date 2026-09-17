import { Schema } from "effect";

import type { Fragments, Scalars } from "./emit";

export const RoleKind = Schema.Literals(["category", "number", "date"]);

export type RoleKind = typeof RoleKind.Type;

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

/* The two option keys the builder itself reads; every recipe declares both. */
export const TITLE = OptionKey.make("title");
export const DESCRIPTION = OptionKey.make("description");

/*
 * The role keys recipes share. A role means the same thing wherever it appears -
 * `VALUE` is the number a mark is sized by, whichever axis that lands on - so
 * switching chart type can carry what the user set over by role rather than by
 * position. Minting these locally would leave that agreement to spelling, and a
 * recipe that said `val` would silently keep nothing. A role peculiar to one
 * recipe still belongs in that recipe.
 */
export const CATEGORY = RoleKey.make("category");
export const VALUE = RoleKey.make("value");
export const DATE = RoleKey.make("date");
export const SERIES = RoleKey.make("series");

export const Fields = Schema.Record(RoleKey, ColumnName);

export type Fields = typeof Fields.Type;

export const Tooltip = Schema.Struct({
  header: RoleKey,
  body: Schema.Array(RoleKey),
});

export type Tooltip = typeof Tooltip.Type;

/** Where a mark sits on screen. Recipes emit it; an annotation is not stated in these terms. */
export const Axis = Schema.Literals(["x", "y"]);

export type Axis = typeof Axis.Type;

export const Position = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("value"), value: Schema.String }),
  Schema.Struct({ kind: Schema.Literal("mean") }),
]);

export type Position = typeof Position.Type;

/*
 * A reference line names the role it marks, not the screen axis it lands on. The
 * two differ per recipe - a vertical bar chart puts its value on y, a horizontal
 * one puts the same value on x - so a line stated as "y" would mean something
 * different under each chart type, and switching between them would either move
 * the line or lose it. Stated as a role it means the same thing everywhere, and
 * the recipe's `annotationAxes` says which axis to draw it on.
 */
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
});

export type Spec = typeof Spec.Type;

const Role = Schema.Struct({
  key: RoleKey,
  label: Schema.String,
  kind: RoleKind,
  hint: Schema.String,
  optional: Schema.optional(Schema.Boolean),
});

const Option = Schema.Struct({
  key: OptionKey,
  label: Schema.String,
  fallback: Schema.String,
});

export type Option = typeof Option.Type;

const FeatureSummary = Schema.Struct({
  key: FeatureKey,
  label: Schema.String,
  hint: Schema.String,
  hidden: Schema.optional(Schema.Boolean),
});

export type FeatureSummary = typeof FeatureSummary.Type;

/**
 * One axis a recipe accepts annotations on: the role it carries, the screen axis
 * it draws on, the kind of value that positions a line there, and its label.
 */
const AnnotationAxis = Schema.Struct({
  role: RoleKey,
  axis: Axis,
  kind: RoleKind,
  label: Schema.String,
});

export type AnnotationAxis = typeof AnnotationAxis.Type;

export const RecipeSummary = Schema.Struct({
  key: RecipeKey,
  label: Schema.String,
  roles: Schema.Array(Role),
  options: Schema.Array(Option),
  features: Schema.Array(FeatureSummary),
  sample: Schema.String,
  tooltipFeature: FeatureKey,
  /*
   * The roles this recipe's tooltip can show, when that is fewer than all of them.
   * A grouped bar's tooltip describes a whole group, so it can name the group but
   * not one member's series or value - and the picker must not offer what the
   * emitted chain would silently drop. Absent means every role.
   */
  tooltipRoles: Schema.optional(Schema.Array(RoleKey)),
  defaultTooltip: Tooltip,
  annotationAxes: Schema.Array(AnnotationAxis),
});

export type RecipeSummary = typeof RecipeSummary.Type;

export type Feature = FeatureSummary & {
  readonly fragments: Fragments;
  readonly scalars?: Scalars;
};

export type RecipeDef = Omit<RecipeSummary, "features"> & {
  readonly features: readonly FeatureKey[];
  readonly scalars: (spec: Spec, option: (key: OptionKey) => string) => Scalars;
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
