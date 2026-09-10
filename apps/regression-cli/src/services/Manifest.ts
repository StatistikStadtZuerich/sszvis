/**
 * The catalogue of reference chart pages.
 *
 * Every page in `.reference/d3charts-website/Statistik_Daten` that loads a
 * pinned sszvis release becomes one entry. Building it means reading ~1000 HTML
 * files, so the service memoizes the result: `serve` answers many requests from
 * one build, and `crawl` and `export` each need it once.
 */
import { Context, Effect, Layer } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { type Chart, COMPARABLE_VERSIONS } from "../domain/Chart.ts";
import { LIB_REF } from "./Rewrite.ts";
import { Workspace } from "./Workspace.ts";

export interface ManifestShape {
  readonly all: Effect.Effect<ReadonlyArray<Chart>>;
  readonly comparable: Effect.Effect<ReadonlyArray<Chart>>;
}

export class Manifest extends Context.Service<Manifest, ManifestShape>()(
  "regression-cli/services/Manifest",
) {
  static readonly layer = Layer.effect(Manifest)(
    Effect.gen(function* () {
      const fs = yield* FileSystem;
      const path = yield* Path;
      const workspace = yield* Workspace;

      const all = yield* Effect.cached(
        Effect.gen(function* () {
          const root = path.join(workspace.reference, "Statistik_Daten");
          const files = yield* fs.glob("**/*.html", { root, exclude: ["**/node_modules/**"] });

          const charts: Array<Chart> = [];
          for (const file of files) {
            const absolute = path.isAbsolute(file) ? file : path.join(root, file);
            const html = yield* fs.readFileString(absolute);
            const version = html.matchAll(LIB_REF).next().value?.[1];
            // A page that loads no pinned release is not a chart page.
            if (version === undefined) continue;

            const rel = path.relative(workspace.reference, absolute).split(path.sep).join("/");
            charts.push({
              path: rel,
              group: rel.split("/").slice(1, -1).join(" / "),
              name: path.basename(absolute, ".html"),
              title: (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim(),
              version,
              comparable: COMPARABLE_VERSIONS.has(version),
            });
          }
          charts.sort((a, b) => a.path.localeCompare(b.path));
          return charts as ReadonlyArray<Chart>;
        }).pipe(Effect.orDie, Effect.withSpan("Manifest.all")),
      );

      return Manifest.of({
        all,
        comparable: Effect.map(all, (charts) => charts.filter((c) => c.comparable)),
      });
    }),
  );
}
