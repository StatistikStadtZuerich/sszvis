/**
 * Where everything the harness touches lives.
 *
 * The reference checkout and this working copy's build are both located
 * relative to the repository root, so a future move breaks one line rather
 * than every call site. Resolution happens once, in the layer, and fails loudly
 * if the reference checkout is missing - every command needs it.
 */
import { Config, Context, Effect, Layer, Option } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { Side } from "../domain/Chart.ts";
import { userError } from "../userError.ts";

export interface WorkspaceShape {
  readonly repo: string;
  /** `.reference/d3charts-website` - the reference chart pages and their data. */
  readonly reference: string;
  /** The pinned library releases each chart page was authored against. */
  readonly libs: string;
  /** This working copy's own library output - the candidate side. */
  readonly candidateBuild: string;
  readonly reportDir: string;
  readonly exportDir: string;
  /** The comparison page served by `serve` and shipped by `export`. */
  readonly comparisonPage: string;
  /**
   * Which file a page's rewritten library URL means, for one side.
   *
   * sszvis itself comes from this working copy, while d3 and topojson stay
   * pinned to the baseline release, so the only variable between the two sides
   * is sszvis.
   */
  readonly lib: (side: Side, version: string, file: string) => string;
}

export class Workspace extends Context.Service<Workspace, WorkspaceShape>()(
  "regression-cli/services/Workspace",
) {
  static readonly layer = Layer.effect(Workspace)(
    Effect.gen(function* () {
      const fs = yield* FileSystem;
      const path = yield* Path;

      /**
       * An environment variable, not a flag: the root must be resolved before
       * any subcommand's flags are parsed. Unset, the root is found by walking
       * up for `pnpm-workspace.yaml` - which marks it rather than `.git`,
       * because `.git` is not reliably at the root under a worktree.
       */
      const configured = yield* Config.String("SSZVIS_REPO").pipe(Config.option);

      const findRoot = Effect.fnUntraced(function* (from: string) {
        let dir = path.resolve(from);
        for (;;) {
          if (yield* fs.exists(path.join(dir, "pnpm-workspace.yaml"))) return dir;
          const parent = path.dirname(dir);
          if (parent === dir) {
            return yield* userError(
              `Could not find the repository root above ${from} (no pnpm-workspace.yaml).`,
            );
          }
          dir = parent;
        }
      });

      const repo = Option.isSome(configured)
        ? path.resolve(configured.value)
        : yield* findRoot(path.resolve("."));
      const reference = path.join(repo, ".reference", "d3charts-website");

      if (!(yield* fs.exists(reference))) {
        return yield* userError(
          `The reference charts are not checked out at ${reference}.\n` +
            "The harness compares against them, so every command needs that folder.",
        );
      }

      const self = path.join(repo, "apps", "regression-cli");
      const libs = path.join(
        reference,
        "statisticstools/Modules/StyleGuide/projects/library_script",
      );
      const candidateBuild = path.join(repo, "packages", "sszvis", "build");

      return Workspace.of({
        repo,
        reference,
        libs,
        candidateBuild,
        reportDir: path.join(self, "__report__"),
        exportDir: path.join(self, "__export__"),
        comparisonPage: path.join(self, "src", "static", "index.html"),
        lib: (side, version, file) => {
          const baseline = path.join(libs, version, file);
          if (side === "baseline") return baseline;
          if (file === "sszvis.js" || file === "sszvis.min.js" || file === "sszvis.css") {
            return path.join(candidateBuild, file);
          }
          return baseline;
        },
      });
    }),
  );
}
