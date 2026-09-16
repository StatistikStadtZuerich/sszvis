import { Effect } from "effect";
import { describe, expect, test } from "vitest";

import { BuilderCompileError } from "./emit";
import { buildRecipe } from "./recipe";
import { recipes } from "./recipes";
import { FeatureKey, RecipeKey, RoleKey, type RecipeDef } from "./spec";

const run = <A>(effect: Effect.Effect<A, BuilderCompileError>): A => Effect.runSync(effect);

const failure = <A>(effect: Effect.Effect<A, BuilderCompileError>): BuilderCompileError =>
  Effect.runSync(Effect.flip(effect));

const def = (over: Partial<RecipeDef> = {}): RecipeDef => ({
  key: RecipeKey.make("demo"),
  label: "Demo",
  roles: [],
  options: [],
  features: [FeatureKey.make("thing")],
  scalars: () => ({}),
  implied: () => [],
  sample: "",
  tooltipFeature: FeatureKey.make(""),
  defaultTooltip: { header: RoleKey.make(""), body: [] },
  annotationAxes: [],
  ...over,
});

/* A scalar hole and a block hole, so a feature can miss either one. */
const chart = ["const a = __A_SCALE__;", "// {{block:body}}"].join("\n");

const scalar = (name: string) => `// #scalar ${name} 1`;

describe("scalar holes", () => {
  test("should build when a #scalar names a hole the chart declares", () => {
    const recipe = run(buildRecipe(def(), { chart, thing: scalar("A_SCALE") }));
    expect(recipe.features[0]?.scalars?.A_SCALE).toBe("1");
  });

  test("should fail naming the feature and the scalar when a #scalar names a hole chart.ts has not got", () => {
    /*
     * The silence this closes: nothing type-checks a .tmpl, so a mistyped scalar
     * name (or a hole renamed in chart.ts) used to compile green and draw wrong.
     */
    const error = failure(buildRecipe(def(), { chart, thing: scalar("A_SCLAE") }));
    expect(error).toBeInstanceOf(BuilderCompileError);
    expect(error.stage).toBe("recipe");
    expect(error.message).toMatch(/thing\.tmpl -> A_SCLAE/);
  });

  test("should still report a missing block hole alongside a good scalar", () => {
    const source = [scalar("A_SCALE"), "// #region nope", "const x = 1;", "// #endregion"].join(
      "\n",
    );
    expect(failure(buildRecipe(def(), { chart, thing: source })).message).toMatch(
      /thing\.tmpl -> nope/,
    );
  });

  test("should let two features set the same scalar, which is how a feature overrides a default", () => {
    const recipe = run(
      buildRecipe(def({ features: [FeatureKey.make("one"), FeatureKey.make("two")] }), {
        chart,
        one: scalar("A_SCALE"),
        two: `// #scalar A_SCALE 2`,
      }),
    );
    expect(recipe.features[1]?.scalars?.A_SCALE).toBe("2");
  });

  test("should have built every shipped recipe, every scalar included", () => {
    expect(recipes.length).toBeGreaterThan(0);
    const set = recipes.flatMap((recipe) =>
      recipe.features.flatMap((feature) => Object.keys(feature.scalars ?? {})),
    );
    /* The shipped recipes must exercise the new check, not just pass it vacuously. */
    expect(set.length).toBeGreaterThan(0);
  });

  test("should keep the line chart's legend overriding C_SCALE", () => {
    const legend = recipes
      .find((recipe) => recipe.key === "line-chart")
      ?.features.find((feature) => feature.key === "legend");
    expect(legend?.scalars?.C_SCALE).toBeDefined();
  });
});
