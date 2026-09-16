import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const APP = resolve(here, "..");
const HEAVY = ["prettier", "ts-blank-space", "shiki", "@shikijs"];

const isHeavy = (specifier: string) =>
  HEAVY.some((name) => specifier === name || specifier.startsWith(`${name}/`));

const IMPORT =
  /(?:import|export)[^;]{0,400}?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];

const read = (base: string): { path: string; source: string } | undefined => {
  for (const extension of EXTENSIONS) {
    try {
      const path = base + extension;
      return { path, source: readFileSync(path, "utf8") };
    } catch {
      /* next spelling */
    }
  }
  return undefined;
};

const locate = (from: string, specifier: string): string | undefined => {
  const bare = specifier.replace(/\?.*$/, "");
  if (bare.startsWith("~/")) return resolve(APP, bare.slice(2));
  if (bare.startsWith(".")) return resolve(dirname(from), bare);
  return undefined;
};

const reachable = (entry: string) => {
  const seen = new Map<string, string[]>();
  const walk = (path: string, trail: string[]) => {
    const file = read(path);
    /* An unresolved local specifier is a hole in the walk, not a module outside it. */
    if (file === undefined) {
      throw new Error(`cannot resolve ${path}\n  via ${trail.join(" -> ")}`);
    }
    if (seen.has(file.path)) return;
    seen.set(file.path, trail);
    for (const match of file.source.matchAll(IMPORT)) {
      const specifier = match[1] ?? match[2] ?? match[3];
      if (specifier === undefined) continue;
      const next = [...trail, specifier];
      const target = locate(file.path, specifier);
      if (target === undefined) seen.set(specifier, next);
      else walk(target, next);
    }
  };
  walk(entry, [entry]);
  return seen;
};

const heavyIn = (graph: ReadonlyMap<string, readonly string[]>) =>
  [...graph.keys()].filter(isHeavy).sort();

test("should reach no parser when walking the module graph from page.tsx", () => {
  const graph = reachable(resolve(here, "page.tsx"));
  const found = heavyIn(graph).map((module) => `${module} via ${graph.get(module)?.join(" -> ")}`);
  expect(found).toEqual([]);
  /* Guards the guard: if `~/` resolution rots, the emptiness above means nothing.
     A check against the real built bundle would be truer still, but costs a build. */
  const reached = [...graph.keys()].map((path) => path.replaceAll("\\", "/"));
  expect(reached.some((path) => path.endsWith("/app/components/ui/button.tsx"))).toBe(true);
});

test("should reach every heavy package when walking from the worker", () => {
  /* The packages, not their entry points: a sub-path is theirs to rename, ours only to exclude. */
  const graph = reachable(resolve(here, "workers/builder.worker.ts"));
  const packages = new Set(
    heavyIn(graph).map((name) =>
      name
        .split("/")
        .slice(0, name.startsWith("@") ? 2 : 1)
        .join("/"),
    ),
  );
  expect([...packages].sort()).toEqual(["@shikijs/langs", "prettier", "shiki", "ts-blank-space"]);
});

test("should reach no whole-grammar bundle when walking from the worker", () => {
  /* The grammars one by one: `shiki/langs` and `shiki/bundle/*` each carry every one of them. */
  const graph = reachable(resolve(here, "workers/builder.worker.ts"));
  expect(heavyIn(graph).filter((name) => /^shiki\/(?:langs|bundle)/.test(name))).toEqual([]);
  expect(heavyIn(graph)).toContain("@shikijs/langs/typescript");
});
