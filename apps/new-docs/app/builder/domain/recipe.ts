import { Effect } from "effect";

import { BuilderCompileError, code, scalarHoles, type Safe } from "./emit";
import { FeatureKey, type Feature, type Recipe, type RecipeDef, type Spec } from "./spec";

export type Sources = Readonly<Record<string, string>>;

export const sourcesFrom = (entries: Iterable<readonly [file: string, source: string]>) =>
  Object.fromEntries(
    Array.from(entries).flatMap<readonly [string, string]>(([file, source]) => {
      if (file === "chart.ts") return [["chart", source]];
      if (file.endsWith(".tmpl")) return [[file.slice(0, -".tmpl".length), source]];
      return [];
    }),
  );

export const buildRecipe = Effect.fnUntraced(function* (
  def: RecipeDef,
  sources: Sources,
): Effect.fn.Return<Recipe, BuilderCompileError> {
  const template = sources.chart;
  if (template === undefined) {
    return yield* recipeError(`${def.key} has no chart.ts`);
  }
  const features = yield* Effect.forEach(def.features, (name) => {
    const source = sources[name];
    return source === undefined
      ? recipeError(`${def.key} lists "${name}" but there is no ${name}.tmpl`)
      : parseFeature(name, source);
  });
  yield* checkHoles(def, template, features);
  yield* checkScalars(def, template, features);
  yield* checkImplied(def, features);
  return { ...def, template, features };
});

const recipeError = (message: string) => new BuilderCompileError({ stage: "recipe", message });

const BLOCK_HOLE = /^[ \t]*\/\/ \{\{block:([A-Za-z][A-Za-z0-9]*)\}\}[ \t]*$/;

const blockHoles = (template: string) =>
  template.split("\n").flatMap((line) => {
    const [, name] = BLOCK_HOLE.exec(line) ?? [];
    return name === undefined ? [] : [name];
  });

const INDIRECT_HOLES: readonly string[] = ["actionTypes"];

const checkHoles = Effect.fnUntraced(function* (
  def: RecipeDef,
  template: string,
  features: readonly Feature[],
) {
  const known = new Set([...blockHoles(template), ...INDIRECT_HOLES]);
  const unknown = features.flatMap((feature) =>
    Object.keys(feature.fragments)
      .filter((hole) => !known.has(hole))
      .map((hole) => `${feature.key}.tmpl -> ${hole}`),
  );
  if (unknown.length > 0) {
    return yield* recipeError(
      `${def.key} has no {{block:...}} for ${unknown.join(", ")} - add the hole to chart.ts, or list it in INDIRECT_HOLES if compile.ts reads it`,
    );
  }
});

/*
 * The mirror of `checkHoles` for the other kind of hole. `fill` reports a hole with no
 * value; nothing reported a value with no hole, and nothing type-checks a `.tmpl`, so a
 * mistyped `#scalar` name - or a hole renamed in chart.ts - compiled green and drew a
 * wrong chart. Two enabled features may still set the same scalar: that is what `#scalar`
 * is for (the line chart's legend overrides the recipe's `C_SCALE`), and features that
 * never appear together cannot be told apart here anyway.
 */
const checkScalars = Effect.fnUntraced(function* (
  def: RecipeDef,
  template: string,
  features: readonly Feature[],
) {
  /* `fill` lays the fragments in before it substitutes, so a hole is just as valid in a
     feature's own template as in chart.ts - four of the shipped ones are. */
  const bodies = [
    template,
    ...features.flatMap((feature) => Object.values(feature.fragments).flat()),
  ];
  const known = new Set(bodies.flatMap(scalarHoles));
  const unknown = features.flatMap((feature) =>
    Object.keys(feature.scalars ?? {})
      .filter((scalar) => !known.has(scalar))
      .map((scalar) => `${feature.key}.tmpl -> ${scalar}`),
  );
  if (unknown.length > 0) {
    return yield* recipeError(
      `${def.key} has no __...__ hole for ${unknown.join(", ")} - add the hole to chart.ts, or fix the #scalar name`,
    );
  }
});

const IMPLIED_PROBES: readonly Partial<Spec>[] = [
  {},
  {
    annotations: [{ kind: "reference-line", axis: "x", at: { kind: "mean" }, label: "" }],
  },
];

const probeSpec = (def: RecipeDef, over: Partial<Spec>): Spec => ({
  recipe: def.key,
  csv: "",
  fields: {},
  options: {},
  features: [],
  tooltip: def.defaultTooltip,
  annotations: [],
  ...over,
});

const checkImplied = Effect.fnUntraced(function* (def: RecipeDef, features: readonly Feature[]) {
  const hidden = new Set(
    features.filter((feature) => feature.hidden === true).map((feature) => feature.key),
  );
  const named = new Set(IMPLIED_PROBES.flatMap((over) => def.implied(probeSpec(def, over))));
  const stray = [...named].filter((key) => !hidden.has(key));
  if (stray.length > 0) {
    return yield* recipeError(
      `${def.key} implies ${stray.join(", ")}, which ${stray.length === 1 ? "is not a hidden feature" : "are not hidden features"} of the recipe`,
    );
  }
});

const LABEL = /^\/\/ #label\s+(.*)$/;
const HINT = /^\/\/ #hint\s+(.*)$/;
/** No checkbox: the recipe's `implied` decides when the feature is on. */
const HIDDEN = /^\/\/ #hidden\s*$/;
const SCALAR = /^\/\/ #scalar\s+([A-Z][A-Z0-9_]*)\s+(.*)$/;
const REGION = /^\s*\/\/ #region\s+([A-Za-z][A-Za-z0-9]*)\s*$/;
const ENDREGION = /^\s*\/\/ #endregion\s*$/;

const featureError = (message: string) => new BuilderCompileError({ stage: "feature", message });

export const parseFeature = Effect.fnUntraced(function* (
  key: string,
  source: string,
): Effect.fn.Return<Feature, BuilderCompileError> {
  let label = key;
  let hint = "";
  let hidden = false;
  const scalars: Record<string, Safe> = {};
  const fragments: Record<string, string[]> = {};

  let open: { name: string; lines: string[] } | null = null;

  for (const [index, line] of source.split("\n").entries()) {
    const where = () => `${key}.tmpl line ${index + 1}`;

    if (ENDREGION.test(line)) {
      if (open === null) return yield* featureError(`#endregion without #region at ${where()}`);
      /* The hole decides indentation, so the region's own is normalised away. */
      const lines = trimBlankEdges(open.lines);
      const existing = fragments[open.name];
      fragments[open.name] = [...(existing ?? []), ...dedent(lines)];
      open = null;
      continue;
    }

    const region = REGION.exec(line);
    if (region !== null) {
      if (open !== null) return yield* featureError(`#region inside a region at ${where()}`);
      const [, name = ""] = region;
      open = { name, lines: [] };
      continue;
    }

    if (open !== null) {
      open.lines.push(line);
      continue;
    }

    const labelMatch = LABEL.exec(line);
    if (labelMatch !== null) {
      const [, text = ""] = labelMatch;
      label = text.trim();
      continue;
    }

    const hintMatch = HINT.exec(line);
    if (hintMatch !== null) {
      const [, text = ""] = hintMatch;
      hint = text.trim();
      continue;
    }

    if (HIDDEN.test(line)) {
      hidden = true;
      continue;
    }

    const scalarMatch = SCALAR.exec(line);
    if (scalarMatch !== null) {
      const [, name = "", value = ""] = scalarMatch;
      scalars[name] = code(value.trim());
    }
  }

  if (open !== null) return yield* featureError(`unclosed #region "${open.name}" in ${key}.tmpl`);
  if (Object.keys(fragments).length === 0 && Object.keys(scalars).length === 0) {
    return yield* featureError(`${key}.tmpl contributes nothing - no #region and no #scalar`);
  }

  const feature: Feature = { key: FeatureKey.make(key), label, hint, fragments, scalars };
  return hidden ? { ...feature, hidden } : feature;
});

const trimBlankEdges = (lines: readonly string[]) => {
  let start = 0;
  let end = lines.length;
  while (start < end && (lines[start] ?? "").trim() === "") start += 1;
  while (end > start && (lines[end - 1] ?? "").trim() === "") end -= 1;
  return lines.slice(start, end);
};

const dedent = (lines: readonly string[]) => {
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.length - line.trimStart().length);
  const common = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => (line.trim() === "" ? "" : line.slice(common)));
};
