/**
 * Which shiki grammar to highlight an example's file with.
 *
 * Ported from the stack-effect docs app: a file's language is looked up by
 * filename first and extension second, so supporting a new kind of example file
 * is one entry here plus one in `LANGUAGES` - not a change to the plugin.
 */

/** Every grammar the examples plugin loads. Keep in step with the maps below. */
export const LANGUAGES = [
  "bash",
  "css",
  "csv",
  "html",
  "javascript",
  "json",
  "markdown",
  "typescript",
] as const;

export type Language = (typeof LANGUAGES)[number];

const byExtension: Readonly<Record<string, Language>> = {
  bash: "bash",
  css: "css",
  csv: "csv",
  htm: "html",
  html: "html",
  js: "javascript",
  json: "json",
  md: "markdown",
  mjs: "javascript",
  sh: "bash",
  ts: "typescript",
  tsv: "csv",
  txt: "markdown",
};

const byFilename: Readonly<Record<string, Language>> = {
  ".env": "bash",
  Dockerfile: "bash",
};

/** The grammar for a path, or `null` when the file should be shown unhighlighted. */
export function languageForPath(path: string): Language | null {
  const filename = path.split("/").at(-1) ?? path;
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";
  return byFilename[filename] ?? byExtension[extension] ?? null;
}
