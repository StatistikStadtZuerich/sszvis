import { Array, Effect } from "effect";

import { BuilderCompileError } from "../emit";
import { buildRecipe, sourcesFrom } from "../recipe";
import type { Recipe } from "../spec";
import { recipeDefs } from "./defs";

const templates = import.meta.glob<string>(["./*/chart.ts", "./*/*.tmpl"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const sourcesFor = (key: string) => {
  const dir = `./${key}/`;
  return sourcesFrom(
    Object.entries(templates)
      .filter(([path]) => path.startsWith(dir))
      .map(([path, source]) => [path.slice(dir.length), source] as const),
  );
};

export const recipes: readonly Recipe[] = Effect.runSync(
  Effect.all(recipeDefs.map((def) => buildRecipe(def, sourcesFor(def.key)))),
);

export const findRecipe = (key: string): Effect.Effect<Recipe, BuilderCompileError> =>
  Effect.fromOption(
    Array.findFirst(recipes, (recipe) => recipe.key === key),
    () => new BuilderCompileError({ stage: "recipe", message: `no recipe named "${key}"` }),
  );
