import { Effect } from "effect";
import { HIGHLIGHT_THEMES, highlightOptions } from "../../lib/highlight";
import type { Source } from "../../lib/source";

import type { BuilderCompileError } from "../domain/emit";
import { lazy, makeGenerate } from "../domain/generate";
import { BUNDLE } from "../domain/host";
import type { Recipe, Spec } from "../domain/spec";
import type { Generated } from "./domain";

/*
 * The highlighter is this app's: `domain/generate` produces the files, and the code
 * panel wants them rendered with the same options the examples plugin uses at build time.
 */
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

type Pipeline = (recipe: Recipe, spec: Spec) => Effect.Effect<Generated, BuilderCompileError>;

export const makePipeline: Effect.Effect<Pipeline> = Effect.gen(function* () {
  const generate = yield* makeGenerate;
  const highlighter = yield* lazy("syntax highlighter", loadHighlighter);

  return Effect.fnUntraced(function* (recipe: Recipe, spec: Spec) {
    const files = yield* generate(recipe, spec);
    const highlight = yield* highlighter;
    return {
      ts: highlight(files.ts, "chart.ts"),
      js: highlight(files.js, BUNDLE.chart),
      html: highlight(files.html, BUNDLE.html),
      csv: highlight(files.csv, BUNDLE.data),
      assets: files.assets,
      scripts: files.scripts,
    };
  });
});

const pipeline = Effect.runSync(makePipeline);

export const generate = (recipe: Recipe, spec: Spec): Promise<Generated> =>
  Effect.runPromise(pipeline(recipe, spec));
