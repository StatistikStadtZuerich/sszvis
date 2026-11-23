import { Duration, Effect, Exit } from "effect";
import type { Options } from "prettier";

import { assetsFor, compile } from "./compile";
import { BuilderCompileError } from "./emit";
import { host } from "./host";
import { optionValue, TITLE, type Asset, type Recipe, type Spec } from "./spec";

/** Everything a spec turns into: the four files of the bundle, and what else the page loads. */
export interface Generated {
  readonly ts: string;
  readonly js: string;
  readonly html: string;
  readonly csv: string;
  /** The extra files the chart reads; the bundle carries them beside the data. */
  readonly assets: readonly Asset[];
  /** The `LIBRARIES` the page loads for the chart besides d3 and sszvis. */
  readonly scripts: readonly string[];
}

export type Generate = (
  recipe: Recipe,
  spec: Spec,
) => Effect.Effect<Generated, BuilderCompileError>;

const OPTIONS: Options = {
  parser: "typescript",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
};

/**
 * Loads a heavy dependency on first use and keeps it. A failed load is not kept, so the
 * next compile tries again rather than reporting the same failure forever.
 */
export const lazy = <A>(asset: string, load: () => Promise<A>) =>
  Effect.uninterruptible(
    Effect.tryPromise({
      try: load,
      catch: (cause) =>
        new BuilderCompileError({
          stage: "load",
          message: `could not load the ${asset}: ${cause instanceof Error ? cause.message : String(cause)}`,
        }),
    }),
  ).pipe(
    Effect.cachedWithTTL((exit) => (Exit.isSuccess(exit) ? Duration.infinity : Duration.zero)),
  );

/* Prettier and its two plugins are about 1.2MB, so they load when the first spec does. */
const loadFormatter = () =>
  Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]).then(
    ([standalone, estree, typescript]) =>
      (source: string) =>
        standalone.format(source, { ...OPTIONS, plugins: [estree.default ?? estree, typescript] }),
  );

const loadStripper = () => import("ts-blank-space").then((module) => module.default);

/**
 * Turns a spec into its files: the TypeScript a recipe emits, formatted; the JavaScript
 * the bundle runs, stripped from it and formatted again; the page that loads it; and the
 * data as the spec holds it. An Effect so the loaded dependencies are shared by every
 * call made with the function it yields.
 */
export const makeGenerate: Effect.Effect<Generate> = Effect.gen(function* () {
  const formatter = yield* lazy("code formatter", loadFormatter);
  const stripper = yield* lazy("TypeScript stripper", loadStripper);

  const format = Effect.fnUntraced(function* (source: string) {
    const prettier = yield* formatter;
    return yield* Effect.tryPromise({
      try: () => prettier(source),
      catch: (cause) =>
        new BuilderCompileError({
          stage: "format",
          message: cause instanceof Error ? cause.message : String(cause),
        }),
    });
  });

  return Effect.fnUntraced(function* (recipe: Recipe, spec: Spec) {
    const assets = assetsFor(recipe, spec);
    const scripts = recipe.scripts ?? [];
    const ts = yield* format(yield* compile(recipe, spec));
    const strip = yield* stripper;
    const js = yield* format(dropEmptySections(strip(ts)));
    return {
      ts,
      js,
      html: host({ title: optionValue(recipe.options, spec, TITLE), assets, scripts }),
      csv: spec.csv,
      assets,
      scripts,
    };
  });
});

const shared = Effect.runSync(makeGenerate);

/** `makeGenerate` for a caller that is not written in Effect. */
export const generate = (recipe: Recipe, spec: Spec): Promise<Generated> =>
  Effect.runPromise(shared(recipe, spec));

/*
 * A section banner the stripped JavaScript left with nothing under it: a section
 * holding only types is empty once they are gone.
 */
const BANNER = /^\/\/ [A-Z][A-Za-z]*(?: [A-Za-z]+){0,3}$/;

const isComment = (line: string) => /^\s*(?:\/\/|\/\*|\*)/.test(line);

const dropEmptySections = (js: string): string => {
  const lines = js.split("\n");
  const kept: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (BANNER.test(line)) {
      let end = index + 1;
      while (end < lines.length) {
        const candidate = lines[end] ?? "";
        if (BANNER.test(candidate) || !(candidate.trim() === "" || isComment(candidate))) break;
        end += 1;
      }
      const next = lines[end];
      if (next === undefined || BANNER.test(next)) {
        index = end;
        continue;
      }
    }
    kept.push(line);
    index += 1;
  }
  return kept.join("\n");
};
