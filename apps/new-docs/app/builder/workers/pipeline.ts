import { Duration, Effect, Exit } from "effect";
import type { Options } from "prettier";
import { HIGHLIGHT_THEMES, highlightOptions } from "../../lib/highlight";
import type { Source } from "../../lib/source";

import { assetsFor, compile } from "../domain/compile";
import { BuilderCompileError } from "../domain/emit";
import { BUNDLE, host } from "../domain/host";
import { optionValue, TITLE, type Recipe, type Spec } from "../domain/spec";
import type { Generated } from "./domain";

const OPTIONS: Options = {
  parser: "typescript",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
};

const lazy = <A>(asset: string, load: () => Promise<A>) =>
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

const loadHighlighter = () =>
  Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("@shikijs/langs/typescript"),
    import("@shikijs/langs/javascript"),
    import("@shikijs/langs/html"),
    import("@shikijs/langs/csv"),
  ])
    .then(([core, engine, ...langs]) =>
      core.createHighlighterCore({
        themes: HIGHLIGHT_THEMES,
        langs: langs.map((module) => module.default),
        engine: engine.createJavaScriptRegexEngine(),
      }),
    )
    .then((highlighter) => (raw: string, filename: string): Source => {
      const options = highlightOptions(filename);
      return { raw, html: options === null ? null : highlighter.codeToHtml(raw, options) };
    });

type Generate = (recipe: Recipe, spec: Spec) => Effect.Effect<Generated, BuilderCompileError>;

export const makePipeline: Effect.Effect<Generate> = Effect.gen(function* () {
  const formatter = yield* lazy("code formatter", loadFormatter);
  const stripper = yield* lazy("TypeScript stripper", loadStripper);
  const highlighter = yield* lazy("syntax highlighter", loadHighlighter);

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
    const ts = yield* format(yield* compile(recipe, spec));
    const strip = yield* stripper;
    const js = yield* format(dropEmptySections(strip(ts)));
    const highlight = yield* highlighter;
    return {
      ts: highlight(ts, "chart.ts"),
      js: highlight(js, BUNDLE.chart),
      html: highlight(
        host(optionValue(recipe.options, spec, TITLE), assets, recipe.scripts ?? []),
        BUNDLE.html,
      ),
      csv: highlight(spec.csv, BUNDLE.data),
      assets,
    };
  });
});

const pipeline = Effect.runSync(makePipeline);

export const generate = (recipe: Recipe, spec: Spec): Promise<Generated> =>
  Effect.runPromise(pipeline(recipe, spec));

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
