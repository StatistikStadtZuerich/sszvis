import type { Effect } from "effect";
import { version as SSZVIS_VERSION } from "sszvis/package.json";

import {
  code,
  comment,
  fill,
  str,
  type BuilderCompileError,
  type Safe,
  type Scalars,
} from "./emit";
import {
  DESCRIPTION,
  optionValue,
  TITLE,
  type Asset,
  type OptionKey,
  type Recipe,
  type Spec,
} from "./spec";

const EMPTY_ACTIONS = "Record<string, never>";

/* What the header's @features reads when nothing was switched on; an empty tag says less than "none". */
const NO_FEATURES = "none";

type Surround = {
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly indent: boolean;
  /** Skip `before` when the template already opens this section itself. */
  readonly once?: boolean;
};

const SURROUNDS = {
  /*
   * `once`, because a chart.ts with helper functions of its own already writes the
   * banner above them, and a feature's helpers belong under that heading rather
   * than under a second copy of it. Without this the line chart and the stacked
   * area emitted "// Helper functions" twice, which is what a reader of the
   * exported file sees.
   */
  helpers: { before: ["// Helper functions", ""], after: [], indent: false, once: true },
  /* Not `once`: no chart.ts opens its own `actions`, and two would not be valid anyway. */
  actions: { before: ["actions: {"], after: ["},", ""], indent: true, once: false },
} satisfies Readonly<Record<string, Surround>>;

/** Whether the template already carries `line` as a line of its own. */
const opensWith = (template: string, line: string | undefined) =>
  line !== undefined && template.split("\n").includes(line);

/**
 * The extra files this spec's chart loads. Separate from `compile` because the
 * bundle, the preview and the page each need the list without the code: the same
 * file reaches the chart under a different URL in each of them.
 */
export const assetsFor = (recipe: Recipe, spec: Spec): readonly Asset[] =>
  recipe.assets?.(spec, (key) => optionValue(recipe.options, spec, key)) ?? [];

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
    const before =
      surround.once === true && opensWith(recipe.template, surround.before[0])
        ? []
        : surround.before;
    fragments[hole] = [...before, ...inner, ...surround.after];
  }

  const option = (key: OptionKey) => optionValue(recipe.options, spec, key);
  const scalars: Scalars = {
    TITLE: comment(option(TITLE)),
    TITLE_TEXT: str(option(TITLE)),
    DESCRIPTION: str(option(DESCRIPTION)),
    ACTIONS_PARAM: code("_actions"),
    SSZVIS_VERSION: code(SSZVIS_VERSION),
    CHART: code(recipe.key),
    /* Only the features the reader chose: the hidden ones a recipe implies are an implementation detail. */
    FEATURES: code(
      active
        .filter((feature) => feature.hidden !== true)
        .map((feature) => feature.key)
        .join(", ") || NO_FEATURES,
    ),
    DATE: code(new Date().toISOString().slice(0, "yyyy-mm-dd".length)),
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
