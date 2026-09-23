import { describe, expect, test } from "vitest";

import { cases } from "./coverage";
import { recipes } from "./recipes";
import type { Recipe, Spec } from "./spec";

const casesFor = (key: string) => {
  const recipe = recipes.find((candidate) => candidate.key === key);
  expect(recipe, `no recipe named ${key}`).toBeDefined();
  return cases(recipe === undefined ? [] : [recipe]).map((entry) => entry.label);
};

const impliedBy = (recipe: Recipe, spec: Omit<Spec, "features">) =>
  recipe.implied({ ...spec, features: [] });

describe("the cases the type-check is run over", () => {
  /*
   * The invariant the pruning rests on, and the one that would have to hold for any
   * option added later. A case is worth emitting when it emits something new, and what
   * is new about a choice is the hidden features it switches on: those bring whole
   * fragments of source that nothing else in the suite ever type-checks. Dropping a
   * choice is safe exactly as long as something else still reaches every feature it
   * would have reached.
   */
  test("should switch on every hidden feature some choice can imply", () => {
    for (const recipe of recipes) {
      const emitted = cases([recipe]);
      const base = emitted[0];
      expect(base, `no base case for ${recipe.key}`).toBeDefined();
      if (base === undefined) continue;

      const reached = new Set(emitted.flatMap((entry) => impliedBy(recipe, entry.spec)));

      for (const option of recipe.options) {
        for (const choice of option.choices ?? []) {
          const spec = {
            ...base.spec,
            options: { ...base.spec.options, [option.key]: choice.value },
          };
          for (const feature of impliedBy(recipe, spec)) {
            expect(
              reached,
              `${recipe.key}: ${option.key}=${choice.value} implies ${feature}, which no case emits`,
            ).toContain(feature);
          }
        }
      }
    }
  });

  /* The map is the recipe with both kinds of option, so it is where the rules show. */
  const map = () => casesFor("map-choropleth");

  test("should keep every value of an option that groups nothing", () => {
    /* Six geographies, less the one the base case is already drawn in. */
    expect(map().filter((label) => label.includes("-geography-"))).toEqual([
      "map-choropleth-geography-stadtkreise",
      "map-choropleth-geography-wahlkreise",
      "map-choropleth-geography-statistische-zonen",
      "map-choropleth-geography-agglomeration",
      "map-choropleth-geography-switzerland",
    ]);
  });

  /*
   * And one value per family where an option has them. Eight ramps are one expression
   * with one of eight names in it; what differs is the family, since a diverging ramp
   * brings a second domain and a sequential one does not.
   */
  test("should keep one value per family of an option that groups them", () => {
    const palette = map().filter((label) => label.includes("-palette-"));
    expect(palette).toHaveLength(2);
    expect(palette.some((label) => label.endsWith("seq-red"))).toBe(true);
    expect(palette.some((label) => label.includes("-div-"))).toBe(true);
  });

  test("should not repeat the value the base case already carries", () => {
    /* `statistische-quartiere` is the map's fallback geography, so it is the base case. */
    expect(map()).not.toContain("map-choropleth-geography-statistische-quartiere");
    expect(map()).not.toContain("map-choropleth-palette-seq-blu");
  });
});
