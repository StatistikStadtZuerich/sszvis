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

export const str = (value: string) => Safe(JSON.stringify(value));

export const code = (value: string) => Safe(value);

export const comment = (value: string): Safe =>
  Safe(value.replaceAll("*/", "* /").replace(/\s+/g, " ").trim());

export type Fragments = Readonly<Record<string, readonly string[]>>;

export type Scalars = Readonly<Record<string, Safe>>;

const BLOCK = /^([ \t]*)\/\/ \{\{block:([A-Za-z][A-Za-z0-9]*)\}\}[ \t]*$/;
const SCALAR = /__([A-Z][A-Z0-9_]*)__/g;

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
