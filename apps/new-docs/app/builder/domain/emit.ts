import { Brand, Effect, Schema } from "effect";

export class BuilderCompileError extends Schema.TaggedError<BuilderCompileError>()(
  "BuilderCompileError",
  {
    stage: Schema.Literals(["recipe", "feature", "emit", "format", "load"]),
    message: Schema.String,
  },
) {}

export type Safe = string & Brand.Brand<"Safe">;
const Safe = Brand.nominal<Safe>();

/*
 * Generated code is embedded in an inline `<script>` both in the preview frame and
 * in the exported page, where a `</script>` inside a string literal would close the
 * tag early and let the value run as markup. `<\/` is the same string to JavaScript.
 */
export const str = (value: string) => Safe(JSON.stringify(value).replaceAll("</", "<\\/"));

export const code = (value: string) => Safe(value);

/*
 * Two sequences end something around this text: the one that closes a block comment,
 * and the one that closes the preview's inline `<script>`, which the banner sits
 * inside. Both are broken with a space rather than dropped, so the text still reads
 * as the user wrote it.
 */
export const comment = (value: string): Safe =>
  Safe(value.replaceAll("*/", "* /").replaceAll("</", "< /").replace(/\s+/g, " ").trim());

export type Fragments = Readonly<Record<string, readonly string[]>>;

export type Scalars = Readonly<Record<string, Safe>>;

const BLOCK = /^([ \t]*)\/\/ \{\{block:([A-Za-z][A-Za-z0-9]*)\}\}[ \t]*$/;
const SCALAR = /__([A-Z][A-Z0-9_]*)__/g;

/**
 * The holes a body offers, read with the same eyes `fill` substitutes them. A shared
 * global regex carries its `lastIndex` into `matchAll`, which would quietly start the
 * scan mid-string, so the reading stays in here rather than the pattern going out.
 */
export const scalarHoles = (body: string): string[] =>
  Array.from(body.matchAll(SCALAR), ([, name = ""]) => name);

export function fill(
  template: string,
  scalars: Scalars,
  fragments: Fragments,
): Effect.Effect<string, BuilderCompileError> {
  const withBlocks = template
    .split("\n")
    .flatMap((line) => {
      const hole = BLOCK.exec(line);
      if (hole === null) return [line];
      const [, indent = "", name = ""] = hole;
      const lines = (fragments[name] ?? []).flatMap((fragment) => fragment.split("\n"));
      return lines.map((fragment) => (fragment.trim() === "" ? "" : indent + fragment));
    })
    .join("\n");

  const missing = new Set<string>();
  const filled = withBlocks.replaceAll(SCALAR, (_match, name: string) => {
    const value = scalars[name];
    if (value === undefined) missing.add(name);
    return value ?? "";
  });

  return missing.size === 0
    ? Effect.succeed(filled)
    : Effect.fail(
        new BuilderCompileError({
          stage: "emit",
          message: `no value for ${[...missing].join(", ")}`,
        }),
      );
}
