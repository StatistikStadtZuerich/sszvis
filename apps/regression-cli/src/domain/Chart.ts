/**
 * A chart page in the reference checkout, as catalogued by the manifest, and
 * the two sides every chart is rendered against.
 *
 * The comparison, the sweep and the export all work from this list, so the
 * shape is a schema rather than a bare interface: the export writes it to
 * `manifest.json`, and the browser page reads it back.
 */
import { Schema } from "effect";

/** Library versions whose chart code targets d3 v7 and today's sszvis API. */
export const COMPARABLE_VERSIONS: ReadonlySet<string> = new Set(["3.4.0", "3.2.1"]);

/**
 * Which library a page is rendered against: the release it pins, or this
 * working copy's build. It appears in the URL grammar, the export's filenames
 * and every verdict, so it lives here rather than with the rewriting.
 */
export type Side = "baseline" | "candidate";

export const SIDES: ReadonlyArray<Side> = ["baseline", "candidate"];

/**
 * A chart's file-name stem, constrained because it is used as a directory name.
 *
 * Under `--base` the catalogue is decoded from whatever the remote harness
 * serves, and `crawl` joins this into the screenshot path - so an unconstrained
 * string would let that harness pick where the sweep writes files. Every one of
 * the 1076 pages in the reference checkout matches this pattern.
 */
const ChartName = Schema.String.pipe(
  Schema.check(
    // The leading guard rejects a name that is only dots: `..` otherwise passes,
    // and only the `@<width>` suffix at the call site keeps it from climbing.
    Schema.isPattern(/^(?!\.+$)[A-Za-z0-9._-]+$/, {
      message: "Expected a chart name of letters, digits, dot, underscore or dash",
    }),
  ),
);

/**
 * A page's path relative to the reference root.
 *
 * Not restricted to ASCII - eight real chart folders carry umlauts - so the
 * rule is the actual invariant instead: relative, and no segment that climbs
 * out of the root it is resolved against.
 */
const ChartPath = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/, {
      message: "Expected a relative path with no `..` segment",
    }),
  ),
);

export const Chart = Schema.Struct({
  path: ChartPath,
  /** The folder trail, which carries the human-readable topic. */
  group: Schema.String,
  /** The file name, which carries the SSZ chart id. */
  name: ChartName,
  title: Schema.String,
  /** The pinned sszvis release the page loads. */
  version: Schema.String,
  comparable: Schema.Boolean,
});

export interface Chart extends Schema.Schema.Type<typeof Chart> {}

/** The catalogue as the export writes it to `manifest.json`. */
export const Charts = Schema.Array(Chart);
