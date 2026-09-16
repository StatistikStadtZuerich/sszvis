import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Effect } from "effect";
import { describe, expect, test } from "vitest";

import { cases, checkboxFeatures, combinations } from "./domain/coverage";
import { serialize } from "./domain/csv";
import { findRecipe, recipes } from "./domain/recipes";
import { sampleFor } from "./domain/samples";
import {
  ColumnName,
  FeatureKey,
  OptionKey,
  RoleKey,
  type Fields,
  type Recipe,
  type Spec,
  type Tooltip,
} from "./domain/spec";
import { generate } from "./workers/pipeline";

/* The spec's keys are branded; these are where this file's literals become keys. */
const mapping = (entries: Readonly<Record<string, string>>): Fields =>
  Object.fromEntries(
    Object.entries(entries).map(([key, column]) => [RoleKey.make(key), ColumnName.make(column)]),
  );

const opts = (entries: Readonly<Record<string, string>>): Spec["options"] =>
  Object.fromEntries(Object.entries(entries).map(([key, value]) => [OptionKey.make(key), value]));

const tip = (header: string, body: readonly string[] = []): Tooltip => ({
  header: RoleKey.make(header),
  body: body.map((value) => RoleKey.make(value)),
});

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "../..");
const outDir = path.join(root, "examples/_builder-check");

const emit = async (recipe: Recipe, spec: Omit<Spec, "features">, features: readonly string[]) => {
  const { ts, js } = await generate(recipe, {
    ...spec,
    features: features.map((value) => FeatureKey.make(value)),
  });
  return { ts: ts.raw, js: js.raw };
};

const featureKeys = checkboxFeatures;

describe("generated code", () => {
  test("should type-check against the library when every feature combination is generated", async () => {
    fs.rmSync(outDir, { recursive: true, force: true });
    try {
      for (const { label, recipe, spec } of cases(recipes)) {
        for (const features of combinations(featureKeys(recipe))) {
          const dir = path.join(outDir, label, features.length === 0 ? "none" : features.join("-"));
          fs.mkdirSync(dir, { recursive: true });
          const { ts, js } = await emit(recipe, spec, features);
          fs.writeFileSync(path.join(dir, "chart.ts"), ts);
          fs.writeFileSync(path.join(dir, "chart.js"), js);
        }
      }
      const tsc = spawnSync(
        path.join(root, "node_modules/.bin/tsc"),
        ["--noEmit", "-p", "examples/tsconfig.json"],
        { cwd: root, encoding: "utf8" },
      );
      expect(tsc.stdout + tsc.stderr).toBe("");
      expect(tsc.status).toBe(0);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);

  test.each(recipes.map((recipe) => [recipe.key, recipe] as const))(
    "should add a feature's code only when it is on for %s",
    async (_key, recipe) => {
      const first = cases([recipe])[0];
      if (first === undefined) throw new Error(`no case for ${recipe.key}`);
      const { spec } = first;
      const all = featureKeys(recipe);
      const none = await emit(recipe, spec, []);
      const full = await emit(recipe, spec, all);
      for (const feature of all) {
        const alone = await emit(recipe, spec, [feature]);
        const without = await emit(
          recipe,
          spec,
          all.filter((key) => key !== feature),
        );
        expect(alone.ts.length).toBeGreaterThan(none.ts.length);
        expect(without.ts).not.toBe(full.ts);
      }
    },
  );

  test.each(recipes.map((recipe) => [recipe.key, recipe] as const))(
    "should leave no type syntax or empty banner in the JavaScript for %s",
    async (_key, recipe) => {
      const first = cases([recipe])[0];
      if (first === undefined) throw new Error(`no case for ${recipe.key}`);
      const { ts, js } = await emit(recipe, first.spec, featureKeys(recipe));
      expect(ts).toMatch(/^\/\/ Types$/m);
      expect(js).not.toMatch(/^\/\/ Types$/m);
      const lines = js.split("\n");
      for (const [index, line] of lines.entries()) {
        if (!/^\/\/ [A-Z]/.test(line)) continue;
        const next = lines.slice(index + 1).find((candidate) => candidate.trim() !== "");
        expect(next, `banner "${line}" over nothing`).toBeDefined();
        expect(next, `banner "${line}" over another banner`).not.toMatch(/^\/\/ [A-Z]/);
      }
      expect(js).not.toMatch(/^(?:type|interface) /m);
      expect(js).not.toContain('import("sszvis")');
      expect(js).not.toMatch(/\(d: Datum\)/);
    },
  );
});

describe("highlighting", () => {
  test("should highlight every file when the pipeline runs", async () => {
    const entry = Effect.runSync(findRecipe("bar-chart-vertical"));
    const first = cases([entry])[0];
    if (first === undefined) throw new Error("no case");
    const generated = await generate(entry, { ...first.spec, features: [] });
    for (const key of ["ts", "js", "html", "csv"] as const) {
      const { raw, html } = generated[key];
      /* `defaultColor: false`: a variable per theme, no inline colour to fight the page's.
         The variables are the decision; the wrapper's class list is shiki's to spell. */
      expect(html, key).toContain("--shiki-light:");
      expect(html, key).toContain("--shiki-dark:");
      expect(raw.length, key).toBeGreaterThan(0);
    }
    expect(generated.csv.raw).toBe(sampleFor(entry.sample).csv);
    expect(generated.html.raw).toMatch(/^<!doctype html>/);
  });
});

describe("spec text in the generated code", () => {
  const entry = Effect.runSync(findRecipe("bar-chart-vertical"));

  const build = async (over: Partial<Spec>) => {
    const { ts } = await generate(entry, {
      recipe: entry.key,
      csv: sampleFor(entry.sample).csv,
      fields: mapping({ category: "Sektor", value: "Anzahl" }),
      options: {},
      features: [],
      tooltip: tip("value"),
      annotations: [],
      ...over,
    });
    return ts.raw;
  };

  const table = (column: string) =>
    serialize({
      columns: [ColumnName.make(column), ColumnName.make("Anzahl")],
      rows: [["Gastgewerbe", "20892"]],
    });

  test("should emit the typed options when they are set", async () => {
    const ts = await build({
      options: opts({
        title: "Zürcher Wirtschaft",
        unit: "Stellen",
        seriesKey: "Branche",
      }),
      features: [FeatureKey.make("tooltip")],
    });
    expect(ts).toContain("Zürcher Wirtschaft");
    expect(ts).toContain("Stellen");
    expect(ts).toContain("Branche");
  });

  test("should keep a title inside the header comment when it contains a comment terminator", async () => {
    const ts = await build({
      options: opts({ title: "*/ ; globalThis.PWNED = 1; /*" }),
    });
    expect(ts.slice(0, ts.indexOf("*/"))).toContain("globalThis.PWNED");
    expect(ts).not.toMatch(/^\s*globalThis\.PWNED/m);
  });

  test("should keep a title in the comment gutter when it spans lines", async () => {
    const ts = await build({
      options: opts({ title: "one\nconst injected = 1;" }),
    });
    expect(ts).not.toMatch(/^\s*const injected = 1;/m);
  });

  test("should produce parseable code when a column name contains quotes", async () => {
    const column = 'He said "hi"';
    const ts = await build({
      csv: table(column),
      fields: mapping({ category: column, value: "Anzahl" }),
    });
    expect(ts).toContain(column);
    expect(ts).toMatch(/category: d\[['"`]/);
  });

  test("should keep the column accessor intact when a column name contains a backslash", async () => {
    const column = "back\\slash";
    const ts = await build({
      csv: table(column),
      fields: mapping({ category: column, value: "Anzahl" }),
    });
    expect(ts).toContain(`d[${JSON.stringify(column)}]`);
  });
});
