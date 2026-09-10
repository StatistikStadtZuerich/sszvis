/**
 * `export` - the comparison as a static directory.
 *
 * The server's only runtime job is rewriting each chart page's hardcoded
 * library URLs, which is a build step in disguise: do it once per side up front
 * and the result is plain files. Both copies of a page live beside the data they
 * load, as `<name>.baseline.html` and `<name>.candidate.html`, and point at a
 * `lib/` folder at the export root by a relative path.
 *
 * The export still has to be served over HTTP - the charts fetch their CSV and
 * TopoJSON, which a browser refuses to do from `file://` - so START-HERE.md
 * tells the recipient how. That is a one-line command, not a checkout.
 */
import { Console, DateTime, Effect, Option, Schema } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { Command, Flag } from "effect/unstable/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { Charts, SIDES } from "../domain/Chart.ts";
import { EXPORT_MARKER, ExportMarker, holdsRepo, refuseToReplace } from "../domain/ExportTarget.ts";
import { Report } from "../domain/Verdict.ts";
import { Manifest } from "../services/Manifest.ts";
import { LIB_FILES, rewriteChart } from "../services/Rewrite.ts";
import { userError } from "../userError.ts";
import { Workspace } from "../services/Workspace.ts";
import { startHere } from "./startHere.ts";

const out = Flag.String("out").pipe(
  Flag.withDescription("Write the export here (relative to the repository root)"),
  Flag.optional,
);

const flagged = Flag.Boolean("flagged").pipe(
  Flag.withDescription("Export only the charts the last sweep found wanting"),
  Flag.withDefault(false),
);

const limit = Flag.Int("limit").pipe(
  Flag.withDescription("Export only the first N charts"),
  Flag.optional,
);

const zip = Flag.Boolean("zip").pipe(
  Flag.withDescription("Also write a zip beside the folder"),
  Flag.withDefault(true),
);

export const exportCommand = Command.make(
  "export",
  { out, flagged, limit, zip },
  Effect.fn("export")(function* ({ out, flagged, limit, zip }) {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const workspace = yield* Workspace;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const stamp = DateTime.formatIsoDate(yield* DateTime.now);
    // The suffix keeps a flagged export from overwriting a full one taken the
    // same day.
    const name = `sszvis-regression-${stamp}${flagged ? "-flagged" : ""}`;
    /**
     * A relative `--out` resolves against the repository root, not the cwd: a
     * pnpm filter runs this package from `apps/regression-cli`, so `--out foo`
     * would otherwise land somewhere the caller never named.
     */
    const root = Option.match(out, {
      onSome: (given) => path.resolve(workspace.repo, given),
      onNone: () => path.join(workspace.exportDir, name),
    });
    const reportFile = path.join(workspace.reportDir, "report.json");

    /* --------------------------------------------------------- what to ship */

    const comparable = yield* Manifest.pipe(Effect.flatMap((m) => m.comparable));

    let charts = comparable;
    let report: Report | undefined;
    if (flagged) {
      if (!(yield* fs.exists(reportFile))) {
        return yield* userError(
          `--flagged needs a sweep report at ${reportFile}.\n` +
            "Run one first: sszvis-regression crawl",
        );
      }
      // One schema for read-and-decode: a bare `JSON.parse` throws
      // synchronously on a truncated file, which would bypass this recovery.
      report = yield* Schema.decodeEffect(Schema.fromJsonString(Report))(
        yield* fs.readFileString(reportFile),
      ).pipe(
        Effect.catch(() =>
          userError(
            `The sweep report at ${reportFile} could not be read.\n` +
              "It may predate this version of the harness. Run a fresh sweep first: sszvis-regression crawl",
          ),
        ),
      );
      const wanted = new Set(
        report.results
          .filter((r) => r.verdict !== "ok" && r.verdict !== "fixed")
          .map((r) => r.path),
      );
      charts = comparable.filter((c) => wanted.has(c.path));
    }
    if (Option.isSome(limit)) charts = charts.slice(0, limit.value);
    if (charts.length === 0) return yield* userError("Nothing to export.");

    /* ---------------------------------------------------------------- copying */

    // Gathered for `refuseToReplace`, which holds the policy: the delete below
    // is recursive and forced, so it must not run on output that is not ours.
    const zipTarget = `${root}.zip`;
    const rootExists = yield* fs.exists(root);
    const rootIsNotADirectory =
      rootExists && (yield* fs.stat(root).pipe(Effect.map((info) => info.type !== "Directory")));
    // `readDirectory` under a path that is a *file* fails with a PlatformError,
    // which would surface as a stack trace instead of a refusal.
    const inspectable = rootExists && !rootIsNotADirectory;
    const hasExportMarker = inspectable && (yield* fs.exists(path.join(root, EXPORT_MARKER)));

    const refusal = refuseToReplace({
      rootExists,
      hasExportMarker,
      isEmpty: inspectable && (yield* fs.readDirectory(root)).length === 0,
      holdsRepo: holdsRepo(root, workspace.repo),
      rootIsNotADirectory,
      writingZip: zip,
      zipExists: zip && (yield* fs.exists(zipTarget)),
    });
    if (refusal?.of === "directory") {
      return yield* userError(
        refusal.why === "not-a-directory"
          ? `Cannot export to ${root}: it exists and is not a directory.`
          : `Refusing to replace ${root}: it is not an empty directory or a previous export.\n` +
              "Pick a path that does not exist yet, or remove that directory yourself first.",
      );
    }
    if (refusal?.of === "zip") {
      // `zip` adds to an existing archive rather than replacing it, so the file
      // has to go - which means refusing when it is not ours to delete.
      return yield* userError(
        `Refusing to overwrite ${zipTarget}: no previous export of ${path.basename(root)} sits beside it.\n` +
          "Pick another --out, pass --no-zip, or remove that file yourself first.",
      );
    }
    /**
     * Before the delete, not during the copy: without these two the candidate
     * column ships blank, and finding that out after a good previous export has
     * been removed costs the operator that export. The version is immaterial -
     * the candidate always resolves into this working copy's build.
     */
    for (const file of ["sszvis.js", "sszvis.css"]) {
      const source = workspace.lib("candidate", "0.0.0", file);
      if (!(yield* fs.exists(source))) {
        return yield* userError(
          `Cannot export: the candidate ${file} is missing at ${source}.\n` +
            "Build the library first: pnpm --filter sszvis run build",
        );
      }
    }

    if (rootExists) yield* fs.remove(root, { recursive: true, force: true });
    yield* fs.makeDirectory(root, { recursive: true });

    /**
     * Written first, before any copying. The previous export is already gone by
     * this point and everything below can fail, so without the marker a partial
     * directory is unrecognised and the next run refuses it. `charts` is the
     * count intended, not completed - the marker is not a claim that it finished.
     */
    const marker = yield* Schema.encodeEffect(Schema.fromJsonString(ExportMarker, { space: 2 }))({
      tool: "@sszvis/regression-cli",
      stamp,
      charts: charts.length,
    }).pipe(Effect.orDie);
    yield* fs.writeFileString(path.join(root, EXPORT_MARKER), `${marker}\n`);

    for (const version of new Set(charts.map((c) => c.version))) {
      for (const side of SIDES) {
        const dir = path.join(root, "lib", side, version);
        yield* fs.makeDirectory(dir, { recursive: true });
        for (const file of LIB_FILES) {
          const source = workspace.lib(side, version, file);
          // A pinned release that ships no `sszvis.min.js`, say, is simply not
          // copied; the two that matter were checked above.
          if (yield* fs.exists(source)) {
            yield* fs.copyFile(source, path.join(dir, file));
          }
        }
      }
    }

    /**
     * Every asset in a chart's own folder - data, script, fallback image - but
     * not the `.html`: those are written per side below, since the originals
     * point at a host the recipient cannot reach.
     */
    const copyChartFolder = Effect.fnUntraced(function* (relDir: string) {
      const from = path.join(workspace.reference, relDir);
      const to = path.join(root, "chart", relDir);
      yield* fs.makeDirectory(to, { recursive: true });
      for (const entry of yield* fs.readDirectory(from)) {
        if (entry.endsWith(".html")) continue;
        const source = path.join(from, entry);
        const info = yield* fs.stat(source);
        yield* info.type === "Directory"
          ? fs.copy(source, path.join(to, entry), { overwrite: true })
          : fs.copyFile(source, path.join(to, entry));
      }
    });

    const folders = new Set<string>();
    let written = 0;
    for (const chart of charts) {
      const relDir = path.dirname(chart.path);
      if (!folders.has(relDir)) {
        yield* copyChartFolder(relDir);
        folders.add(relDir);
      }
      const html = yield* fs.readFileString(path.join(workspace.reference, chart.path));
      const outDir = path.join(root, "chart", relDir);
      // How far this page sits below the export root, so `lib/` resolves
      // without a server.
      const libPrefix = `${path.relative(outDir, root).split(path.sep).join("/")}/lib/`;
      const stem = path.basename(chart.path, ".html");
      for (const side of SIDES) {
        yield* fs.writeFileString(
          path.join(outDir, `${stem}.${side}.html`),
          rewriteChart(html, side, chart.path, libPrefix),
        );
      }
      written++;
    }

    /* --------------------------------------------------------------- the shell */

    const manifest = yield* Schema.encodeEffect(Schema.fromJsonString(Charts, { space: 2 }))(
      charts,
    ).pipe(Effect.orDie);
    yield* fs.writeFileString(path.join(root, "manifest.json"), manifest);
    if (report !== undefined) {
      yield* fs.copyFile(reportFile, path.join(root, "report.json"));
    }

    // The comparison page is shared with `serve`; a flag at the top switches it
    // to addressing the per-side files this export just wrote.
    const page = yield* fs.readFileString(workspace.comparisonPage);
    yield* fs.writeFileString(
      path.join(root, "index.html"),
      page.replace(
        "<script>",
        "<script>window.__REGRESSION_STATIC__ = true;</script>\n    <script>",
      ),
    );
    yield* fs.writeFileString(
      path.join(root, "START-HERE.md"),
      startHere({ stamp, charts: charts.length, hasReport: report !== undefined }),
    );

    /* ------------------------------------------------------------------- zip */

    let zipFile: string | undefined;
    if (zip) {
      yield* fs.remove(zipTarget, { force: true });
      // The exit code, not the output: `spawner.string` never inspects the
      // status, so a failed `zip` would be reported as success with a path to a
      // file that does not exist.
      const code = yield* spawner
        .exitCode(
          ChildProcess.make("zip", ["-rq", zipTarget, path.basename(root)], {
            cwd: path.dirname(root),
          }),
        )
        .pipe(
          Effect.tapError((error) => Console.error(`\nzip: ${error}`)),
          Effect.option,
        );
      if (Option.isNone(code) || code.value !== 0) {
        yield* Console.error("\ncould not create the zip.");
        yield* Console.error(`the folder itself is complete at ${root}`);
      } else {
        zipFile = zipTarget;
      }
    }

    const size = (target: string) =>
      spawner.string(ChildProcess.make("du", ["-sh", target])).pipe(
        Effect.map((stdout) => stdout.split("\t")[0]?.trim() ?? "?"),
        Effect.orElseSucceed(() => "?"),
      );

    // Repo-relative, because a pnpm filter runs this from inside the app and
    // `../../../../tmp/...` tells the reader nothing. Outside the repo, absolute.
    const display = (target: string) =>
      target.startsWith(workspace.repo + path.sep) ? path.relative(workspace.repo, target) : target;
    yield* Console.log(`\n${written} charts exported${flagged ? " (flagged only)" : ""}`);
    yield* Console.log(`  folder  ${display(root)}  (${yield* size(root)})`);
    if (zipFile !== undefined) {
      yield* Console.log(`  zip     ${display(zipFile)}  (${yield* size(zipFile)})`);
    }
    yield* Console.log(`\nTo check it locally:  cd ${display(root)} && npx serve .`);
  }),
).pipe(
  Command.withDescription("Write the comparison out as a shareable static folder"),
  Command.withExamples([
    { command: "sszvis-regression export", description: "Every comparable chart" },
    {
      command: "sszvis-regression export --flagged",
      description: "Only what the last sweep flagged - small enough to email",
    },
    { command: "sszvis-regression export --no-zip", description: "Folder only, no zip" },
  ]),
);
