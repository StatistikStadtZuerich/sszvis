/**
 * @module @sszvis/mcp-server/chartTools
 *
 * The chart builder as MCP tools. The model calls `list_recipes` and `render_chart`; the
 * app calls `update_chart` to get the generated code and to apply the reader's edits, so
 * the code never lands in the model's context.
 */
import { Array, Effect, Layer, Schema } from "effect";
import { McpServer, Prompt, Tool, Toolkit } from "effect/ai";

import { harmlessValues, parse } from "@sszvis/chart-builder/csv";
import { makeGenerate } from "@sszvis/chart-builder/generate";
import {
  initialSpec,
  switchRecipe,
  unmappedRoles,
  unmetRoles,
} from "@sszvis/chart-builder/initial-spec";
import { findRecipe, recipes } from "@sszvis/chart-builder/recipes";
import { sampleFor, samples } from "@sszvis/chart-builder/samples";
import {
  Asset,
  ColumnName,
  FeatureKey,
  OptionKey,
  RecipeKey,
  RoleKey,
  Spec,
  summarize,
  RecipeSummary,
} from "@sszvis/chart-builder/spec";

import { appOnly, renderedBy } from "./mcpApp.ts";

export const CHART_APP_URI = "ui://sszvis/chart";

/** A tool input the model can correct: the message says what would have been valid. */
export class ChartInputError extends Schema.TaggedError<ChartInputError>()("ChartInputError", {
  message: Schema.String,
}) {}

const summaries = recipes.map(summarize);
const recipeKeys = summaries.map((summary) => summary.key);
const sampleKeys = samples.map((sample) => sample.key);

const list = (values: readonly string[]) => values.map((value) => `"${value}"`).join(", ");

// list_recipes ---------------------------------------------------------------

/** A recipe as the model and the app's controls need it: no swatches, no internals. */
const RecipeGuide = Schema.Struct({
  key: RecipeKey,
  label: Schema.String,
  sample: Schema.String,
  roles: Schema.Array(
    Schema.Struct({
      key: RoleKey,
      label: Schema.String,
      kind: Schema.String,
      hint: Schema.String,
      optional: Schema.Boolean,
    }),
  ),
  options: Schema.Array(
    Schema.Struct({
      key: OptionKey,
      label: Schema.String,
      fallback: Schema.String,
      choices: Schema.optional(
        Schema.Array(Schema.Struct({ value: Schema.String, label: Schema.String })),
      ),
    }),
  ),
  features: Schema.Array(
    Schema.Struct({ key: FeatureKey, label: Schema.String, hint: Schema.String }),
  ),
});
export type RecipeGuide = typeof RecipeGuide.Type;

const SampleGuide = Schema.Struct({
  key: Schema.String,
  label: Schema.String,
  columns: Schema.Array(Schema.String),
});

const guide = (summary: RecipeSummary): RecipeGuide => ({
  key: summary.key,
  label: summary.label,
  sample: summary.sample,
  roles: summary.roles.map((role) => ({
    key: role.key,
    label: role.label,
    kind: role.kind,
    hint: role.hint,
    optional: role.optional === true,
  })),
  options: summary.options.map((option) => ({
    key: option.key,
    label: option.label,
    fallback: option.fallback,
    ...(option.choices === undefined
      ? {}
      : { choices: option.choices.map(({ value, label }) => ({ value, label })) }),
  })),
  features: summary.features
    .filter((feature) => feature.hidden !== true)
    .map(({ key, label, hint }) => ({ key, label, hint })),
});

const RecipeList = Schema.Struct({
  recipes: Schema.Array(RecipeGuide),
  samples: Schema.Array(SampleGuide),
});
export type RecipeList = typeof RecipeList.Type;

const ListRecipes = Tool.make("list_recipes", {
  description:
    "List the sszvis chart types (recipes) render_chart can draw: the roles each maps to a data column, its options and features, and the sample tables available by name.",
  success: RecipeList,
})
  .annotate(Tool.Title, "List chart types")
  .annotate(Tool.Readonly, true);

const listRecipes = () =>
  Effect.succeed({
    recipes: summaries.map(guide),
    samples: samples.map((sample) => ({
      key: sample.key,
      label: sample.label,
      columns: [...parse(sample.csv).columns],
    })),
  });

// render_chart ---------------------------------------------------------------

const RenderChartParams = Schema.Struct({
  recipe: Schema.Literals(recipeKeys).annotate({
    description: "The chart type; list_recipes describes each.",
  }),
  csv: Schema.optional(Schema.String).annotate({
    description:
      "The data as CSV with a header row. Omit it to use `sample`, or the recipe's own sample.",
  }),
  sample: Schema.optional(Schema.Literals(sampleKeys)).annotate({
    description: "A sample table to draw instead of `csv`.",
  }),
  fields: Schema.optional(Schema.Record(Schema.String, Schema.String)).annotate({
    description:
      "Role key to column name, e.g. { category: 'Sektor', value: 'Anzahl' }. Roles left out are matched to columns automatically.",
  }),
  options: Schema.optional(Schema.Record(Schema.String, Schema.String)).annotate({
    description: "Option key to value, e.g. { title: 'Employees by sector' }.",
  }),
  features: Schema.optional(Schema.Array(Schema.String)).annotate({
    description: "The feature keys to switch on. Omit it to switch on every feature.",
  }),
});
type RenderChartParams = typeof RenderChartParams.Type;

/** What the model reads back: a sentence and the spec, without the CSV it already sent. */
const describe = ({ spec }: { readonly spec: Spec }) => {
  const summary = summaries.find((candidate) => candidate.key === spec.recipe);
  const { csv: _csv, ...rest } = spec;
  const rows = parse(spec.csv).rows.length;
  return [
    Prompt.textPart({
      text: `Showing the user a ${summary?.label ?? spec.recipe} of ${rows} rows. They can change it in place. The spec, without its CSV:\n${JSON.stringify(rest)}`,
    }),
  ];
};

const RenderChart = Tool.make("render_chart", {
  description:
    "Draw an sszvis chart and show it to the user, who can then change its type, column mapping, options and features in place. Call list_recipes first to see the recipes, their roles and the sample tables.",
  parameters: RenderChartParams,
  success: Schema.Struct({ spec: Spec }),
  failure: ChartInputError,
  /* `structuredContent` still carries the spec, which the app needs. */
  toModelOutput: describe,
})
  .annotate(Tool.Title, "Render a chart")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Meta, renderedBy(CHART_APP_URI));

const fail = (message: string) => Effect.fail(new ChartInputError({ message }));

/** Every way the input can name something the recipe or the table does not have. */
const specFrom = Effect.fnUntraced(function* (params: RenderChartParams) {
  const summary = summaries.find((candidate) => candidate.key === params.recipe);
  if (summary === undefined) return yield* fail(`Unknown recipe. Use one of ${list(recipeKeys)}.`);
  if (params.csv !== undefined && params.sample !== undefined) {
    return yield* fail("Pass either `csv` or `sample`, not both.");
  }
  const csv = params.csv ?? sampleFor(params.sample ?? summary.sample).csv;
  const columns = parse(csv).columns;
  if (columns.length === 0) return yield* fail("The CSV has no header row.");

  const base = initialSpec(summary, csv);
  const roleKeys = summary.roles.map((role) => role.key);
  const fields = Object.entries(params.fields ?? {});
  for (const [role, column] of fields) {
    if (!roleKeys.some((key) => key === role)) {
      return yield* fail(
        `"${summary.key}" has no role "${role}". Its roles are ${list(roleKeys)}.`,
      );
    }
    if (!columns.some((name) => name === column)) {
      return yield* fail(`The data has no column "${column}". Its columns are ${list(columns)}.`);
    }
  }
  for (const [key, value] of Object.entries(params.options ?? {})) {
    const option = summary.options.find((candidate) => candidate.key === key);
    if (option === undefined) {
      return yield* fail(
        `"${summary.key}" has no option "${key}". Its options are ${list(summary.options.map((o) => o.key))}.`,
      );
    }
    if (option.choices !== undefined && !option.choices.some((choice) => choice.value === value)) {
      return yield* fail(
        `"${value}" is not a choice for "${key}". Use one of ${list(option.choices.map((c) => c.value))}.`,
      );
    }
  }
  const featureKeys = guide(summary).features.map((feature) => feature.key);
  for (const feature of params.features ?? []) {
    if (!featureKeys.some((key) => key === feature)) {
      return yield* fail(
        `"${summary.key}" has no feature "${feature}". Its features are ${list(featureKeys)}.`,
      );
    }
  }

  const spec: Spec = {
    ...base,
    fields: {
      ...base.fields,
      ...Object.fromEntries(
        fields.map(([role, column]) => [RoleKey.make(role), ColumnName.make(column)]),
      ),
    },
    chosen: fields.map(([role]) => RoleKey.make(role)),
    options: Object.fromEntries(
      Object.entries(params.options ?? {}).map(([key, value]) => [OptionKey.make(key), value]),
    ),
    features: params.features?.map((feature) => FeatureKey.make(feature)) ?? base.features,
  };
  const unmapped = unmappedRoles(summary, spec);
  if (Array.isReadonlyArrayNonEmpty(unmapped)) {
    return yield* fail(
      `No column fits the role(s) ${list(unmapped)}. Map them in \`fields\`; the columns are ${list(columns)}.`,
    );
  }
  return spec;
});

// update_chart ---------------------------------------------------------------

const ChartUpdate = Schema.Struct({
  spec: Spec,
  ts: Schema.String,
  js: Schema.String,
  /** Comma-separated with HTML in the values escaped: what the preview draws, as the docs builder's does. */
  csv: Schema.String,
  assets: Schema.Array(Asset),
  scripts: Schema.Array(Schema.String),
  columns: Schema.Array(ColumnName),
  /** The recipes this table can fill every required role of. */
  compatible: Schema.Array(Schema.String),
});
export type ChartUpdate = typeof ChartUpdate.Type;

const UpdateChart = Tool.make("update_chart", {
  description:
    "Generate the code for a chart spec, switching it to another recipe first if `recipe` is given. Used by the chart app.",
  parameters: Schema.Struct({
    spec: Spec,
    recipe: Schema.optional(RecipeKey),
  }),
  success: ChartUpdate,
  failure: ChartInputError,
})
  .annotate(Tool.Title, "Update a chart")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Meta, appOnly);

// describe_recipes -----------------------------------------------------------

/** Every recipe as chart-builder describes it, swatches and all, for the app's controls. */
const DescribeRecipes = Tool.make("describe_recipes", {
  description: "The full recipe summaries the chart app's controls are built from.",
  /* An object, since MCP's `structuredContent` cannot be an array. */
  success: Schema.Struct({ recipes: Schema.Array(RecipeSummary) }),
})
  .annotate(Tool.Title, "Describe recipes")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Meta, appOnly);

// The toolkit ----------------------------------------------------------------

const ChartToolkit = Toolkit.make(ListRecipes, RenderChart, UpdateChart, DescribeRecipes);

const handlers = Effect.gen(function* () {
  const generate = yield* makeGenerate;
  const compile = (spec: Spec) =>
    findRecipe(spec.recipe).pipe(
      Effect.flatMap((recipe) => generate(recipe, spec)),
      Effect.mapError((error) => new ChartInputError({ message: error.message })),
    );

  return ChartToolkit.of({
    list_recipes: listRecipes,
    describe_recipes: () => Effect.succeed({ recipes: summaries }),
    render_chart: Effect.fnUntraced(function* (params) {
      const spec = yield* specFrom(params);
      /* Generated and thrown away, so a spec the app cannot draw fails here, to the model. */
      yield* compile(spec);
      return { spec };
    }),
    update_chart: Effect.fnUntraced(function* ({ spec: current, recipe }) {
      const from = summaries.find((candidate) => candidate.key === current.recipe);
      const to = summaries.find((candidate) => candidate.key === (recipe ?? current.recipe));
      if (from === undefined || to === undefined) {
        return yield* fail(`Unknown recipe. Use one of ${list(recipeKeys)}.`);
      }
      const spec = from === to ? current : switchRecipe(current, from, to);
      const generated = yield* compile(spec);
      const table = parse(spec.csv);
      return {
        spec,
        ts: generated.ts,
        js: generated.js,
        csv: harmlessValues(spec.csv),
        assets: generated.assets,
        scripts: generated.scripts,
        columns: [...table.columns],
        compatible: summaries
          .filter((summary) => unmetRoles(summary, table, spec.kinds).length === 0)
          .map((summary) => summary.key),
      };
    }),
  });
});

export const ChartTools = McpServer.toolkit(ChartToolkit).pipe(
  Layer.provide(ChartToolkit.toLayer(handlers)),
);
