import type { Effect } from "effect";

import {
  code,
  comment,
  fill,
  str,
  type BuilderCompileError,
  type Safe,
  type Scalars,
} from "./emit";
import { DESCRIPTION, optionValue, TITLE, type OptionKey, type Recipe, type Spec } from "./spec";

const EMPTY_ACTIONS = "Record<string, never>";

type Surround = {
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly indent: boolean;
};

const SURROUNDS = {
  helpers: { before: ["// Helper functions", ""], after: [], indent: false },
  actions: { before: ["actions: {"], after: ["},", ""], indent: true },
} satisfies Readonly<Record<string, Surround>>;

export const compile = (recipe: Recipe, spec: Spec): Effect.Effect<string, BuilderCompileError> => {
  const implied = recipe.implied(spec);
  const active = recipe.features.filter((feature) =>
    feature.hidden === true ? implied.includes(feature.key) : spec.features.includes(feature.key),
  );

  const fragments: Record<string, string[]> = {};
  for (const feature of active) {
    for (const [hole, lines] of Object.entries(feature.fragments)) {
      const into = (fragments[hole] ??= []);

      if (into.length > 0 && (into.length > 1 || lines.length > 1)) into.push("");
      into.push(...lines);
    }
  }

  for (const [hole, surround] of Object.entries(SURROUNDS)) {
    const lines = fragments[hole];
    if (lines === undefined || lines.length === 0) continue;
    const inner = surround.indent ? lines.map(indent) : lines;
    fragments[hole] = [...surround.before, ...inner, ...surround.after];
  }

  const option = (key: OptionKey) => optionValue(recipe.options, spec, key);
  const scalars: Scalars = {
    TITLE: comment(option(TITLE)),
    TITLE_TEXT: str(option(TITLE)),
    DESCRIPTION: str(option(DESCRIPTION)),
    ACTIONS_PARAM: code("_actions"),
    ...recipe.scalars(spec, option),
    ...Object.fromEntries(active.flatMap((feature) => Object.entries(feature.scalars ?? {}))),
    ACTIONS_TYPE: actionsType(fragments.actionTypes ?? []),
  };

  return fill(recipe.template, scalars, fragments);
};

const indent = (line: string) => (line.trim() === "" ? line : `  ${line}`);

const actionsType = (members: readonly string[]): Safe => {
  if (members.length === 0) return code(EMPTY_ACTIONS);
  return code(["{", ...members.map((line) => `  ${line}`), "}"].join("\n"));
};
