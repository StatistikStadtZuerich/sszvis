import { Schema } from "effect";

import type { Fragments, Scalars } from "./emit";

/** What a recipe needs of a column, and what kind of value positions an annotation. */
export const RoleKind = Schema.Literals(["category", "number", "date"]);

export type RoleKind = typeof RoleKind.Type;

/*
 * What the data in a column is, which is a different question from what a chart
 * wants of it - and the one the user may overrule. The two vocabularies are
 * deliberately separate: a recipe asks for something it can put on a discrete
 * scale, never for "nominal" specifically, so a finer measurement level added
 * here later costs no recipe an opinion. `fitRank` maps one to the other.
 *
 * The names are measurement levels rather than the shapes they happen to take
 * today, which leaves `ordinal` beside `nominal` and `discrete` beside
 * `continuous` as additions rather than migrations. `continuous` covers whole
 * numbers too until `discrete` earns its place by changing something.
 */
export const ColumnKind = Schema.Literals(["nominal", "continuous", "temporal"]);

export type ColumnKind = typeof ColumnKind.Type;

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
export const GEO = RoleKey.make("geo");
export const GEO_LABEL = RoleKey.make("geoLabel");

export const Fields = Schema.Record(RoleKey, ColumnName);

export type Fields = typeof Fields.Type;

/** The columns whose kind the user has pinned, by name. Absent means "as detected". */
export const ColumnKinds = Schema.Record(ColumnName, ColumnKind);

export type ColumnKinds = typeof ColumnKinds.Type;

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
  /*
   * Where the user overruled the detector, and nowhere else. Sparse on purpose:
   * detection stays live for every column not named here, so a column whose
   * values change is re-read unless someone pinned it. Materialising every
   * column instead would make each of the table editor's mutation paths a place
   * the spec could come to describe columns that no longer exist.
   *
   * `identity.ts` hashes the whole spec, so pinning a column does invalidate the
   * compile - but a pin cannot reach emitted code, so the rebuild is
   * byte-identical. That costs one recompile and changes nothing the reader sees.
   */
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

/** One value a choice option offers: what the chart is given, and what the reader is shown. */
const Choice = Schema.Struct({
  value: Schema.String,
  label: Schema.String,
});

export type Choice = typeof Choice.Type;

const Option = Schema.Struct({
  key: OptionKey,
  label: Schema.String,
  fallback: Schema.String,
  /*
   * The values this option accepts, when it is a fixed set rather than free text.
   * A map's geography is the case that needs it: it decides which topology the
   * chart loads and which layer it reads, so a typed value would mean a blank map
   * rather than a wrong label. Absent means any text, which is every other option.
   */
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

/**
 * A file the chart loads besides its data. A map needs one: its geometry lives in
 * a TopoJSON file, which is far too large to inline into the code the reader is
 * meant to read, and is published nowhere they could link to.
 */
export const Asset = Schema.Struct({
  /** The `config` key the chart reads the URL from, beside `data` and `id`. */
  key: Schema.String,
  /** The file's name in the exported bundle, which is what `config[key]` holds there. */
  path: Schema.String,
  /** Where the builder itself reads the bytes from. An app URL; the exported chart never sees it. */
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
  /*
   * The roles this recipe's tooltip can show, when that is fewer than all of them.
   * A grouped bar's tooltip describes a whole group, so it can name the group but
   * not one member's series or value - and the picker must not offer what the
   * emitted chain would silently drop. Absent means every role.
   */
  tooltipRoles: Schema.optional(Schema.Array(RoleKey)),
  defaultTooltip: Tooltip,
  annotationAxes: Schema.Array(AnnotationAxis),
  /*
   * Libraries the page must load for this recipe beyond d3 and sszvis. A map reads
   * `topojson.feature`, which sszvis does not bundle. Every other recipe declares
   * none, and the page is unchanged for them.
   */
  scripts: Schema.optional(Schema.Array(Schema.String)),
});

export type RecipeSummary = typeof RecipeSummary.Type;

export type Feature = FeatureSummary & {
  readonly fragments: Fragments;
  readonly scalars?: Scalars;
};

export type RecipeDef = Omit<RecipeSummary, "features"> & {
  readonly features: readonly FeatureKey[];
  /*
   * The extra files this spec's chart loads. A function because the answer depends
   * on the spec: a map's geography decides which topology it needs.
   */
  readonly assets?: (spec: Spec, option: (key: OptionKey) => string) => readonly Asset[];
  /*
   * `kind` answers what a column holds, the user's pin included. No recipe reads
   * it yet. It is in the signature because `spec.kinds` is sparse - a recipe
   * cannot resolve a column's kind from the spec alone without re-deriving
   * detection - so the first recipe that needs to emit differently per kind would
   * otherwise have to change this type and all eight call sites to get at one.
   * Date-format selection is the case that will want it.
   */
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
