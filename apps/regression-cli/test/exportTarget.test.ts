/**
 * The policy guarding a recursive, forced delete.
 *
 * Two data-loss faults came out of this one decision - `--out .` resolving to
 * the package's own directory, and the sibling `<root>.zip` being removed
 * unchecked - so each case is pinned rather than left to a manual sweep.
 */
import { describe, expect, it } from "vitest";
import { holdsRepo, refuseToReplace, type TargetState } from "../src/domain/ExportTarget.ts";

/** A fresh path with no zip beside it: the ordinary first export. */
const fresh: TargetState = {
  rootExists: false,
  hasExportMarker: false,
  isEmpty: false,
  holdsRepo: false,
  rootIsNotADirectory: false,
  writingZip: true,
  zipExists: false,
};

const at = (over: Partial<TargetState>) => refuseToReplace({ ...fresh, ...over });

describe("refuseToReplace", () => {
  it("allows a path that does not exist yet", () => {
    expect(at({})).toBeUndefined();
  });

  it("allows replacing a directory carrying its own marker", () => {
    expect(at({ rootExists: true, hasExportMarker: true })).toBeUndefined();
  });

  it("refuses a static site that merely has index.html and manifest.json", () => {
    // Those two filenames are not a signature: any static-site build has them.
    expect(at({ rootExists: true, hasExportMarker: false })).toEqual({
      of: "directory",
      why: "not-ours",
    });
  });

  it("allows an existing but empty directory", () => {
    expect(at({ rootExists: true, isEmpty: true })).toBeUndefined();
  });

  it("refuses a directory holding something it did not write", () => {
    expect(at({ rootExists: true })).toEqual({ of: "directory", why: "not-ours" });
  });

  it("refuses the repository root, even were it somehow to look like an export", () => {
    // A relative `--out` resolves against the repository root, so `--out .`
    // names the repo itself.
    expect(at({ rootExists: true, holdsRepo: true, hasExportMarker: true })).toEqual({
      of: "directory",
      why: "not-ours",
    });
    expect(at({ rootExists: true, holdsRepo: true, isEmpty: true })).toEqual({
      of: "directory",
      why: "not-ours",
    });
  });

  it("refuses a stray zip beside a fresh target", () => {
    // `/tmp/report.zip` written by someone else is not ours to delete just
    // because `--out /tmp/report` was chosen.
    expect(at({ zipExists: true })).toEqual({ of: "zip" });
  });

  it("refuses a stray zip beside an empty directory", () => {
    // An empty directory licenses replacing the directory, but says nothing
    // about who wrote the archive next to it.
    expect(at({ rootExists: true, isEmpty: true, zipExists: true })).toEqual({ of: "zip" });
  });

  it("allows replacing the zip beside a directory carrying the marker", () => {
    expect(at({ rootExists: true, hasExportMarker: true, zipExists: true })).toBeUndefined();
  });

  it("ignores a stray zip entirely under --no-zip", () => {
    expect(at({ writingZip: false, zipExists: true })).toBeUndefined();
    expect(
      at({ rootExists: true, isEmpty: true, writingZip: false, zipExists: true }),
    ).toBeUndefined();
  });

  it("refuses a path that exists as a file rather than a directory", () => {
    // `--out` is a `Flag.String` so the raw value can be resolved against the
    // repo root, which makes this the tool's check rather than the flag's.
    expect(at({ rootExists: true, rootIsNotADirectory: true, hasExportMarker: true })).toEqual({
      of: "directory",
      why: "not-a-directory",
    });
  });

  it("reports the directory first when both would be refused", () => {
    // The directory check runs first because it fails before any copying.
    expect(at({ rootExists: true, zipExists: true })).toEqual({ of: "directory", why: "not-ours" });
  });
});

describe("holdsRepo", () => {
  const repo = "/Users/dev/code/sszvis";

  it.each([
    ["/", "a filesystem root"],
    ["/Users", "a distant ancestor"],
    ["/Users/dev/code", "the immediate parent"],
    [repo, "the repository itself"],
  ])("refuses %o (%s)", (root) => {
    // The filesystem root, where string prefixing fails.
    expect(holdsRepo(root, repo)).toBe(true);
  });

  it.each([
    ["/tmp/export", "an unrelated absolute path"],
    ["/Users/dev/code/sszvis-other", "a sibling sharing a name prefix"],
    ["/Users/dev/code/sszvis/../elsewhere", "a path that climbs back out"],
    ["/Users/dev/code/sszvis/__export__/today", "a descendant of the repo"],
  ])("allows %o (%s)", (root) => {
    expect(holdsRepo(root, repo)).toBe(false);
  });

  it("does not mistake a directory named `..something` for a climb", () => {
    // `path.relative` gives `..hidden/sszvis`, which a prefix check misreads.
    expect(holdsRepo("/Users/dev", "/Users/dev/..hidden/sszvis")).toBe(true);
  });

  it("keeps the filesystem root refused even when it looks like an export", () => {
    // A `/` holding manifest.json and index.html once read as a previous export.
    expect(
      refuseToReplace({
        rootExists: true,
        hasExportMarker: true,
        isEmpty: false,
        holdsRepo: holdsRepo("/", repo),
        rootIsNotADirectory: false,
        writingZip: false,
        zipExists: false,
      }),
    ).toEqual({ of: "directory", why: "not-ours" });
  });
});
