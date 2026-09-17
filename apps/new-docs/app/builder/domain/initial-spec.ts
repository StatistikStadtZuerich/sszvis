import { Array, Option, Order, Record } from "effect";

import { columnKinds, fitRank, parse, type Table } from "./csv";
import { sampleFor } from "./samples";
import {
  ColumnName,
  type ColumnKinds,
  type Fields,
  type RecipeSummary,
  type RoleKey,
  type Spec,
} from "./spec";

/** A role the search left unbound. `Spec["fields"]` spells that as an empty column name. */
const UNMAPPED = ColumnName.make("");

/* Resolving through the pins is the point of them: a column the user pinned
   competes for the roles that kind fits, not the ones its values suggested. */
export const bindRoles = (
  recipe: RecipeSummary,
  table: Table,
  overrides: ColumnKinds,
  prior: Fields = {},
): Fields => {
  const kinds = columnKinds(table, overrides);
  const roles = recipe.roles;
  /* Lexicographic: unfilled required, their rank sum, unfilled optional, their rank sum. */
  type Cost = readonly [number, number, number, number];
  const better = Order.isLessThan(
    Order.Tuple([Order.Number, Order.Number, Order.Number, Order.Number]),
  );
  const add = (cost: Cost, role: (typeof roles)[number], fit: number | null): Cost => {
    const [required, requiredRank, optional, optionalRank] = cost;
    if (role.optional === true) {
      return fit === null
        ? [required, requiredRank, optional + 1, optionalRank]
        : [required, requiredRank, optional, optionalRank + fit];
    }
    return fit === null
      ? [required + 1, requiredRank, optional, optionalRank]
      : [required, requiredRank + fit, optional, optionalRank];
  };

  const rank = (role: (typeof roles)[number], column: ColumnName): number | null => {
    const fit = fitRank(kinds.get(column) ?? "nominal", role.kind);
    if (fit === null) return null;
    if (prior[role.key] === column) return -1;
    if (role.optional === true && fit !== 0) return null;
    return fit;
  };

  let best: { readonly cost: Cost; readonly fields: readonly ColumnName[] } | undefined;

  const search = (
    index: number,
    taken: ReadonlySet<ColumnName>,
    chosen: readonly ColumnName[],
    cost: Cost,
  ) => {
    const role = roles[index];
    if (role === undefined) {
      if (best === undefined || better(cost, best.cost)) best = { cost, fields: chosen };
      return;
    }
    for (const column of table.columns) {
      if (taken.has(column)) continue;
      const fit = rank(role, column);
      if (fit === null) continue;
      search(index + 1, new Set([...taken, column]), [...chosen, column], add(cost, role, fit));
    }
    /* Leaving the role empty is always an option, so a table that fits nothing still yields a result. */
    search(index + 1, taken, [...chosen, UNMAPPED], add(cost, role, null));
  };
  search(0, new Set(), [], [0, 0, 0, 0]);

  return Object.fromEntries(
    roles.map((role, index) => [role.key, best?.fields[index] ?? UNMAPPED]),
  );
};

export function unmetRoles(
  recipe: RecipeSummary,
  table: Table,
  overrides: ColumnKinds,
): readonly RecipeSummary["roles"][number][] {
  const fields = bindRoles(recipe, table, overrides);
  return recipe.roles.filter((role) => role.optional !== true && fields[role.key] === UNMAPPED);
}

/** Every checkbox feature on; hidden ones are implied by the spec's content, not listed. */
const allFeatures = (recipe: RecipeSummary) =>
  recipe.features.filter((feature) => feature.hidden !== true).map((feature) => feature.key);

export function initialSpec(
  recipe: RecipeSummary,
  csv: string = sampleFor(recipe.sample).csv,
): Spec {
  return {
    recipe: recipe.key,
    csv,
    fields: bindRoles(recipe, parse(csv), {}),
    options: {},
    features: allFeatures(recipe),
    tooltip: recipe.defaultTooltip,
    annotations: [],
    kinds: {},
  };
}

/*
 * A wholly new table, so the pins go with the old one: a surviving pin would land
 * on whichever sample column happened to share its name. Rebinding therefore reads
 * the new table as the detector finds it.
 */
export function applySample(spec: Spec, recipe: RecipeSummary, csv: string): Spec {
  return { ...spec, csv, kinds: {}, fields: bindRoles(recipe, parse(csv), {}, spec.fields) };
}

const carryAnnotations = (
  annotations: Spec["annotations"],
  from: RecipeSummary,
  to: RecipeSummary,
) =>
  annotations.filter((annotation) => {
    /*
     * Matched by role, so a line survives a switch that moves its axis: the value
     * axis of a vertical bar chart is the same axis as a horizontal one's, drawn
     * sideways. The kinds still have to agree - a role reused at another kind
     * cannot hold the position the user typed.
     */
    const before = from.annotationAxes.find((axis) => axis.role === annotation.role);
    const after = to.annotationAxes.find((axis) => axis.role === annotation.role);
    return before !== undefined && after !== undefined && before.kind === after.kind;
  });

/* The pins come across untouched: the data has not changed, and pinning a column
   and then shopping for a chart type that fits it is the point of pinning. */
export function switchRecipe(spec: Spec, from: RecipeSummary, next: RecipeSummary): Spec {
  return {
    recipe: next.key,
    csv: spec.csv,
    kinds: spec.kinds,
    fields: bindRoles(next, parse(spec.csv), spec.kinds, spec.fields),
    options: Object.fromEntries(
      Array.getSomes(
        next.options.map((option) =>
          Option.map(Record.get(spec.options, option.key), (value) => [option.key, value] as const),
        ),
      ),
    ),
    features: allFeatures(next),
    tooltip: next.defaultTooltip,
    annotations: carryAnnotations(spec.annotations, from, next),
  };
}

export function unmappedRoles(recipe: RecipeSummary, spec: Spec): readonly RoleKey[] {
  const columns = new Set(parse(spec.csv).columns);
  return recipe.roles
    .filter((role) => role.optional !== true)
    .filter((role) => {
      const column = spec.fields[role.key];
      return column === undefined || column === UNMAPPED || !columns.has(column);
    })
    .map((role) => role.key);
}
