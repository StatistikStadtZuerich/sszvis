import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { cases, checkboxFeatures } from "./domain/coverage";
import { recipes } from "./domain/recipes";
import { FeatureKey, type Recipe, type Spec } from "./domain/spec";
import { generate } from "./workers/pipeline";

const here = path.dirname(fileURLToPath(import.meta.url));

/*
 * Two lines of the header are about the run rather than the spec: the day the file was
 * generated, and the library version it was generated against. Left alone, every baseline
 * here would go stale overnight and again on each release, for no change a reader cares
 * about.
 */
const undated = (source: string): string =>
  source.replace(/^( \* @date\s+).*$/m, "$1<date>").replace(/^( \* @sszvis\s+).*$/m, "$1<version>");

const emit = async (recipe: Recipe, spec: Omit<Spec, "features">, features: readonly string[]) => {
  const { ts } = await generate(recipe, {
    ...spec,
    features: features.map((value) => FeatureKey.make(value)),
  });
  return undated(ts.raw);
};

const baseCase = (recipe: Recipe) => {
  const first = cases([recipe])[0];
  if (first === undefined) throw new Error(`no case for ${recipe.key}`);
  return first.spec;
};

/*
 * A control-free spec has to keep emitting exactly what it emits today. The filter control
 * reaches its recipes by opening new holes in templates every spec passes through - a
 * padding scalar, a row block, the expression a layer is given its data by - and each of
 * those is a chance to move a line for charts that have no control at all.
 *
 * Nothing else here can catch that. The type-check only proves the result compiles, and
 * the rest of the suite compares one emission to another from the same run, so a template
 * that changed for everyone still agrees with itself. These baselines were recorded before
 * the first template was touched; a diff in one is the regression, not a stale file.
 */
describe("emission baselines", () => {
  test.each(recipes.map((recipe) => [recipe.key, recipe] as const))(
    "should emit an unchanged control-free %s",
    async (key, recipe) => {
      const spec = baseCase(recipe);
      const bare = await emit(recipe, spec, []);
      await expect(bare).toMatchFileSnapshot(
        path.join(here, "__snapshots__/emission", `${key}.bare.ts.txt`),
      );

      const full = await emit(recipe, spec, checkboxFeatures(recipe));
      await expect(full).toMatchFileSnapshot(
        path.join(here, "__snapshots__/emission", `${key}.full.ts.txt`),
      );
    },
  );
});
