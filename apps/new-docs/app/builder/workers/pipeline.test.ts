import { Effect } from "effect";
import { describe, expect, test } from "vitest";

import { initialSpec } from "@sszvis/chart-builder/initial-spec";
import { findRecipe } from "@sszvis/chart-builder/recipes";
import { sampleFor } from "@sszvis/chart-builder/samples";
import { summarize } from "@sszvis/chart-builder/spec";
import { generate } from "./pipeline";

/*
 * The first run loads prettier and shiki's grammars, which takes about six seconds on a CI
 * runner - past vitest's default five - and well under a second once they are loaded.
 */
const COLD_START_MS = 30_000;

describe("highlighting", () => {
  test(
    "should highlight every file when the pipeline runs",
    { timeout: COLD_START_MS },
    async () => {
      const entry = Effect.runSync(findRecipe("bar-chart-vertical"));
      const generated = await generate(entry, { ...initialSpec(summarize(entry)), features: [] });
      for (const key of ["ts", "js", "html", "csv"] as const) {
        const { raw, html } = generated[key];
        /* Per-theme variables, not inline colours, are the contract; shiki's class names are not. */
        expect(html, key).toContain("--shiki-light:");
        expect(html, key).toContain("--shiki-dark:");
        expect(raw.length, key).toBeGreaterThan(0);
      }
      expect(generated.csv.raw).toBe(sampleFor(entry.sample).csv);
      expect(generated.html.raw).toMatch(/^<!doctype html>/);
    },
  );
});
