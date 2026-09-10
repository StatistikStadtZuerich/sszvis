/**
 * Whether an export may replace what it finds at its output path.
 *
 * `--out` becomes the target of a recursive, forced delete, and two separate
 * data-loss faults have come out of that: `--out .` resolves to this package's
 * own directory because the root scripts run it from there, and the sibling
 * `<root>.zip` was removed without being checked at all. So the policy is
 * stated once, here, as a pure decision that can be tested without a
 * filesystem.
 *
 * The rule: an export replaces only output it can recognise as its own.
 */
import { Schema } from "effect";
// @effect-diagnostics-next-line nodeBuiltinImport:off
import * as NodePath from "node:path";
/**
 * Does the export root contain the repository, or is it the repository itself?
 *
 * Two traps rule out the obvious string comparisons. `startsWith(repo + sep)`
 * fails at a filesystem root, where `"/" + sep` is `"//"` and matches nothing,
 * so `--out /` read as unrelated to the repo. And `startsWith("..")` on the
 * relative path misreads a directory legitimately named `..hidden` as a climb,
 * so whole segments are compared instead.
 */
export const holdsRepo = (root: string, repo: string): boolean => {
  const fromRootToRepo = NodePath.relative(root, repo);
  return fromRootToRepo === "" || !fromRootToRepo.split(NodePath.sep).includes("..");
};

/**
 * Written into every export, and the only thing that identifies one.
 *
 * Recognising an export by `index.html` plus `manifest.json` is not safe: any
 * PWA or static-site build carries both, so `--out` at an unrelated site
 * classified it as ours and deleted it. A marker naming this tool cannot be
 * produced by accident.
 */
export const EXPORT_MARKER = ".sszvis-regression-export";

/** Write-only metadata for whoever finds the directory; only existence is checked. */
export const ExportMarker = Schema.Struct({
  tool: Schema.Literal("@sszvis/regression-cli"),
  stamp: Schema.String,
  charts: Schema.Finite,
});

export interface TargetState {
  readonly rootExists: boolean;
  readonly hasExportMarker: boolean;
  readonly isEmpty: boolean;
  /** The root is the repository, or an ancestor of it. */
  readonly holdsRepo: boolean;
  /** The path exists, but as a file or a link rather than a directory. */
  readonly rootIsNotADirectory: boolean;
  readonly writingZip: boolean;
  readonly zipExists: boolean;
}

export type Refusal =
  /** The output directory: either not a directory at all, or not ours to replace. */
  | { readonly of: "directory"; readonly why: "not-a-directory" | "not-ours" }
  /** The sibling `<root>.zip`, which no previous export of ours accounts for. */
  | { readonly of: "zip" };

/**
 * `undefined` when the export may proceed, otherwise which output it refuses to
 * replace. The zip is licensed by the *directory* carrying the marker: an
 * archive that merely shares the name of a fresh target belongs to someone else.
 */
export const refuseToReplace = (state: TargetState): Refusal | undefined => {
  if (state.rootExists) {
    if (state.rootIsNotADirectory) return { of: "directory", why: "not-a-directory" };
    if (state.holdsRepo) return { of: "directory", why: "not-ours" };
    if (!(state.hasExportMarker || state.isEmpty)) return { of: "directory", why: "not-ours" };
  }
  if (state.writingZip && state.zipExists && !state.hasExportMarker) {
    return { of: "zip" };
  }
  return undefined;
};
